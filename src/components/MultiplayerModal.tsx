import React, { useState, useEffect } from 'react';
import {
  Swords,
  Users,
  Copy,
  Check,
  Zap,
  Crown,
  RefreshCw,
  Send,
  X,
  Radio,
  Flame,
  ArrowLeft,
  Trophy,
  AlertTriangle,
  Play,
  Sparkles
} from 'lucide-react';
import {
  MultiplayerRoomData,
  createMultiplayerRoom,
  joinMultiplayerRoom,
  setRoomReady,
  startMultiplayerMatch,
  sendRoomTaunt,
  completeMultiplayerMatch,
  subscribeToMultiplayerRoom,
  subscribeToOpenRooms
} from '../lib/firebase';

interface MultiplayerModalProps {
  playerName: string;
  onClose: () => void;
  onStartDuel: (room: MultiplayerRoomData, isHost: boolean) => void;
  activeDuelRoom?: MultiplayerRoomData | null;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  playerName,
  onClose,
  onStartDuel,
  activeDuelRoom
}) => {
  const [view, setView] = useState<'SELECT' | 'CREATE' | 'JOIN' | 'ROOM'>('SELECT');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [currentRoom, setCurrentRoom] = useState<MultiplayerRoomData | null>(activeDuelRoom);
  const [openRooms, setOpenRooms] = useState<MultiplayerRoomData[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tauntInput, setTauntInput] = useState('');
  const duelStartedRef = React.useRef(false);
  const [playerId] = useState(() => {
    let id = localStorage.getItem('shoot_bird_player_id');
    if (!id) {
      id = 'p_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('shoot_bird_player_id', id);
    }
    return id;
  });

  // Subscribe to live open waiting rooms in lobby
  useEffect(() => {
    const unsub = subscribeToOpenRooms((rooms) => {
      // Filter out room where current player is host if needed, or show all open rooms
      setOpenRooms(rooms);
    }, 12, setErrorMessage);
    return () => unsub();
  }, []);

  // Subscribe to active room updates
  useEffect(() => {
    if (!currentRoom?.id) return;
    const unsub = subscribeToMultiplayerRoom(currentRoom.id, (updatedRoom) => {
      if (!updatedRoom) {
        setErrorMessage('Room was closed or expired.');
        setCurrentRoom(null);
        setView('SELECT');
        return;
      }
      setCurrentRoom(updatedRoom);

      // If room status changed to in_progress and not started yet, trigger duel
      if (updatedRoom.status === 'in_progress' && !duelStartedRef.current) {
        duelStartedRef.current = true;
        onStartDuel(updatedRoom, isHost);
      }
    }, setErrorMessage);

    return () => unsub();
  }, [currentRoom?.id, isHost]);

  const handleCreateRoom = async () => {
    setLoading(true);
    setErrorMessage(null);
    const result = await createMultiplayerRoom(playerName || 'Player 1', playerId);
    setLoading(false);
    if (result.success) {
      setCurrentRoom(result.room);
      setIsHost(true);
      setView('ROOM');
    } else {
      setErrorMessage('error' in result ? result.error : 'Could not create room.');
    }
  };

  const handleJoinRoom = async (codeToJoin?: string) => {
    const targetCode = (codeToJoin || roomCodeInput).trim();
    if (!targetCode) {
      setErrorMessage('Please enter a valid 5-letter Room Code.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    const res = await joinMultiplayerRoom(targetCode, playerName || 'Challenger', playerId);
    setLoading(false);
    if (res.success && res.room) {
      setCurrentRoom(res.room);
      setIsHost(false);
      setView('ROOM');
    } else {
      setErrorMessage(res.error || 'Could not join room.');
    }
  };

  const handleCopyCode = () => {
    if (currentRoom?.roomCode) {
      navigator.clipboard.writeText(currentRoom.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleReady = async () => {
    if (!currentRoom) return;
    const currentlyReady = isHost ? currentRoom.hostReady : currentRoom.guestReady;
    await setRoomReady(currentRoom.id, isHost, !currentlyReady);
  };

  const handleHostStart = async () => {
    if (!currentRoom) return;
    if (!currentRoom.guestId) {
      setErrorMessage('Waiting for a challenger to join the room!');
      return;
    }
    setLoading(true);
    const result = await startMultiplayerMatch(currentRoom.id);
    setLoading(false);
    if (!result.success) setErrorMessage(result.error || 'Could not start the battle. Please retry.');
  };

  const handleSendTaunt = async (txt: string) => {
    if (!currentRoom) return;
    await sendRoomTaunt(currentRoom.id, playerName || 'Player', txt);
    setTauntInput('');
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-[500px] bg-slate-900 text-white rounded-3xl p-6 shadow-2xl border border-indigo-500/30 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-amber-500 text-white shadow-lg">
              <Swords className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide text-white flex items-center gap-2">
                1V1 ONLINE LOBBY
                <span className="text-[10px] uppercase font-extrabold bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" /> LIVE
                </span>
              </h2>
              <p className="text-xs text-slate-400">Join an open room or host your own 60s battle</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="my-3 p-3 bg-red-950/80 border border-red-500/40 rounded-xl text-xs text-red-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* VIEW 1: SELECT MODE / OPEN ROOMS LOBBY */}
        {view === 'SELECT' && (
          <div className="py-4 space-y-4">
            {/* Host / Create Action */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleCreateRoom}
                disabled={loading}
                className="py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 text-sm active:scale-98 transition-transform cursor-pointer border border-indigo-400/30"
              >
                <Crown className="w-4 h-4 text-amber-300" />
                <span>{loading ? 'Creating...' : 'HOST MATCH'}</span>
              </button>

              <button
                onClick={() => setView('JOIN')}
                className="py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold rounded-2xl border border-slate-700 flex items-center justify-center gap-2 text-sm active:scale-98 transition-transform cursor-pointer"
              >
                <Users className="w-4 h-4 text-sky-400" />
                <span>ENTER CODE</span>
              </button>
            </div>

            {/* Live Open Rooms List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  OPEN WAITING ROOMS ({openRooms.length})
                </span>
                <span className="text-[10px] text-slate-400">Real-time sync</span>
              </div>

              {openRooms.length === 0 ? (
                <div className="p-6 bg-slate-800/40 rounded-2xl border border-dashed border-slate-700 text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <Swords className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-300">No open matches waiting right now</div>
                  <p className="text-[11px] text-slate-400">
                    Click <strong>HOST MATCH</strong> above to create a room! Other players will see you instantly.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {openRooms.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 bg-slate-800/80 hover:bg-slate-800 rounded-2xl border border-slate-700/80 hover:border-indigo-500/50 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow">
                          👑
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-white truncate flex items-center gap-1.5">
                            {r.hostName}
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold">
                              OPEN
                            </span>
                          </div>
                          <div className="text-[10px] text-amber-400 font-mono tracking-wider">
                            CODE: <span className="font-bold">{r.roomCode}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleJoinRoom(r.roomCode)}
                        disabled={loading}
                        className="py-2 px-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow active:scale-95 transition-transform cursor-pointer shrink-0 flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>JOIN</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Rules Banner */}
            <div className="p-3 bg-indigo-950/40 rounded-xl border border-indigo-500/20 text-[11px] text-slate-300 leading-relaxed">
              ⚡ <strong>Multiplayer Rules:</strong> 60-second real-time bird hunting duel. Highest score wins! Destroy rare birds to activate power-ups.
            </div>
          </div>
        )}

        {/* VIEW 2: JOIN ROOM */}
        {view === 'JOIN' && (
          <div className="py-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                Enter 5-Letter Room Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. SKY88"
                className="w-full p-3.5 bg-slate-800 border border-slate-700 rounded-xl text-center font-black tracking-widest text-xl text-amber-400 focus:outline-none focus:border-indigo-500 uppercase"
                autoFocus
              />
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setView('SELECT')}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => handleJoinRoom()}
                disabled={loading || !roomCodeInput.trim()}
                className="flex-2 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-sm shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Joining...' : 'JOIN BATTLE'}
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: IN ROOM / LOBBY */}
        {view === 'ROOM' && currentRoom && (
          <div className="py-4 space-y-5">
            {/* Room Code Card */}
            <div className="p-3.5 bg-slate-800/90 rounded-2xl border border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  ROOM CODE
                </span>
                <span className="text-2xl font-black text-amber-400 tracking-widest">{currentRoom.roomCode}</span>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'COPIED!' : 'SHARE CODE'}</span>
              </button>
            </div>

            {/* Players Face-off Cards */}
            <div className="grid grid-cols-2 gap-3 relative">
              {/* Host (Player 1) */}
              <div className="p-4 bg-slate-800/60 rounded-2xl border border-indigo-500/30 text-center relative">
                <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-xl font-black mb-2 shadow">
                  👑
                </div>
                <div className="text-sm font-black text-white truncate">{currentRoom.hostName}</div>
                <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block mt-0.5">
                  HOST {isHost ? '(YOU)' : ''}
                </span>
                <div className={`mt-2 text-xs font-bold ${currentRoom.hostReady ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {currentRoom.hostReady ? 'READY' : 'NOT READY'}
                </div>
              </div>

              {/* VS Badge */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-red-600 border-2 border-slate-900 flex items-center justify-center text-xs font-black text-white shadow-lg">
                VS
              </div>

              {/* Guest (Player 2) */}
              <div className="p-4 bg-slate-800/60 rounded-2xl border border-purple-500/30 text-center relative">
                {currentRoom.guestId ? (
                  <>
                    <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-xl font-black mb-2 shadow">
                      🎯
                    </div>
                    <div className="text-sm font-black text-white truncate">{currentRoom.guestName}</div>
                    <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider block mt-0.5">
                      RIVAL {!isHost ? '(YOU)' : ''}
                    </span>
                    <div className={`mt-2 text-xs font-bold ${currentRoom.guestReady ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {currentRoom.guestReady ? 'READY' : 'NOT READY'}
                    </div>
                  </>
                ) : (
                  <div className="py-3 text-center">
                    <div className="w-10 h-10 mx-auto rounded-full bg-slate-700/60 flex items-center justify-center mb-2 animate-pulse text-slate-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-slate-400 font-medium block">Waiting for Challenger...</span>
                    <span className="text-[10px] text-amber-400 font-bold block mt-1">Share code to invite!</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleToggleReady}
              className={`w-full rounded-xl border py-2.5 text-xs font-black transition-colors ${
                (isHost ? currentRoom.hostReady : currentRoom.guestReady)
                  ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                  : 'border-amber-400/40 bg-amber-500/15 text-amber-200'
              }`}
            >
              {(isHost ? currentRoom.hostReady : currentRoom.guestReady) ? '✓ YOU ARE READY' : 'MARK YOURSELF READY'}
            </button>

            {/* Quick Taunts in Room */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Send Quick Taunt:</span>
              <div className="flex flex-wrap gap-1.5">
                {['🎯 Get ready!', '⚡ Too fast for you!', '🛸 Watch out for UFOs!', '🔥 Let the best win!'].map(
                  (t, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendTaunt(t)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors cursor-pointer"
                    >
                      {t}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Start Duel Button / Waiting Status */}
            <div className="pt-2">
              {isHost ? (
                <button
                  onClick={handleHostStart}
                  disabled={!currentRoom.guestId || !currentRoom.hostReady || !currentRoom.guestReady || loading}
                  className="w-full py-4 bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-base rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-98 transition-transform disabled:opacity-50 cursor-pointer"
                >
                  <Swords className="w-5 h-5 fill-current" />
                  <span>{!currentRoom.guestId ? 'WAITING FOR PLAYER 2...' : currentRoom.hostReady && currentRoom.guestReady ? 'START 60s DUEL NOW!' : 'BOTH PLAYERS MUST BE READY'}</span>
                </button>
              ) : (
                <div className="p-3.5 bg-slate-800/80 rounded-2xl text-center border border-slate-700">
                  <span className="text-xs text-amber-300 font-bold animate-pulse flex items-center justify-center gap-2">
                    <Radio className="w-4 h-4 animate-spin" /> Waiting for Host to start the battle...
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
