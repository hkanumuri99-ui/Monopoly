import React, { useState } from 'react';
import { TOKENS, PLAYER_COLORS } from '../constants';

interface LobbyProps {
  onStartGame: (players: { name: string; token: string; color: string }[]) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onStartGame }) => {
  const [playerName, setPlayerName] = useState('');
  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [lobbyPlayers, setLobbyPlayers] = useState<{ name: string; token: string; color: string }[]>([]);
  const [roomId, setRoomId] = useState('');
  const [isJoinMode, setIsJoinMode] = useState(false);

  const handleAddPlayer = () => {
    if (!playerName.trim()) return;
    if (lobbyPlayers.length >= 6) return;
    
    const color = PLAYER_COLORS[lobbyPlayers.length % PLAYER_COLORS.length];
    setLobbyPlayers([...lobbyPlayers, { name: playerName, token: selectedToken, color }]);
    setPlayerName('');
    // Rotate token selection
    const currentTokenIndex = TOKENS.indexOf(selectedToken);
    setSelectedToken(TOKENS[(currentTokenIndex + 1) % TOKENS.length]);
  };

  const handleCreateGame = () => {
    if (lobbyPlayers.length < 2) {
      alert("Need at least 2 players!");
      return;
    }
    onStartGame(lobbyPlayers);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full border border-slate-700">
        <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          PolyGemini
        </h1>
        <p className="text-center text-slate-400 mb-8">Multiplayer Property Tycoon</p>

        {!isJoinMode ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Add Player</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Player Name"
                  className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                />
                <select 
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value)}
                  className="bg-slate-900 border border-slate-600 rounded-lg px-2 py-2 text-2xl"
                >
                  {TOKENS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button 
                  onClick={handleAddPlayer}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-lg min-h-[150px]">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Lobby ({lobbyPlayers.length}/6)</h3>
              {lobbyPlayers.length === 0 ? (
                <p className="text-slate-600 text-center italic mt-4">Waiting for players...</p>
              ) : (
                <ul className="space-y-2">
                  {lobbyPlayers.map((p, i) => (
                    <li key={i} className="flex items-center justify-between bg-slate-800 px-3 py-2 rounded border border-slate-700">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{p.token}</span>
                        <span className="font-medium" style={{ color: p.color }}>{p.name}</span>
                      </div>
                      <button 
                        onClick={() => setLobbyPlayers(lobbyPlayers.filter((_, idx) => idx !== i))}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={handleCreateGame}
                disabled={lobbyPlayers.length < 2}
                className={`flex-1 py-3 rounded-lg font-bold text-lg transition-all ${
                  lobbyPlayers.length >= 2 
                  ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/50' 
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                Start Game
              </button>
            </div>
            
            <div className="text-center pt-4 border-t border-slate-700">
                <button onClick={() => setIsJoinMode(true)} className="text-blue-400 hover:underline text-sm">
                    Join an existing room?
                </button>
            </div>
          </div>
        ) : (
            <div className="space-y-6">
                 <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Room ID</label>
                    <input
                        type="text"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        placeholder="e.g. ROOM-1234"
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 mb-4"
                    />
                     <label className="block text-sm font-medium text-slate-300 mb-1">Your Name</label>
                    <input
                        type="text"
                        placeholder="Name"
                         className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 mb-4"
                    />
                    <button className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-lg font-medium">
                        Join Game
                    </button>
                    <button onClick={() => setIsJoinMode(false)} className="w-full mt-2 text-slate-400 hover:text-white">
                        Back to Create
                    </button>
                 </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;