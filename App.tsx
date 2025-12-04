import React, { useState, useEffect, useCallback, useRef } from 'react';
import Lobby from './components/Lobby';
import Board from './components/Board';
import { GameState, Player, INITIAL_MONEY, SpaceType, BoardSpace } from './types';
import { BOARD_SPACES } from './constants';
import { getGeminiCommentary } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<'lobby' | 'game'>('lobby');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll logs to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [gameState?.logs]);

  const addLog = (msg: string, type: 'info' | 'action' | 'alert' | 'ai' = 'info') => {
    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        logs: [...prev.logs, { message: msg, timestamp: Date.now(), type }]
      };
    });
  };

  const handleStartGame = (players: { name: string; token: string; color: string }[]) => {
    const newPlayers: Player[] = players.map((p, i) => ({
      id: `p-${i}`,
      name: p.name,
      token: p.token,
      color: p.color,
      money: INITIAL_MONEY,
      position: 0,
      properties: [],
      inJail: false,
      isAI: false, // Could enable AI players here
    }));

    setGameState({
      id: 'game-' + Date.now(),
      players: newPlayers,
      currentPlayerIndex: 0,
      dice: [1, 1],
      gameStarted: true,
      logs: [{ message: "Game Started! Good luck.", timestamp: Date.now(), type: 'info' }],
      winner: null,
      aiCommentary: "Welcome to PolyGemini! I'll be watching your every move.",
      isRolling: false,
    });
    setView('game');
  };

  const handleRollDice = async () => {
    if (!gameState || isProcessingTurn) return;
    setIsProcessingTurn(true);

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2;

    setGameState(prev => prev ? ({ ...prev, dice: [d1, d2], isRolling: true }) : null);

    // Animation delay
    await new Promise(r => setTimeout(r, 1000));

    setGameState(prev => prev ? ({ ...prev, isRolling: false }) : null);

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    let newPosition = (currentPlayer.position + total) % BOARD_SPACES.length;

    // Passed GO?
    if (newPosition < currentPlayer.position) {
       addLog(`${currentPlayer.name} passed GO and collected $200`, 'info');
       updatePlayerMoney(currentPlayer.id, 200);
    }

    updatePlayerPosition(currentPlayer.id, newPosition);
    addLog(`${currentPlayer.name} rolled ${total} and moved to ${BOARD_SPACES[newPosition].name}`, 'action');

    // Handle Space Logic (Simplified)
    await handleSpaceLanding(currentPlayer.id, newPosition, total);

    // AI Commentary
    try {
        const comment = await getGeminiCommentary(gameState, `Rolled ${total} and landed on ${BOARD_SPACES[newPosition].name}`, newPosition);
        setGameState(prev => prev ? ({ ...prev, aiCommentary: comment }) : null);
        if (comment) addLog(`AI: "${comment}"`, 'ai');
    } catch (e) {
        console.error("AI failed");
    }

    setIsProcessingTurn(false);
  };

  const handleNextTurn = () => {
     if(!gameState) return;
     setGameState(prev => {
        if(!prev) return null;
        const nextIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
        return {
            ...prev,
            currentPlayerIndex: nextIndex
        };
     });
  };

  const updatePlayerPosition = (playerId: string, pos: number) => {
    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        players: prev.players.map(p => p.id === playerId ? { ...p, position: pos } : p)
      };
    });
  };

  const updatePlayerMoney = (playerId: string, amount: number) => {
    setGameState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          players: prev.players.map(p => p.id === playerId ? { ...p, money: p.money + amount } : p)
        };
    });
  };

  const handleSpaceLanding = async (playerId: string, pos: number, roll: number) => {
      const space = BOARD_SPACES[pos];
      
      // Check if property is owned
      const owner = gameState?.players.find(p => p.properties.includes(pos));
      
      if (space.type === SpaceType.PROPERTY || space.type === SpaceType.RAILROAD || space.type === SpaceType.UTILITY) {
          if (owner && owner.id !== playerId) {
              // Pay Rent
              const rent = space.rent || 0; // Simplified rent logic
              addLog(`Paid $${rent} rent to ${owner.name}`, 'alert');
              updatePlayerMoney(playerId, -rent);
              updatePlayerMoney(owner.id, rent);
          } else if (!owner) {
             // Offer to buy (Automatic for this demo simplfication, or check UI)
             // For this MVP, we will handle buying via a button in the UI, so we just log here.
             addLog(`Space is unowned.`, 'info');
          }
      } else if (space.type === SpaceType.TAX) {
          const tax = space.price || 100;
          updatePlayerMoney(playerId, -tax);
          addLog(`Paid tax: $${tax}`, 'alert');
      } else if (space.id === 30) {
          // Go to Jail
          addLog("Go to Jail!", 'alert');
          updatePlayerPosition(playerId, 10);
      }
  };

  const handleBuyProperty = () => {
    if (!gameState) return;
    const player = gameState.players[gameState.currentPlayerIndex];
    const space = BOARD_SPACES[player.position];

    if (player.money >= (space.price || 0)) {
        updatePlayerMoney(player.id, -(space.price || 0));
        setGameState(prev => {
            if (!prev) return null;
            return {
                ...prev,
                players: prev.players.map(p => p.id === player.id ? { ...p, properties: [...p.properties, space.id] } : p)
            }
        });
        addLog(`${player.name} bought ${space.name}`, 'action');
    } else {
        addLog("Not enough money!", 'alert');
    }
  };

  if (view === 'lobby') {
    return <Lobby onStartGame={handleStartGame} />;
  }

  if (!gameState) return <div>Loading...</div>;

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const currentSpace = BOARD_SPACES[currentPlayer.position];
  const canBuy = (currentSpace.type === SpaceType.PROPERTY || currentSpace.type === SpaceType.RAILROAD) 
                 && !gameState.players.some(p => p.properties.includes(currentSpace.id))
                 && currentPlayer.money >= (currentSpace.price || 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row overflow-hidden">
      
      {/* Left Sidebar: Controls & Players */}
      <div className="w-full md:w-1/4 bg-slate-900 border-r border-slate-800 flex flex-col p-4 z-20 shadow-xl">
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">PolyGemini</h2>
        
        {/* Active Player Card */}
        <div className="bg-slate-800 p-4 rounded-xl border-2 border-blue-500/50 mb-6 shadow-lg">
            <div className="text-sm text-slate-400 uppercase tracking-wider mb-1">Current Turn</div>
            <div className="flex items-center gap-3 mb-3">
                <div className="text-4xl">{currentPlayer.token}</div>
                <div>
                    <div className="text-xl font-bold">{currentPlayer.name}</div>
                    <div className="text-green-400 font-mono text-lg">${currentPlayer.money}</div>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                 <button 
                    onClick={handleRollDice} 
                    disabled={isProcessingTurn}
                    className={`p-3 rounded-lg font-bold text-center transition-all ${isProcessingTurn ? 'bg-slate-700 text-slate-500' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                >
                    {isProcessingTurn ? 'Rolling...' : 'Roll Dice 🎲'}
                </button>
                <button 
                    onClick={handleNextTurn}
                    disabled={isProcessingTurn} // Simplified: usually only enabled after roll
                    className="bg-slate-700 hover:bg-slate-600 p-3 rounded-lg font-semibold"
                >
                    End Turn
                </button>
            </div>

            {canBuy && (
                <button 
                    onClick={handleBuyProperty}
                    className="w-full mt-2 bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg font-bold animate-pulse"
                >
                    Buy {currentSpace.name} for ${currentSpace.price}
                </button>
            )}

            <div className="mt-4 flex justify-center gap-4 text-3xl font-mono bg-slate-950 p-2 rounded-lg border border-slate-700">
                 <span className={`transform transition-all ${gameState.isRolling ? 'rotate-180 scale-75 opacity-50' : 'rotate-0 scale-100'}`}>{gameState.dice[0]}</span>
                 <span className={`transform transition-all ${gameState.isRolling ? '-rotate-180 scale-75 opacity-50' : 'rotate-0 scale-100'}`}>{gameState.dice[1]}</span>
            </div>
        </div>

        {/* Players List */}
        <div className="flex-1 overflow-y-auto mb-4">
             <h3 className="text-slate-500 text-sm font-semibold mb-2">Players</h3>
             <div className="space-y-2">
                 {gameState.players.map((p, i) => (
                     <div key={p.id} className={`flex items-center justify-between p-2 rounded ${i === gameState.currentPlayerIndex ? 'bg-slate-800 border border-slate-700' : 'opacity-70'}`}>
                         <div className="flex items-center gap-2">
                             <span>{p.token}</span>
                             <span className="text-sm">{p.name}</span>
                         </div>
                         <span className="text-green-500 text-sm font-mono">${p.money}</span>
                     </div>
                 ))}
             </div>
        </div>
        
        {/* Game Log */}
        <div className="h-48 bg-slate-950 rounded-lg p-3 overflow-y-auto text-xs font-mono border border-slate-800" ref={scrollRef}>
             {gameState.logs.map((log, i) => (
                 <div key={i} className={`mb-1 ${
                     log.type === 'alert' ? 'text-red-400' : 
                     log.type === 'ai' ? 'text-purple-400 italic' : 
                     log.type === 'action' ? 'text-blue-300' : 'text-slate-400'
                 }`}>
                     <span className="opacity-50">[{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}]</span> {log.message}
                 </div>
             ))}
        </div>
      </div>

      {/* Main Board Area */}
      <div className="flex-1 bg-slate-800 flex flex-col items-center justify-center p-4 relative overflow-auto">
          {/* AI Commentary Bubble */}
          <div className="absolute top-4 left-4 right-4 z-30 pointer-events-none flex justify-center">
               {gameState.aiCommentary && (
                   <div className="bg-purple-900/90 text-purple-100 px-6 py-3 rounded-full shadow-2xl backdrop-blur-sm border border-purple-500 max-w-2xl text-center">
                       <span className="mr-2">🤖</span>
                       <span className="font-medium handwritten text-lg">"{gameState.aiCommentary}"</span>
                   </div>
               )}
          </div>

          <div className="transform scale-[0.6] sm:scale-[0.7] md:scale-[0.8] lg:scale-100 origin-center transition-transform duration-500">
             <Board players={gameState.players} activeSpace={currentPlayer.position} />
          </div>
          
          <div className="mt-4 text-slate-500 text-xs text-center">
               PolyGemini Online &bull; Room: {gameState.id.split('-')[1]} &bull; {gameState.players.length} Players Connected
          </div>
      </div>

    </div>
  );
};

export default App;