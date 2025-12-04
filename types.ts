export enum SpaceType {
  PROPERTY = 'PROPERTY',
  CORNER = 'CORNER',
  CHANCE = 'CHANCE',
  TAX = 'TAX',
  UTILITY = 'UTILITY',
  RAILROAD = 'RAILROAD'
}

export enum ColorGroup {
  BROWN = 'bg-yellow-900',
  LIGHTBLUE = 'bg-sky-400',
  PINK = 'bg-pink-500',
  ORANGE = 'bg-orange-500',
  RED = 'bg-red-600',
  YELLOW = 'bg-yellow-400',
  GREEN = 'bg-green-600',
  BLUE = 'bg-blue-800',
  NONE = 'bg-gray-200'
}

export interface BoardSpace {
  id: number;
  name: string;
  type: SpaceType;
  price?: number;
  rent?: number;
  group?: ColorGroup;
  icon?: string; // Emoji or SVG path
}

export interface Player {
  id: string;
  name: string;
  token: string; // Emoji char
  color: string; // Hex for border/glow
  money: number;
  position: number;
  properties: number[]; // Array of Space IDs
  inJail: boolean;
  isAI: boolean;
}

export interface GameLog {
  message: string;
  timestamp: number;
  type: 'info' | 'action' | 'alert' | 'ai';
}

export interface GameState {
  id: string;
  players: Player[];
  currentPlayerIndex: number;
  dice: [number, number];
  gameStarted: boolean;
  logs: GameLog[];
  winner: Player | null;
  aiCommentary: string;
  isRolling: boolean;
}

export const INITIAL_MONEY = 1500;