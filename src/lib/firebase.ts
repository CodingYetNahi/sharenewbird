import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  getDoc,
  runTransaction
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// AI Studio provisions this game with a named Firestore database. Falling back
// to getFirestore(app) silently targets "(default)", which makes room reads
// report that the client is offline and prevents multiplayer rooms being made.
const databaseId = firebaseConfig.firestoreDatabaseId?.trim();
export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);

function firestoreErrorMessage(error: unknown, action: string) {
  const firestoreError = error as { code?: string; message?: string };
  const code = firestoreError?.code || '';
  if (code === 'unavailable' || code === 'failed-precondition') {
    return `Multiplayer service is temporarily unavailable while trying to ${action}. Please reconnect and retry.`;
  }
  if (code === 'permission-denied') {
    return `Multiplayer access was denied while trying to ${action}. The Firestore rules may need deployment.`;
  }
  return firestoreError?.message || `Unable to ${action}. Please try again.`;
}

function withFirestoreTimeout<T>(operation: Promise<T>, action: string, timeoutMs = 12000): Promise<T> {
  let timeoutId: ReturnType<typeof globalThis.setTimeout>;
  const timeout = new Promise<T>((_, reject) => {
    timeoutId = globalThis.setTimeout(() => reject({
      code: 'unavailable',
      message: `Timed out while trying to ${action}`,
    }), timeoutMs);
  });
  return Promise.race([operation, timeout]).finally(() => globalThis.clearTimeout(timeoutId));
}

export interface FirestoreScore {
  id?: string;
  name: string;
  score: number;
  date?: string;
  createdAt?: any;
}

const scoresCollection = collection(db, 'scores');
const roomsCollection = collection(db, 'multiplayer_rooms');
const dailyChallengesCollection = collection(db, 'daily_challenges');

export interface DailyChallengeRecord {
  progress: Record<string, number>;
  completed: boolean;
  rewardClaimed: boolean;
  date?: string;
  playerId?: string;
  playerName?: string;
  challengeId?: string;
  reward?: number;
}

export async function loadDailyChallenge(playerId: string, date: string): Promise<DailyChallengeRecord | null> {
  try {
    const snapshot = await getDoc(doc(dailyChallengesCollection, `${playerId}_${date}`));
    return snapshot.exists() ? snapshot.data() as DailyChallengeRecord : null;
  } catch (error) {
    console.warn('Daily Challenge read unavailable; gameplay continues locally.', error);
    return null;
  }
}

export async function saveDailyChallengeProgress(playerId: string, date: string, progress: Record<string, number>) {
  try {
    await setDoc(doc(dailyChallengesCollection, `${playerId}_${date}`), {
      playerId, date, challengeId: date, progress, updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.warn('Daily Challenge progress write unavailable.', error);
  }
}

/** Transactionally claims the one-per-player/day reward, preventing duplicate tabs or retries. */
export async function claimDailyChallengeReward(
  playerId: string,
  playerName: string,
  date: string,
  progress: Record<string, number>,
  reward: number,
) {
  try {
    const record = doc(dailyChallengesCollection, `${playerId}_${date}`);
    return await runTransaction(db, async transaction => {
      const snapshot = await transaction.get(record);
      if (snapshot.exists() && snapshot.data().rewardClaimed) return false;
      transaction.set(record, {
        playerId, playerName: playerName.slice(0, 20) || 'Player', date, challengeId: date,
        progress, reward: Math.max(0, Math.floor(reward)), completed: true, rewardClaimed: true,
        completedAt: serverTimestamp(), updatedAt: serverTimestamp(),
      }, { merge: true });
      return true;
    });
  } catch (error) {
    console.warn('Daily Challenge reward claim unavailable.', error);
    return false;
  }
}

export async function submitScoreToFirestore(playerName: string, score: number) {
  if (!score || score <= 0) return;
  try {
    const docRef = await addDoc(scoresCollection, {
      playerName: playerName || 'Player',
      score: Math.floor(score),
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.warn('Firestore score write fallback:', error);
  }
}

export function subscribeToLeaderboard(callback: (scores: { name: string; score: number }[]) => void, max = 15) {
  try {
    const q = query(scoresCollection, orderBy('score', 'desc'), limit(max));
    return onSnapshot(
      q,
      (snapshot) => {
        const scores = snapshot.docs.map(doc => ({
          name: doc.data().playerName || 'Player',
          score: doc.data().score || 0
        }));
        if (scores.length > 0) {
          callback(scores);
        }
      },
      (error) => {
        console.warn('Firestore subscription fallback:', error);
      }
    );
  } catch (err) {
    console.warn('Firestore subscribe err:', err);
    return () => {};
  }
}

export interface MultiplayerRoomData {
  id: string;
  roomCode: string;
  hostId: string;
  hostName: string;
  hostScore: number;
  hostCombo: number;
  hostLives: number;
  hostReady: boolean;
  guestId?: string;
  guestName?: string;
  guestScore: number;
  guestCombo: number;
  guestLives: number;
  guestReady: boolean;
  status: 'waiting' | 'in_progress' | 'completed' | 'abandoned';
  gameStartTime?: number;
  gameDuration: number;
  seed: number;
  sabotage?: { target: 'host' | 'guest'; type: 'freeze' | 'blackout'; from: string; timestamp: number };
  taunt?: { sender: string; text: string; timestamp: number };
  winner?: string;
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createMultiplayerRoom(
  hostName: string,
  hostId: string
): Promise<{ success: true; room: MultiplayerRoomData } | { success: false; error: string }> {
  try {
    for (let attempt = 0; attempt < 5; attempt++) {
      const roomCode = generateRoomCode();
      const newRoomRef = doc(roomsCollection, roomCode);
      const roomData: MultiplayerRoomData = {
        id: roomCode,
        roomCode,
        hostId,
        hostName: hostName || 'Player 1',
        hostScore: 0,
        hostCombo: 0,
        hostLives: 3,
        hostReady: false,
        guestScore: 0,
        guestCombo: 0,
        guestLives: 3,
        guestReady: false,
        status: 'waiting',
        gameDuration: 60,
        seed: Math.floor(Math.random() * 1000000)
      };

      const created = await withFirestoreTimeout(runTransaction(db, async transaction => {
        const existing = await transaction.get(newRoomRef);
        if (existing.exists()) return false;
        transaction.set(newRoomRef, {
          ...roomData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        return true;
      }), 'create a room');

      if (created) return { success: true, room: roomData };
    }
    return { success: false, error: 'Could not reserve a unique room code. Please retry.' };
  } catch (err: unknown) {
    console.error('Error creating multiplayer room:', err);
    return { success: false, error: firestoreErrorMessage(err, 'create a room') };
  }
}

export async function joinMultiplayerRoom(
  roomCodeInput: string,
  guestName: string,
  guestId: string
): Promise<{ success: boolean; room?: MultiplayerRoomData; error?: string }> {
  try {
    const cleanCode = roomCodeInput.trim().toUpperCase();
    if (!cleanCode) return { success: false, error: 'Please enter a room code' };

    const roomRef = doc(roomsCollection, cleanCode);
    const room = await withFirestoreTimeout(runTransaction(db, async transaction => {
      const roomSnap = await transaction.get(roomRef);
      if (!roomSnap.exists()) throw new Error('Room not found. Check the code and try again!');
      const data = roomSnap.data() as MultiplayerRoomData;
      if (data.hostId === guestId) throw new Error('You are already the host of this room.');
      if (data.guestId === guestId) return { ...data, id: cleanCode };
      if (data.status !== 'waiting') throw new Error('Match already in progress or completed.');
      if (data.guestId) throw new Error('Room is already full!');
      if (data.status !== 'waiting' && data.guestId !== guestId) {
        throw new Error('Match already in progress or completed.');
      }
      if (data.guestId && data.guestId !== guestId) throw new Error('Room is already full!');

      const joinedRoom: MultiplayerRoomData = {
        ...data,
        id: cleanCode,
        guestId,
        guestName: guestName || 'Player 2',
        guestScore: 0,
        guestCombo: 0,
        guestLives: 3,
        guestReady: true,
      };
      transaction.update(roomRef, {
        guestId: joinedRoom.guestId,
        guestName: joinedRoom.guestName,
        guestScore: joinedRoom.guestScore,
        guestCombo: joinedRoom.guestCombo,
        guestLives: joinedRoom.guestLives,
        guestReady: joinedRoom.guestReady,
        updatedAt: serverTimestamp()
      });
      return joinedRoom;
    }), 'join the room');

    return { success: true, room };
  } catch (err: any) {
    console.error('Error joining room:', err);
    return { success: false, error: err?.message || 'Failed to join room' };
  }
}

export async function updateRoomPlayer(
  roomId: string,
  isHost: boolean,
  score: number,
  combo: number,
  lives: number
) {
  try {
    const roomRef = doc(roomsCollection, roomId);
    if (isHost) {
      await updateDoc(roomRef, {
        hostScore: Math.floor(score),
        hostCombo: combo,
        hostLives: lives,
        updatedAt: serverTimestamp()
      });
    } else {
      await updateDoc(roomRef, {
        guestScore: Math.floor(score),
        guestCombo: combo,
        guestLives: lives,
        updatedAt: serverTimestamp()
      });
    }
  } catch (err) {
    // Non-blocking update
  }
}

export async function setRoomReady(roomId: string, isHost: boolean, ready: boolean) {
  try {
    const roomRef = doc(roomsCollection, roomId);
    if (isHost) {
      await updateDoc(roomRef, { hostReady: ready, updatedAt: serverTimestamp() });
    } else {
      await updateDoc(roomRef, { guestReady: ready, updatedAt: serverTimestamp() });
    }
  } catch (err) {
    console.warn('Set ready err:', err);
  }
}

export async function startMultiplayerMatch(roomId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const roomRef = doc(roomsCollection, roomId);
    await withFirestoreTimeout(runTransaction(db, async transaction => {
      const snapshot = await transaction.get(roomRef);
      if (!snapshot.exists()) throw new Error('Room no longer exists.');
      const room = snapshot.data() as MultiplayerRoomData;
      if (room.status !== 'waiting') throw new Error('This match has already started.');
      if (!room.guestId) throw new Error('Waiting for a challenger to join.');
      if (!room.hostReady || !room.guestReady) throw new Error('Both players must be ready.');
      transaction.update(roomRef, {
        status: 'in_progress',
        gameStartTime: Date.now() + 3000,
        hostScore: 0,
        guestScore: 0,
        hostCombo: 0,
        guestCombo: 0,
        hostLives: 3,
        guestLives: 3,
        updatedAt: serverTimestamp()
      });
    }), 'start the match');
    return { success: true };
  } catch (err: unknown) {
    console.error('Start match error:', err);
    return { success: false, error: firestoreErrorMessage(err, 'start the match') };
  }
}

export async function sendRoomSabotage(
  roomId: string,
  isHost: boolean,
  type: 'freeze' | 'blackout',
  fromName: string
) {
  try {
    const roomRef = doc(roomsCollection, roomId);
    await updateDoc(roomRef, {
      sabotage: {
        target: isHost ? 'guest' : 'host',
        type,
        from: fromName,
        timestamp: Date.now()
      },
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Sabotage err:', err);
  }
}

export async function sendRoomTaunt(roomId: string, senderName: string, text: string) {
  try {
    const roomRef = doc(roomsCollection, roomId);
    await updateDoc(roomRef, {
      taunt: {
        sender: senderName,
        text,
        timestamp: Date.now()
      },
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Taunt err:', err);
  }
}

export async function completeMultiplayerMatch(roomId: string, winnerName: string = '') {
  try {
    const roomRef = doc(roomsCollection, roomId);
    await updateDoc(roomRef, {
      status: 'completed',
      ...(winnerName ? { winner: winnerName } : {}),
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Complete match err:', err);
  }
}

export function subscribeToMultiplayerRoom(
  roomId: string,
  callback: (room: MultiplayerRoomData | null) => void,
  onError?: (message: string) => void
) {
  try {
    const roomRef = doc(roomsCollection, roomId);
    return onSnapshot(
      roomRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as MultiplayerRoomData);
        } else {
          callback(null);
        }
      },
      (err) => {
        console.warn('Room subscription error:', err);
        onError?.(firestoreErrorMessage(err, 'sync the room'));
      }
    );
  } catch (err) {
    console.warn('Subscribe room fail:', err);
    return () => {};
  }
}

export function subscribeToOpenRooms(
  callback: (rooms: MultiplayerRoomData[]) => void,
  max = 12,
  onError?: (message: string) => void
) {
  try {
    const q = query(
      roomsCollection,
      where('status', '==', 'waiting'),
      limit(max)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const rooms: MultiplayerRoomData[] = [];
        snapshot.forEach((d) => {
          const r = d.data() as MultiplayerRoomData;
          // Only show rooms where guest hasn't occupied yet or waiting for player
          if (!r.guestId) {
            rooms.push({ ...r, id: d.id });
          }
        });
        callback(rooms);
      },
      (err) => {
        console.warn('Open rooms subscribe error:', err);
        onError?.(firestoreErrorMessage(err, 'load open rooms'));
      }
    );
  } catch (err) {
    console.warn('Open rooms subscribe err:', err);
    return () => {};
  }
}
