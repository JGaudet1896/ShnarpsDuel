/**
 * Validation Layer for ShnarpsDuel
 * Zod schemas and game rule validators
 */

import { z } from 'zod';
import { GAME } from './constants';
import type { Card, Suit, ValidationResult, Player, TrickPlay } from './types';

// =============================================================================
// ZOD SCHEMAS - Card Types
// =============================================================================

export const SuitSchema = z.enum(['hearts', 'diamonds', 'clubs', 'spades']);

export const RankSchema = z.enum([
  'A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'
]);

export const CardSchema = z.object({
  suit: SuitSchema,
  rank: RankSchema,
  value: z.number().int().min(2).max(14),
});

export const TrickPlaySchema = z.object({
  playerId: z.string().min(1),
  card: CardSchema,
});

// =============================================================================
// ZOD SCHEMAS - Game Actions
// =============================================================================

export const BidPayloadSchema = z.object({
  playerId: z.string().min(1),
  bid: z.number().int().min(GAME.MIN_BID).max(GAME.MAX_BID),
});

export const TrumpPayloadSchema = z.object({
  suit: SuitSchema,
});

export const SitPassPayloadSchema = z.object({
  playerId: z.string().min(1),
  decision: z.enum(['sit', 'play']),
});

export const PlayCardPayloadSchema = z.object({
  playerId: z.string().min(1),
  card: CardSchema,
});

export const PenaltyPayloadSchema = z.object({
  playerId: z.string().min(1),
});

export const SyncStatePayloadSchema = z.object({
  gamePhase: z.string().optional(),
  currentPlayerIndex: z.number().int().optional(),
  scores: z.record(z.string(), z.number()).optional(),
  playingPlayers: z.array(z.string()).optional(),
  mustyPlayers: z.array(z.string()).optional(),
  currentTrick: z.array(TrickPlaySchema).optional(),
  completedTricks: z.array(z.array(TrickPlaySchema)).optional(),
  lastTrickWinner: z.string().nullable().optional(),
  round: z.number().int().optional(),
  trickNumber: z.number().int().optional(),
  players: z.array(z.object({
    id: z.string().min(1),
    hand: z.array(CardSchema).optional(),
    consecutiveSits: z.number().int().optional(),
    isActive: z.boolean().optional(),
    punts: z.number().int().optional(),
    wallet: z.number().optional(),
  })).optional(),
});

// Discriminated union of all game actions
export const GameActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('bid'),
    payload: BidPayloadSchema,
  }),
  z.object({
    action: z.literal('trump'),
    payload: TrumpPayloadSchema,
  }),
  z.object({
    action: z.literal('sitpass'),
    payload: SitPassPayloadSchema,
  }),
  z.object({
    action: z.literal('playcard'),
    payload: PlayCardPayloadSchema,
  }),
  z.object({
    action: z.literal('penalty'),
    payload: PenaltyPayloadSchema,
  }),
  z.object({
    action: z.literal('sync_state'),
    payload: SyncStatePayloadSchema,
  }),
]);

export type ValidatedGameAction = z.infer<typeof GameActionSchema>;

// =============================================================================
// ZOD SCHEMAS - Client Messages
// =============================================================================

export const CreateRoomSchema = z.object({
  type: z.literal('CREATE_ROOM'),
  playerName: z.string().min(1).max(20),
  settings: z.object({
    startingScore: z.number().int().optional(),
    turnTimeLimit: z.number().int().min(0).optional(),
  }).optional(),
});

export const JoinRoomSchema = z.object({
  type: z.literal('JOIN_ROOM'),
  roomCode: z.string().length(6),
  playerName: z.string().min(1).max(20),
});

export const RejoinRoomSchema = z.object({
  type: z.literal('REJOIN_ROOM'),
  roomCode: z.string().length(6),
  playerId: z.string().min(1),
});

export const AddAISchema = z.object({
  type: z.literal('ADD_AI'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

export const RemovePlayerSchema = z.object({
  type: z.literal('REMOVE_PLAYER'),
  playerId: z.string().min(1),
});

export const StartGameSchema = z.object({
  type: z.literal('START_GAME'),
});

export const GameActionMessageSchema = z.object({
  type: z.literal('GAME_ACTION'),
  action: z.enum(['bid', 'trump', 'sitpass', 'playcard', 'penalty', 'sync_state']),
  payload: z.unknown(),
});

// Union of all client messages
export const ClientMessageSchema = z.discriminatedUnion('type', [
  CreateRoomSchema,
  JoinRoomSchema,
  RejoinRoomSchema,
  AddAISchema,
  RemovePlayerSchema,
  StartGameSchema,
  GameActionMessageSchema,
]);

// =============================================================================
// GAME RULE VALIDATORS
// =============================================================================

/**
 * Validate a bid action
 */
export function validateBid(
  bid: number,
  currentHighestBid: number,
  isDealer: boolean,
  playerId: string,
  currentPlayerId: string
): ValidationResult {
  // Must be current player's turn
  if (playerId !== currentPlayerId) {
    return { valid: false, error: 'Not your turn', code: 'NOT_YOUR_TURN' };
  }

  // Bid must be in valid range
  if (bid < GAME.MIN_BID || bid > GAME.MAX_BID) {
    return { valid: false, error: `Bid must be between ${GAME.MIN_BID} and ${GAME.MAX_BID}`, code: 'INVALID_BID' };
  }

  // Bid of 0 (punt) is always valid
  if (bid === 0) {
    return { valid: true };
  }

  // Non-dealer: must bid higher than current highest (or punt)
  if (!isDealer && currentHighestBid > 0 && bid <= currentHighestBid) {
    return { valid: false, error: `Must bid higher than ${currentHighestBid}`, code: 'INVALID_BID' };
  }

  // Dealer: can match or beat the highest bid
  if (isDealer && bid < currentHighestBid) {
    return { valid: false, error: `Must bid at least ${currentHighestBid}`, code: 'INVALID_BID' };
  }

  return { valid: true };
}

/**
 * Validate a card play
 */
export function validateCardPlay(
  card: Card,
  hand: Card[],
  leadSuit: Suit | null,
  playerId: string,
  currentPlayerId: string
): ValidationResult {
  // Must be current player's turn
  if (playerId !== currentPlayerId) {
    return { valid: false, error: 'Not your turn', code: 'NOT_YOUR_TURN' };
  }

  // Card must be in player's hand
  const hasCard = hand.some(c => c.suit === card.suit && c.rank === card.rank);
  if (!hasCard) {
    return { valid: false, error: 'Card not in your hand', code: 'CARD_NOT_IN_HAND' };
  }

  // If there's a lead suit, must follow suit if possible
  if (leadSuit !== null) {
    const hasLeadSuit = hand.some(c => c.suit === leadSuit);
    if (hasLeadSuit && card.suit !== leadSuit) {
      return { valid: false, error: `Must follow suit (${leadSuit})`, code: 'MUST_FOLLOW_SUIT' };
    }
  }

  return { valid: true };
}

/**
 * Validate a sit/pass decision
 */
export function validateSitDecision(
  decision: 'sit' | 'play',
  playerId: string,
  consecutiveSits: number,
  highestBid: number,
  trumpSuit: Suit | null,
  highestBidderId: string | null
): ValidationResult {
  // Highest bidder must play
  if (playerId === highestBidderId) {
    if (decision === 'sit') {
      return { valid: false, error: 'Highest bidder must play', code: 'BIDDER_MUST_PLAY' };
    }
    return { valid: true };
  }

  // If choosing to play, always valid
  if (decision === 'play') {
    return { valid: true };
  }

  // Below are validations for choosing to sit

  // Cannot sit if musty (2 consecutive sits)
  if (consecutiveSits >= GAME.MAX_CONSECUTIVE_SITS) {
    return { valid: false, error: 'Must play after sitting 2 rounds in a row', code: 'MUSTY_MUST_PLAY' };
  }

  // Cannot sit if bid is 1
  if (highestBid === 1) {
    return { valid: false, error: 'Cannot sit when bid is 1', code: 'CANNOT_SIT_ON_ONE' };
  }

  // Cannot sit if trump is spades
  if (trumpSuit === 'spades') {
    return { valid: false, error: 'Cannot sit when trump is spades', code: 'CANNOT_SIT_ON_SPADES' };
  }

  return { valid: true };
}

/**
 * Validate that a phase transition is legal
 */
export function validatePhaseTransition(
  fromPhase: string,
  toPhase: string
): ValidationResult {
  const validTransitions: Record<string, string[]> = {
    setup: ['bidding'],
    bidding: ['trump_selection'],
    trump_selection: ['sit_pass', 'hand_play'],
    sit_pass: ['everyone_sat', 'hand_play'],
    everyone_sat: ['hand_play'],
    hand_play: ['trick_complete'],
    trick_complete: ['hand_play', 'round_complete'],
    round_complete: ['bidding', 'game_over'],
    game_over: ['setup'],
  };

  const allowed = validTransitions[fromPhase];
  if (!allowed) {
    return { valid: false, error: `Unknown phase: ${fromPhase}`, code: 'INVALID_ACTION' };
  }

  if (!allowed.includes(toPhase)) {
    return { valid: false, error: `Cannot transition from ${fromPhase} to ${toPhase}`, code: 'INVALID_ACTION' };
  }

  return { valid: true };
}

/**
 * Validate that a player is active and in the game
 */
export function validatePlayerActive(
  playerId: string,
  players: Player[],
  playingPlayers?: Set<string>
): ValidationResult {
  const player = players.find(p => p.id === playerId);

  if (!player) {
    return { valid: false, error: 'Player not found', code: 'PLAYER_NOT_FOUND' };
  }

  if (!player.isActive) {
    return { valid: false, error: 'Player is not active', code: 'INVALID_ACTION' };
  }

  if (playingPlayers && !playingPlayers.has(playerId)) {
    return { valid: false, error: 'Player is not in this round', code: 'INVALID_ACTION' };
  }

  return { valid: true };
}

/**
 * Parse and validate a game action message
 * Returns the validated action or an error
 */
export function parseGameAction(data: unknown):
  | { success: true; data: ValidatedGameAction }
  | { success: false; error: string } {
  const result = GameActionSchema.safeParse(data);

  if (!result.success) {
    const firstError = result.error.errors[0];
    return {
      success: false,
      error: firstError?.message || 'Invalid game action',
    };
  }

  return { success: true, data: result.data };
}

/**
 * Parse and validate a client message
 */
export function parseClientMessage(data: unknown):
  | { success: true; data: z.infer<typeof ClientMessageSchema> }
  | { success: false; error: string } {
  const result = ClientMessageSchema.safeParse(data);

  if (!result.success) {
    const firstError = result.error.errors[0];
    return {
      success: false,
      error: firstError?.message || 'Invalid message',
    };
  }

  return { success: true, data: result.data };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if a card exists in a hand
 */
export function cardInHand(card: Card, hand: Card[]): boolean {
  return hand.some(c => c.suit === card.suit && c.rank === card.rank);
}

/**
 * Check if a hand contains a specific suit
 */
export function hasSuit(hand: Card[], suit: Suit): boolean {
  return hand.some(c => c.suit === suit);
}

/**
 * Get the lead suit from a trick
 */
export function getLeadSuit(trick: TrickPlay[]): Suit | null {
  if (trick.length === 0) return null;
  return trick[0].card.suit;
}
