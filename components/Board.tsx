import React, { useMemo } from 'react';
import { BOARD_SPACES } from '../constants';
import { BoardSpace, Player, SpaceType } from '../types';

interface BoardProps {
  players: Player[];
  activeSpace: number | null;
}

const Board: React.FC<BoardProps> = ({ players, activeSpace }) => {
  // We need to map the 0-39 linear index to grid positions (11x11)
  // Bottom Row: 10 down to 0 (Grid Row 11, Cols 1-11)
  // Left Col: 10 up to 20 (Grid Col 1, Rows 11-1)
  // Top Row: 20 to 30 (Grid Row 1, Cols 1-11)
  // Right Col: 30 to 0 (Grid Col 11, Rows 1-11)
  
  const getGridPosition = (index: number) => {
    // Standard Monopoly is 10 spaces per side + corners. 
    // Grid 1 to 11.
    
    // Bottom Row (0-10): Row 11. Col starts at 11 (index 0) goes to 1 (index 10).
    if (index >= 0 && index <= 10) {
      return { row: 11, col: 11 - index };
    }
    // Left Column (11-20): Col 1. Row starts at 10 (index 11) goes to 1 (index 20).
    if (index >= 11 && index <= 20) {
      return { row: 11 - (index - 10), col: 1 };
    }
    // Top Row (21-30): Row 1. Col starts at 2 (index 21) goes to 11 (index 30, actually index 30 is corner).
    // Wait, typical ordering:
    // 0 is Bottom Right.
    // 10 is Bottom Left.
    // 20 is Top Left.
    // 30 is Top Right.
    
    // Fix logic:
    // 0 (GO) -> Row 11, Col 11
    // 1-9 -> Row 11, Col 10..2
    // 10 (Jail) -> Row 11, Col 1
    // 11-19 -> Row 10..2, Col 1
    // 20 (Free Parking) -> Row 1, Col 1
    // 21-29 -> Row 1, Col 2..10
    // 30 (Go To Jail) -> Row 1, Col 11
    // 31-39 -> Row 2..10, Col 11
    
    if (index === 0) return { row: 11, col: 11 };
    if (index > 0 && index < 10) return { row: 11, col: 11 - index };
    if (index === 10) return { row: 11, col: 1 };
    if (index > 10 && index < 20) return { row: 11 - (index - 10), col: 1 };
    if (index === 20) return { row: 1, col: 1 };
    if (index > 20 && index < 30) return { row: 1, col: 1 + (index - 20) };
    if (index === 30) return { row: 1, col: 11 };
    if (index > 30) return { row: 1 + (index - 30), col: 11 };
    
    return { row: 1, col: 1 };
  };

  const renderSpace = (space: BoardSpace) => {
    const pos = getGridPosition(space.id);
    const isCorner = space.type === SpaceType.CORNER;
    const isActive = activeSpace === space.id;
    
    // Determine occupants
    const occupants = players.filter(p => p.position === space.id);

    // Calculate grid spans needed? No, purely 1x1 cells in an 11x11 grid is easiest if we assume uniform size
    // But corners are often bigger. Let's stick to uniform 11x11 for simplicity of implementation.

    return (
      <div
        key={space.id}
        className={`relative border border-slate-700 bg-slate-100 text-slate-900 flex flex-col justify-between
          ${isActive ? 'ring-4 ring-yellow-400 z-10' : ''}
          ${isCorner ? 'p-2' : 'p-[2px]'}
          transition-all duration-300
        `}
        style={{
          gridRow: pos.row,
          gridColumn: pos.col,
          fontSize: '0.6rem',
        }}
      >
        {/* Color Strip (Top for bottom row, Right for left col? Simplified: Top) */}
        {!isCorner && space.group && (
           <div className={`h-1/4 w-full ${space.group} border-b border-slate-300`}></div>
        )}
        
        <div className="flex-1 flex flex-col items-center justify-center text-center leading-tight p-0.5">
            {space.icon && <div className="text-lg">{space.icon}</div>}
            <div className="font-bold truncate w-full">{space.name}</div>
            {space.price && <div className="text-slate-500">${space.price}</div>}
        </div>

        {/* Players on this space */}
        <div className="absolute inset-0 flex items-center justify-center flex-wrap gap-1 pointer-events-none p-1">
          {occupants.map((p, i) => (
             <div 
                key={p.id}
                className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-sm border-2 transform transition-transform duration-500"
                style={{ 
                    borderColor: p.color, 
                    zIndex: 20 + i,
                    transform: `translate(${i * 2}px, ${i * -2}px)`
                }}
                title={p.name}
             >
                {p.token}
             </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relative p-2 bg-slate-800 rounded-xl shadow-2xl overflow-hidden" style={{ width: '800px', height: '800px' }}>
       {/* The Center Logo Area */}
       <div 
         className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0"
         style={{ top: '10%', bottom: '10%', left: '10%', right: '10%' }}
       >
          <div className="bg-slate-900/10 w-full h-full rounded-lg flex flex-col items-center justify-center transform -rotate-45 opacity-20">
             <h1 className="text-9xl font-black text-white tracking-tighter">GEMINI</h1>
             <h2 className="text-6xl font-bold text-blue-400">TYCOON</h2>
          </div>
       </div>

      <div className="grid grid-cols-11 grid-rows-11 h-full w-full gap-0.5 bg-slate-900 border-4 border-slate-900">
        {BOARD_SPACES.map(renderSpace)}
      </div>
    </div>
  );
};

export default Board;