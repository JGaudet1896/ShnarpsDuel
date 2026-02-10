/**
 * WebSocket Message Types for ShnarpsDuel
 * Defines all message types for client-server communication
 */

import type {
  Card,
  Player,
  GamePhase,
  Suit,
  SerializedPlayer,
  SerializedGameState,
  AIDifficulty,
  TrickPlay,
  GameSettings,
} from './types';

// =============================================================================
// ERROR CODES
// =============================================================================

export const ErrorCode = {
  // Room errors
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  ROOM_FULL: 'ROOM_FULL',
  ROOM_CLOSED: 'ROOM_CLOSED',

  // Game state errors
  GAME_ALREADY_STARTED: 'GAME_ALREADY_STARTED',
  GAME_NOT_STARTED: 'GAME_NOT_STARTED',
  NOT_ENOUGH_PLAYERS: 'NOT_ENOUGH_PLAYERS',

  // Player errors
  PLAYER_NOT_FOUND: 'PLAYER_NOT_FOUND',
  NOT_YOUR_TURN: 'NOT_YOUR_TURN',
  NOT_HOST: 'NOT_HOST',
  PLAYER_DISCONNECTED: 'PLAYER_DISCONNECTED',

  // Action errors
  INVALID_ACTION: 'INVALID_ACTION',
  INVALID_BID: 'INVALID_BID',
  INVALID_CARD: 'INVALID_CARD',
  INVALID_DECISION: 'INVALID_DECISION',
  MUST_FOLLOW_SUIT: 'MUST_FOLLOW_SUIT',
  CARD_NOT_IN_HAND: 'CARD_NOT_IN_HAND',

  // Sit/Pass errors
  CANNOT_SIT_ON_ONE: 'CANNOT_SIT_ON_ONE',
  CANNOT_SIT_ON_SPADES: 'CANNOT_SIT_ON_SPADES',
  MUSTY_MUST_PLAY: 'MUSTY_MUST_PLAY',
  BIDDER_MUST_PLAY: 'BIDDER_MUST_PLAY',

  // Connection errors
  INVALID_MESSAGE: 'INVALID_MESSAGE',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// =============================================================================
// CLIENT → SERVER MESSAGES
// =============================================================================

export interface CreateRoomMessage {
  type: 'CREATE_ROOM';
  playerName: string;
  settings?: Partial<GameSettings>;
}

export interface JoinRoomMessage {
  type: 'JOIN_ROOM';
  roomCode: string;
  playerName: string;
}

export interface RejoinRoomMessage {
  type: 'REJOIN_ROOM';
  roomCode: string;
  playerId: string;
}

export interface AddAIMessage {
  type: 'ADD_AI';
  difficulty: AIDifficulty;
}

export interface RemovePlayerMessage {
  type: 'REMOVE_PLAYER';
  playerId: string;
}

export interface StartGameMessage {
  type: 'START_GAME';
}

export interface GameActionMessage {
  type: 'GAME_ACTION';
  action: 'bid' | 'trump' | 'sitpass' | 'playcard' | 'penalty' | 'sync_state';
  payload: unknown;
}

// Specific typed action messages
export interface BidActionMessage {
  type: 'GAME_ACTION';
  action: 'bid';
  payload: {
    playerId: string;
    bid: number;
  };
}

export interface TrumpActionMessage {
  type: 'GAME_ACTION';
  action: 'trump';
  payload: {
    suit: Suit;
  };
}

export interface SitPassActionMessage {
  type: 'GAME_ACTION';
  action: 'sitpass';
  payload: {
    playerId: string;
    decision: 'sit' | 'play';
  };
}

export interface PlayCardActionMessage {
  type: 'GAME_ACTION';
  action: 'playcard';
  payload: {
    playerId: string;
    card: Card;
  };
}

export interface PenaltyActionMessage {
  type: 'GAME_ACTION';
  action: 'penalty';
  payload: {
    playerId: string;
  };
}

export interface SyncStateActionMessage {
  type: 'GAME_ACTION';
  action: 'sync_state';
  payload: {
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
  };
}

/** Union of all client → server messages */
export type ClientMessage =
  | CreateRoomMessage
  | JoinRoomMessage
  | RejoinRoomMessage
  | AddAIMessage
  | RemovePlayerMessage
  | StartGameMessage
  | GameActionMessage;

/** Union of typed game action messages */
export type TypedGameActionMessage =
  | BidActionMessage
  | TrumpActionMessage
  | SitPassActionMessage
  | PlayCardActionMessage
  | PenaltyActionMessage
  | SyncStateActionMessage;

// =============================================================================
// SERVER → CLIENT MESSAGES
// =============================================================================

export interface RoomCreatedMessage {
  type: 'ROOM_CREATED';
  roomId: string;
  playerId: string;
}

export interface JoinedRoomMessage {
  type: 'JOINED_ROOM';
  roomId: string;
  playerId: string;
  players: SerializedPlayer[];
  isHost: boolean;
}

export interface RejoinedRoomMessage {
  type: 'REJOINED_ROOM';
  roomId: string;
  playerId: string;
  players: SerializedPlayer[];
  gameState: SerializedGameState | null;
  isHost: boolean;
}

export interface PlayerJoinedMessage {
  type: 'PLAYER_JOINED';
  player: SerializedPlayer;
}

export interface PlayerLeftMessage {
  type: 'PLAYER_LEFT';
  playerId: string;
}

export interface PlayerDisconnectedMessage {
  type: 'PLAYER_DISCONNECTED';
  playerId: string;
}

export interface PlayerReconnectedMessage {
  type: 'PLAYER_RECONNECTED';
  playerId: string;
}

export interface HostTransferredMessage {
  type: 'HOST_TRANSFERRED';
  newHostId: string;
}

export interface RoomClosedMessage {
  type: 'ROOM_CLOSED';
}

export interface GameStartedMessage {
  type: 'GAME_STARTED';
  players: SerializedPlayer[];
  gameState: SerializedGameState;
}

export interface GameStateSyncMessage {
  type: 'GAME_STATE_SYNC';
  players: SerializedPlayer[];
  gameState: SerializedGameState;
  localPlayerId?: string;
  isHost?: boolean;
  turnTimeRemaining?: number | null;
}

export interface GameStateUpdateMessage {
  type: 'GAME_STATE_UPDATE';
  action: string;
  payload: unknown;
}

export interface TurnTimerStartMessage {
  type: 'TURN_TIMER_START';
  timeLimit: number;
  currentPlayerId: string;
}

export interface ErrorMessage {
  type: 'ERROR';
  code?: ErrorCode;
  message: string;
}

/** Union of all server → client messages */
export type ServerMessage =
  | RoomCreatedMessage
  | JoinedRoomMessage
  | RejoinedRoomMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | PlayerDisconnectedMessage
  | PlayerReconnectedMessage
  | HostTransferredMessage
  | RoomClosedMessage
  | GameStartedMessage
  | GameStateSyncMessage
  | GameStateUpdateMessage
  | TurnTimerStartMessage
  | ErrorMessage;

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Check if an unknown value is a valid client message
 */
export function isClientMessage(msg: unknown): msg is ClientMessage {
  if (typeof msg !== 'object' || msg === null) return false;
  if (!('type' in msg)) return false;

  const type = (msg as { type: unknown }).type;
  return (
    type === 'CREATE_ROOM' ||
    type === 'JOIN_ROOM' ||
    type === 'REJOIN_ROOM' ||
    type === 'ADD_AI' ||
    type === 'REMOVE_PLAYER' ||
    type === 'START_GAME' ||
    type === 'GAME_ACTION'
  );
}

/**
 * Check if an unknown value is a valid server message
 */
export function isServerMessage(msg: unknown): msg is ServerMessage {
  if (typeof msg !== 'object' || msg === null) return false;
  if (!('type' in msg)) return false;

  const type = (msg as { type: unknown }).type;
  return (
    type === 'ROOM_CREATED' ||
    type === 'JOINED_ROOM' ||
    type === 'REJOINED_ROOM' ||
    type === 'PLAYER_JOINED' ||
    type === 'PLAYER_LEFT' ||
    type === 'PLAYER_DISCONNECTED' ||
    type === 'PLAYER_RECONNECTED' ||
    type === 'HOST_TRANSFERRED' ||
    type === 'ROOM_CLOSED' ||
    type === 'GAME_STARTED' ||
    type === 'GAME_STATE_SYNC' ||
    type === 'GAME_STATE_UPDATE' ||
    type === 'TURN_TIMER_START' ||
    type === 'ERROR'
  );
}

/**
 * Check if a message is a game action message
 */
export function isGameActionMessage(msg: unknown): msg is GameActionMessage {
  if (typeof msg !== 'object' || msg === null) return false;
  if (!('type' in msg) || !('action' in msg)) return false;

  const { type, action } = msg as { type: unknown; action: unknown };
  if (type !== 'GAME_ACTION') return false;

  return (
    action === 'bid' ||
    action === 'trump' ||
    action === 'sitpass' ||
    action === 'playcard' ||
    action === 'penalty' ||
    action === 'sync_state'
  );
}

/**
 * Check if a message is an error message
 */
export function isErrorMessage(msg: unknown): msg is ErrorMessage {
  if (typeof msg !== 'object' || msg === null) return false;
  const { type } = msg as { type?: unknown };
  return type === 'ERROR';
}

// =============================================================================
// MESSAGE CREATORS (for type-safe message construction)
// =============================================================================

export const createClientMessage = {
  createRoom: (playerName: string, settings?: Partial<GameSettings>): CreateRoomMessage => ({
    type: 'CREATE_ROOM',
    playerName,
    settings,
  }),

  joinRoom: (roomCode: string, playerName: string): JoinRoomMessage => ({
    type: 'JOIN_ROOM',
    roomCode,
    playerName,
  }),

  rejoinRoom: (roomCode: string, playerId: string): RejoinRoomMessage => ({
    type: 'REJOIN_ROOM',
    roomCode,
    playerId,
  }),

  addAI: (difficulty: AIDifficulty): AddAIMessage => ({
    type: 'ADD_AI',
    difficulty,
  }),

  removePlayer: (playerId: string): RemovePlayerMessage => ({
    type: 'REMOVE_PLAYER',
    playerId,
  }),

  startGame: (): StartGameMessage => ({
    type: 'START_GAME',
  }),

  bid: (playerId: string, bid: number): BidActionMessage => ({
    type: 'GAME_ACTION',
    action: 'bid',
    payload: { playerId, bid },
  }),

  trump: (suit: Suit): TrumpActionMessage => ({
    type: 'GAME_ACTION',
    action: 'trump',
    payload: { suit },
  }),

  sitPass: (playerId: string, decision: 'sit' | 'play'): SitPassActionMessage => ({
    type: 'GAME_ACTION',
    action: 'sitpass',
    payload: { playerId, decision },
  }),

  playCard: (playerId: string, card: Card): PlayCardActionMessage => ({
    type: 'GAME_ACTION',
    action: 'playcard',
    payload: { playerId, card },
  }),
};

export const createServerMessage = {
  error: (message: string, code?: ErrorCode): ErrorMessage => ({
    type: 'ERROR',
    message,
    code,
  }),

  roomCreated: (roomId: string, playerId: string): RoomCreatedMessage => ({
    type: 'ROOM_CREATED',
    roomId,
    playerId,
  }),

  turnTimerStart: (timeLimit: number, currentPlayerId: string): TurnTimerStartMessage => ({
    type: 'TURN_TIMER_START',
    timeLimit,
    currentPlayerId,
  }),
};
