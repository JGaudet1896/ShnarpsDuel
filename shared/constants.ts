/**
 * Shared Constants for ShnarpsDuel
 * Single source of truth for all game constants used by client and server
 */

import type { Rank } from './types';

// =============================================================================
// GAME RULES
// =============================================================================

export const GAME = {
  /** Starting score for all players */
  STARTING_SCORE: 16,

  /** Score at or below which a player wins */
  WINNING_SCORE: 0,

  /** Score above which a player is eliminated */
  ELIMINATION_SCORE: 32,

  /** Number of cards dealt to each player per round */
  CARDS_PER_HAND: 5,

  /** Maximum number of players in a game */
  MAX_PLAYERS: 8,

  /** Minimum number of players to start a game */
  MIN_PLAYERS: 2,

  /** Maximum bid value */
  MAX_BID: 5,

  /** Minimum bid value (0 = punt) */
  MIN_BID: 0,

  /** Points added to score when punting fails (took tricks) or bid not met */
  PUNT_PENALTY: 5,

  /** Points subtracted per trick for sitting players who get tricked */
  SIT_PENALTY: 1,

  /** Number of consecutive sits before musty rule forces play */
  MAX_CONSECUTIVE_SITS: 2,

  /** Number of tricks per round */
  TRICKS_PER_ROUND: 5,
} as const;

// =============================================================================
// TIMING
// =============================================================================

export const TIMING = {
  /** Delay before AI takes action (ms) */
  AI_TURN_DELAY: 800,

  /** Delay for trick complete animation before next trick (ms) */
  TRICK_COMPLETE_DELAY: 1500,

  /** Default turn time limit in seconds (0 = no limit) */
  TURN_TIME_LIMIT_DEFAULT: 30,

  /** Time before inactive room is cleaned up (ms) - 30 minutes */
  ROOM_CLEANUP_TIMEOUT: 30 * 60 * 1000,

  /** Delay before auto-playing for disconnected player (ms) */
  DISCONNECT_AUTO_PLAY_DELAY: 2000,

  /** Minimum delay between AI actions to feel natural (ms) */
  AI_MIN_DELAY: 500,

  /** Maximum delay between AI actions (ms) */
  AI_MAX_DELAY: 1500,
} as const;

// =============================================================================
// CARD VALUES
// =============================================================================

/** Numeric values for card ranks (Ace high) */
export const RANK_VALUES: Record<Rank, number> = {
  'A': 14,
  'K': 13,
  'Q': 12,
  'J': 11,
  '10': 10,
  '9': 9,
  '8': 8,
  '7': 7,
  '6': 6,
  '5': 5,
  '4': 4,
  '3': 3,
  '2': 2,
};

/** Order of suits for sorting (spades first) */
export const SUIT_ORDER = {
  'spades': 0,
  'hearts': 1,
  'diamonds': 2,
  'clubs': 3,
} as const;

// =============================================================================
// ROOM CODES
// =============================================================================

export const ROOM = {
  /** Characters used for room code generation (excluding similar-looking chars) */
  CODE_CHARS: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',

  /** Length of room codes */
  CODE_LENGTH: 6,
} as const;

// =============================================================================
// WEBSOCKET
// =============================================================================

export const WS = {
  /** Maximum message size in bytes */
  MAX_MESSAGE_SIZE: 1024 * 64, // 64KB

  /** Ping interval for keep-alive (ms) */
  PING_INTERVAL: 30000,

  /** Timeout for pong response (ms) */
  PONG_TIMEOUT: 10000,
} as const;

// =============================================================================
// UI
// =============================================================================

export const UI = {
  /** Suit symbols for display */
  SUIT_SYMBOLS: {
    hearts: '\u2665',    // ♥
    diamonds: '\u2666',  // ♦
    clubs: '\u2663',     // ♣
    spades: '\u2660',    // ♠
  } as const,

  /** Suit colors */
  SUIT_COLORS: {
    hearts: '#dc2626',   // red
    diamonds: '#dc2626', // red
    clubs: '#1f2937',    // dark gray/black
    spades: '#1f2937',   // dark gray/black
  } as const,
} as const;

// =============================================================================
// DEFAULT SETTINGS
// =============================================================================

export const DEFAULT_SETTINGS = {
  startingScore: GAME.STARTING_SCORE,
  winningScore: GAME.WINNING_SCORE,
  eliminationScore: GAME.ELIMINATION_SCORE,
  turnTimeLimit: 0, // No time limit by default
  moneyPerPoint: 0.25,
  moneyPerPunt: 1.0,
} as const;

// =============================================================================
// PHASE TRANSITIONS (valid state machine transitions)
// =============================================================================

export const VALID_PHASE_TRANSITIONS: Record<string, string[]> = {
  setup: ['bidding'],
  bidding: ['trump_selection'],
  trump_selection: ['sit_pass', 'hand_play'], // Skip sit_pass if bid=1 or trump=spades
  sit_pass: ['everyone_sat', 'hand_play'],
  everyone_sat: ['hand_play'],
  hand_play: ['trick_complete'],
  trick_complete: ['hand_play', 'round_complete'],
  round_complete: ['bidding', 'game_over'],
  game_over: ['setup'],
};
