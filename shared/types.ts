/**
 * Shared Type Definitions for ShnarpsDuel
 * Single source of truth for all game types used by client and server
 */

// =============================================================================
// CARD TYPES
// =============================================================================

export const Suit = {
  HEARTS: 'hearts',
  DIAMONDS: 'diamonds',
  CLUBS: 'clubs',
  SPADES: 'spades',
} as const;

export type Suit = (typeof Suit)[keyof typeof Suit];

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

export const Rank = {
  ACE: 'A',
  KING: 'K',
  QUEEN: 'Q',
  JACK: 'J',
  TEN: '10',
  NINE: '9',
  EIGHT: '8',
  SEVEN: '7',
  SIX: '6',
  FIVE: '5',
  FOUR: '4',
  THREE: '3',
  TWO: '2',
} as const;

export type Rank = (typeof Rank)[keyof typeof Rank];

export const RANKS: Rank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number; // For comparison: A=14, K=13, Q=12, J=11, 10-2 = face value
}

// A play within a trick
export interface TrickPlay {
  playerId: string;
  card: Card;
}

// =============================================================================
// PLAYER TYPES
// =============================================================================

export interface PlayerAvatar {
  color: string;
  icon: string;
}

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  isActive: boolean;
  consecutiveSits: number;
  isAI: boolean;
  aiDifficulty?: AIDifficulty;
  avatar?: PlayerAvatar;
  wallet?: number;
  punts?: number; // Track total punts across game
  isConnected?: boolean; // Track if player is connected in multiplayer
}

// =============================================================================
// GAME PHASE
// =============================================================================

export const GamePhase = {
  SETUP: 'setup',
  BIDDING: 'bidding',
  TRUMP_SELECTION: 'trump_selection',
  SIT_PASS: 'sit_pass',
  EVERYONE_SAT: 'everyone_sat',
  HAND_PLAY: 'hand_play',
  TRICK_COMPLETE: 'trick_complete',
  ROUND_COMPLETE: 'round_complete',
  GAME_OVER: 'game_over',
} as const;

export type GamePhase = (typeof GamePhase)[keyof typeof GamePhase];

// All valid game phases as array
export const GAME_PHASES: GamePhase[] = [
  'setup',
  'bidding',
  'trump_selection',
  'sit_pass',
  'everyone_sat',
  'hand_play',
  'trick_complete',
  'round_complete',
  'game_over',
];

// =============================================================================
// ROUND HISTORY
// =============================================================================

export interface RoundHistory {
  round: number;
  bids: Map<string, number>;
  trumpSuit: Suit | null;
  highestBidder: string | null;
  playingPlayers: string[];
  tricksWon: Map<string, number>;
  scoreChanges: Map<string, number>;
  finalScores: Map<string, number>;
  punts?: Map<string, number>; // Track who punted this round
  moneyChanges?: Map<string, number>;
  finalWallets?: Map<string, number>;
}

// =============================================================================
// GAME STATE
// =============================================================================

export interface GameState {
  gamePhase: GamePhase;
  players: Player[];
  eliminatedPlayers: Player[]; // Players removed from game (score > 32)
  currentPlayerIndex: number;
  dealerIndex: number;
  deck: Card[];
  currentTrick: TrickPlay[];
  completedTricks: TrickPlay[][];
  bids: Map<string, number>;
  trumpSuit: Suit | null;
  highestBidder: string | null;
  playingPlayers: Set<string>;
  mustyPlayers: Set<string>;
  scores: Map<string, number>;
  round: number;
  trickNumber: number;
  history: RoundHistory[];
  lastTrickWinner: string | null;
}

// =============================================================================
// GAME ACTIONS
// =============================================================================

export type SitPassDecision = 'sit' | 'play';

export interface BidAction {
  action: 'bid';
  payload: {
    playerId: string;
    bid: number;
  };
}

export interface TrumpAction {
  action: 'trump';
  payload: {
    suit: Suit;
  };
}

export interface SitPassAction {
  action: 'sitpass';
  payload: {
    playerId: string;
    decision: SitPassDecision;
  };
}

export interface PlayCardAction {
  action: 'playcard';
  payload: {
    playerId: string;
    card: Card;
  };
}

export interface PenaltyAction {
  action: 'penalty';
  payload: {
    playerId: string;
  };
}

export interface SyncStateAction {
  action: 'sync_state';
  payload: SyncStatePayload;
}

export type GameAction =
  | BidAction
  | TrumpAction
  | SitPassAction
  | PlayCardAction
  | PenaltyAction
  | SyncStateAction;

export type GameActionType = GameAction['action'];

// =============================================================================
// SYNC STATE PAYLOAD (for host → server state sync)
// =============================================================================

export interface SyncStatePayload {
  gamePhase?: GamePhase;
  currentPlayerIndex?: number;
  scores?: Record<string, number>;
  playingPlayers?: string[];
  mustyPlayers?: string[];
  currentTrick?: TrickPlay[];
  completedTricks?: TrickPlay[][];
  lastTrickWinner?: string | null;
  round?: number;
  trickNumber?: number;
  players?: Array<{
    id: string;
    hand?: Card[];
    consecutiveSits?: number;
    isActive?: boolean;
    punts?: number;
    wallet?: number;
  }>;
}

// =============================================================================
// GAME ROOM (Server-side)
// =============================================================================

export interface GameRoomState {
  gamePhase: GamePhase;
  currentPlayerIndex: number;
  dealerIndex: number;
  deck: Card[];
  currentTrick: TrickPlay[];
  completedTricks: TrickPlay[][];
  bids: Map<string, number>;
  trumpSuit: Suit | null;
  highestBidder: string | null;
  playingPlayers: Set<string>;
  mustyPlayers: Set<string>;
  scores: Map<string, number>;
  round: number;
  trickNumber: number;
  lastTrickWinner: string | null;
}

// =============================================================================
// SERIALIZED TYPES (for JSON transport)
// =============================================================================

// Serialized version of GameRoomState for WebSocket transport
export interface SerializedGameState {
  gamePhase: GamePhase;
  currentPlayerIndex: number;
  dealerIndex: number;
  currentTrick: TrickPlay[];
  completedTricks: TrickPlay[][];
  bids: Record<string, number>;
  trumpSuit: Suit | null;
  highestBidder: string | null;
  playingPlayers: string[];
  mustyPlayers: string[];
  scores: Record<string, number>;
  round: number;
  trickNumber: number;
  lastTrickWinner: string | null;
}

// Serialized player data for transport
export interface SerializedPlayer {
  id: string;
  name: string;
  hand: Card[];
  isActive: boolean;
  consecutiveSits: number;
  isAI: boolean;
  aiDifficulty?: AIDifficulty;
  avatar?: PlayerAvatar;
  wallet?: number;
  punts?: number;
  isConnected?: boolean;
}

// Full room state sent to clients
export interface SerializedRoomState {
  roomId: string;
  players: SerializedPlayer[];
  gameState: SerializedGameState;
  localPlayerId: string | null;
  isHost: boolean;
  turnTimeRemaining: number | null;
}

// =============================================================================
// VALIDATION RESULT
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
}

// =============================================================================
// GAME SETTINGS
// =============================================================================

export interface GameSettings {
  startingScore: number;
  winningScore: number;
  eliminationScore: number;
  turnTimeLimit: number; // seconds, 0 = no limit
  moneyPerPoint: number;
  moneyPerPunt: number;
}

// =============================================================================
// SERVER-SIDE GAME ROOM
// =============================================================================

/**
 * Server-side player with optional WebSocket connection.
 * The ws property is typed as `unknown` to avoid coupling shared types to Node.js WebSocket.
 * Server code should cast to the appropriate WebSocket type.
 */
export interface ServerPlayer extends Player {
  ws?: unknown;
}

/**
 * Server-side game room state.
 * Used by websocket.ts and gameLoop.ts.
 */
export interface ServerGameRoom {
  id: string;
  players: Map<string, ServerPlayer>;
  spectatorWs?: unknown;
  gameState: {
    gamePhase: GamePhase;
    currentPlayerIndex: number;
    dealerIndex: number;
    deck: Card[];
    currentTrick: TrickPlay[];
    completedTricks: TrickPlay[][];
    bids: Map<string, number>;
    trumpSuit: Suit | null;
    highestBidder: string | null;
    playingPlayers: Set<string>;
    mustyPlayers: Set<string>;
    scores: Map<string, number>;
    round: number;
  };
  host: string;
  createdAt: number;
  turnTimer?: unknown; // NodeJS.Timeout
  turnTimeLimit: number;
  turnStartTime?: number;
  // Race condition prevention
  stateLocked: boolean;
  aiProcessing: boolean;
  aiTimeouts: Set<unknown>; // Set<NodeJS.Timeout>
  stateLockTimeout?: unknown; // NodeJS.Timeout
}
