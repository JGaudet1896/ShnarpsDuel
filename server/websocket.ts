import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { randomBytes } from 'crypto';
import { processAITurn, setApplyGameAction, setBroadcastGameState, GameRoom as AIGameRoom } from './ai/gameLoop';
import {
  validateBid,
  validateCardPlay,
  validateSitDecision,
  parseGameAction,
  cardInHand,
  getLeadSuit,
} from '@shared/validation';
import { ErrorCode, createServerMessage } from '@shared/messages';
import { GAME } from '@shared/constants';
import type {
  ValidationResult,
  Suit,
  Card,
  Player,
  GamePhase,
  TrickPlay,
} from '@shared/types';

// Local GameRoom interface with proper WebSocket typing
interface GameRoom {
  id: string;
  players: Map<string, Player & { ws?: WebSocket }>;
  spectatorWs?: WebSocket;
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
  turnTimer?: NodeJS.Timeout;
  turnTimeLimit: number;
  turnStartTime?: number;
  stateLocked: boolean;
  aiProcessing: boolean;
  aiTimeouts: Set<NodeJS.Timeout>;
  stateLockTimeout?: NodeJS.Timeout;
}

const rooms = new Map<string, GameRoom>();

// =============================================================================
// LOGGING HELPERS
// =============================================================================

interface LogContext {
  roomId?: string;
  playerId?: string;
  action?: string;
  phase?: string;
}

/**
 * Log a game action with full context for debugging.
 */
function logGameAction(level: 'info' | 'warn' | 'error', message: string, context: LogContext): void {
  const timestamp = new Date().toISOString();
  const contextStr = Object.entries(context)
    .filter(([_, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v}`)
    .join(' ');

  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '📋';
  console.log(`${prefix} [${timestamp}] ${message} | ${contextStr}`);
}

/**
 * Log a validation error with context.
 */
function logValidationError(error: string, context: LogContext): void {
  logGameAction('warn', `Validation failed: ${error}`, context);
}

// =============================================================================
// ROOM CODE GENERATION
// =============================================================================

/**
 * Generate a cryptographically secure room code.
 * Uses characters that are easy to read and type (excludes 0, O, I, 1, L).
 */
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // Exclude similar-looking chars
  const bytes = randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

// Card utility functions
function createDeck(): Card[] {
  const suits: Card['suit'][] = ['spades', 'hearts', 'diamonds', 'clubs'];
  const ranks: Array<{ rank: Card['rank']; value: number }> = [
    { rank: 'A', value: 14 },
    { rank: 'K', value: 13 },
    { rank: 'Q', value: 12 },
    { rank: 'J', value: 11 },
    { rank: '10', value: 10 },
    { rank: '9', value: 9 },
    { rank: '8', value: 8 },
    { rank: '7', value: 7 },
    { rank: '6', value: 6 },
    { rank: '5', value: 5 },
    { rank: '4', value: 4 },
    { rank: '3', value: 3 },
    { rank: '2', value: 2 }
  ];

  const deck: Card[] = [];
  for (const suit of suits) {
    for (const r of ranks) {
      deck.push({
        suit,
        value: r.value,
        rank: r.rank
      });
    }
  }
  
  // Validate deck has exactly 52 unique cards
  if (deck.length !== 52) {
    console.error('❌ SERVER DECK ERROR: Deck has', deck.length, 'cards instead of 52!');
  }
  
  const uniqueCards = new Set(deck.map(c => `${c.rank}${c.suit}`));
  if (uniqueCards.size !== 52) {
    console.error('❌ SERVER DECK ERROR: Deck has duplicate cards!', deck.length - uniqueCards.size, 'duplicates found');
    console.error('Deck:', deck.map(c => `${c.rank}${c.suit}`).sort());
  }
  
  return deck;
}

function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function dealCards(deck: Card[], numPlayers: number): Card[][] {
  const hands: Card[][] = Array.from({ length: numPlayers }, () => []);
  for (let i = 0; i < 5; i++) {
    for (let p = 0; p < numPlayers; p++) {
      const card = deck[i * numPlayers + p];
      if (card) hands[p].push(card);
    }
  }
  
  // Validate: Check for duplicate cards across all hands
  const allDealtCards: string[] = [];
  hands.forEach((hand, playerIndex) => {
    hand.forEach(card => {
      const cardId = `${card.rank}${card.suit}`;
      if (allDealtCards.includes(cardId)) {
        console.error(`❌ SERVER DEAL ERROR: Duplicate card ${cardId} found in player ${playerIndex}'s hand!`);
        console.error('All dealt cards:', allDealtCards);
        console.error('Current hand:', hand.map(c => `${c.rank}${c.suit}`));
      }
      allDealtCards.push(cardId);
    });
  });
  
  return hands;
}

function createRoom(hostId: string, hostName: string, spectatorMode: boolean = false): GameRoom {
  const roomId = generateRoomCode();
  
  // If spectator mode, don't add host as a player
  const players = new Map<string, Player & { ws?: WebSocket }>();
  const scores = new Map<string, number>();
  
  if (!spectatorMode && hostName) {
    const hostPlayer: Player & { ws?: WebSocket } = {
      id: hostId,
      name: hostName,
      hand: [],
      isActive: true,
      consecutiveSits: 0,
      isAI: false,
      wallet: 100,
      isConnected: true
    };
    players.set(hostId, hostPlayer);
    scores.set(hostId, 16);
  }

  const room: GameRoom = {
    id: roomId,
    players,
    gameState: {
      gamePhase: 'setup',
      currentPlayerIndex: 0,
      dealerIndex: 0,
      deck: [],
      currentTrick: [],
      completedTricks: [],
      bids: new Map(),
      trumpSuit: null,
      highestBidder: null,
      playingPlayers: new Set(),
      mustyPlayers: new Set(),
      scores,
      round: 1
    },
    host: hostId,
    createdAt: Date.now(),
    turnTimeLimit: 0, // 0 = no timer (disabled for multiplayer)
    // Race condition prevention
    stateLocked: false,
    aiProcessing: false,
    aiTimeouts: new Set()
  };

  rooms.set(roomId, room);
  console.log(`🎮 Room ${roomId} created (spectatorMode: ${spectatorMode}, players: ${players.size})`);
  return room;
}

/**
 * Find the next valid player index from a starting position.
 * Returns the index of a player who is in playingPlayers (or active if playingPlayers is empty).
 * Returns -1 if no valid player is found (should never happen in a valid game).
 */
function findNextValidPlayer(
  playerArray: Player[],
  startIndex: number,
  playingPlayers: Set<string>,
  direction: 'forward' | 'backward' = 'forward'
): number {
  const step = direction === 'forward' ? 1 : -1;
  let index = startIndex;

  for (let i = 0; i < playerArray.length; i++) {
    const player = playerArray[index];
    if (player && player.isActive) {
      // If playingPlayers is empty, any active player is valid
      // Otherwise, must be in playingPlayers
      if (playingPlayers.size === 0 || playingPlayers.has(player.id)) {
        return index;
      }
    }
    // Move to next/previous player
    index = (index + step + playerArray.length) % playerArray.length;
  }

  // No valid player found - this shouldn't happen in a valid game
  console.error('❌ No valid player found!', {
    playerCount: playerArray.length,
    startIndex,
    playingPlayersSize: playingPlayers.size,
    playingPlayerIds: Array.from(playingPlayers),
    playerIds: playerArray.map(p => ({ id: p.id, isActive: p.isActive }))
  });
  return -1;
}

function broadcastToRoom(roomId: string, message: any, excludePlayerId?: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  const messageStr = JSON.stringify(message);
  
  // Send to all players
  room.players.forEach((player, playerId) => {
    if (playerId !== excludePlayerId && player.ws && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(messageStr);
    }
  });
  
  // Also send to spectator if present
  if (room.spectatorWs && room.spectatorWs.readyState === WebSocket.OPEN) {
    room.spectatorWs.send(messageStr);
  }
}

function serializeGameState(room: GameRoom, playerId: string | null) {
  return {
    roomId: room.id,
    players: Array.from(room.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      hand: (playerId && p.id === playerId) || p.isAI || !playerId ? p.hand : [], // Show all hands for spectators (null playerId) and AI
      isActive: p.isActive,
      consecutiveSits: p.consecutiveSits,
      isAI: p.isAI,
      avatar: p.avatar,
      wallet: p.wallet || 100,
      isConnected: p.isConnected ?? true
    })),
    gameState: {
      ...room.gameState,
      bids: Object.fromEntries(room.gameState.bids),
      playingPlayers: Array.from(room.gameState.playingPlayers),
      mustyPlayers: Array.from(room.gameState.mustyPlayers),
      scores: Object.fromEntries(room.gameState.scores)
    },
    localPlayerId: playerId,
    isHost: playerId ? room.host === playerId : false,
    turnTimeRemaining: room.turnStartTime ? Math.max(0, room.turnTimeLimit - Math.floor((Date.now() - room.turnStartTime) / 1000)) : null
  };
}

// Timer and auto-play functions
function startTurnTimer(room: GameRoom) {
  // Clear any existing timer
  if (room.turnTimer) {
    clearTimeout(room.turnTimer);
  }
  
  // Don't start timer if limit is 0 (no limit)
  if (room.turnTimeLimit <= 0) return;
  
  // Get current player
  const playerArray = Array.from(room.players.values());
  const currentPlayer = playerArray[room.gameState.currentPlayerIndex];
  
  // Don't set timer for AI players (they move instantly) or connected human players in setup
  if (!currentPlayer || currentPlayer.isAI || room.gameState.gamePhase === 'setup') return;
  
  room.turnStartTime = Date.now();
  
  // Broadcast timer start
  broadcastToRoom(room.id, {
    type: 'TURN_TIMER_START',
    timeLimit: room.turnTimeLimit
  });
  
  // Set timeout for auto-play
  room.turnTimer = setTimeout(() => {
    console.log(`Turn timer expired for player ${currentPlayer.name} in room ${room.id}`);
    autoPlayTurn(room, currentPlayer);
  }, room.turnTimeLimit * 1000);
}

function stopTurnTimer(room: GameRoom) {
  if (room.turnTimer) {
    clearTimeout(room.turnTimer);
    room.turnTimer = undefined;
    room.turnStartTime = undefined;
  }
}

/**
 * Clean up all resources associated with a room before deletion.
 * This prevents memory leaks from orphaned timers and WebSocket references.
 */
function cleanupRoom(room: GameRoom): void {
  console.log(`🧹 Cleaning up room ${room.id}`);

  // Clear turn timer
  stopTurnTimer(room);

  // Clear state lock timeout
  if (room.stateLockTimeout) {
    clearTimeout(room.stateLockTimeout);
    room.stateLockTimeout = undefined;
  }

  // Clear all AI timeouts
  if (room.aiTimeouts && room.aiTimeouts.size > 0) {
    console.log(`  Clearing ${room.aiTimeouts.size} AI timeouts`);
    Array.from(room.aiTimeouts).forEach(timeout => clearTimeout(timeout));
    room.aiTimeouts.clear();
  }

  // Reset processing flags
  room.aiProcessing = false;
  room.stateLocked = false;

  // Close any WebSocket connections (they should already be closed, but just in case)
  room.players.forEach((player, id) => {
    if (player.ws) {
      try {
        // Don't close - just remove reference (connection may already be closed)
        player.ws = undefined;
      } catch (e) {
        // Ignore errors
      }
    }
  });

  // Clear spectator reference
  if (room.spectatorWs) {
    room.spectatorWs = undefined;
  }

  // Clear player map
  room.players.clear();

  console.log(`  Room ${room.id} cleaned up successfully`);
}

/**
 * Delete a room with full cleanup.
 */
function deleteRoom(roomId: string): boolean {
  const room = rooms.get(roomId);
  if (!room) {
    return false;
  }

  cleanupRoom(room);
  rooms.delete(roomId);
  console.log(`🗑️ Room ${roomId} deleted. Active rooms: ${rooms.size}`);
  return true;
}

function autoPlayTurn(room: GameRoom, player: Player) {
  // Simple auto-play logic based on current phase
  const phase = room.gameState.gamePhase;
  
  try {
    if (phase === 'bidding') {
      // Auto-bid 0 (safest option)
      room.gameState.bids.set(player.id, 0);
      
      const playerArray = Array.from(room.players.values());
      const nextIndex = (room.gameState.currentPlayerIndex + 1) % playerArray.length;
      
      // Check if bidding is complete
      if (room.gameState.bids.size === playerArray.length) {
        const highestBid = Math.max(...Array.from(room.gameState.bids.values()));
        const highestBidderId = Array.from(room.gameState.bids.entries())
          .find(([_, bid]) => bid === highestBid)?.[0];
        
        room.gameState.highestBidder = highestBidderId || null;
        room.gameState.gamePhase = 'trump_selection';
        room.gameState.currentPlayerIndex = playerArray.findIndex(p => p.id === highestBidderId);
      } else {
        room.gameState.currentPlayerIndex = nextIndex;
      }
      
      broadcastGameState(room);
      if (room.gameState.gamePhase === 'bidding') {
        startTurnTimer(room);
      }
    }
    else if (phase === 'trump_selection') {
      // Auto-select first suit with most cards in hand
      const suitCounts: Record<Suit, number> = { hearts: 0, diamonds: 0, clubs: 0, spades: 0 };
      player.hand.forEach(card => suitCounts[card.suit]++);
      const trumpSuit = Object.entries(suitCounts).sort((a, b) => b[1] - a[1])[0][0] as Suit;

      room.gameState.trumpSuit = trumpSuit;
      
      // Check if sit/pass should be skipped (bid is 1 or trump is spades)
      const playerArray = Array.from(room.players.values());
      const highestBid = Math.max(...Array.from(room.gameState.bids.values()));
      const shouldSkipSitPass = highestBid === 1 || trumpSuit === 'spades';
      
      if (shouldSkipSitPass) {
        // Everyone plays - skip sit/pass phase
        room.gameState.playingPlayers.clear();
        playerArray.forEach(p => {
          if (p.isActive) {
            room.gameState.playingPlayers.add(p.id);
          }
        });

        room.gameState.gamePhase = 'hand_play';
        const dealerIndex = room.gameState.dealerIndex;
        const startIndex = (dealerIndex + 1) % playerArray.length;
        const firstPlayerIndex = findNextValidPlayer(playerArray, startIndex, room.gameState.playingPlayers);
        if (firstPlayerIndex === -1) {
          console.error('❌ No valid first player found in autoPlayTurn trump_selection');
        }
        room.gameState.currentPlayerIndex = firstPlayerIndex >= 0 ? firstPlayerIndex : 0;
      } else {
        room.gameState.gamePhase = 'sit_pass';
        // Start with player after the highest bidder
        const highestBidderIndex = playerArray.findIndex(p => p.id === room.gameState.highestBidder);
        room.gameState.currentPlayerIndex = (highestBidderIndex + 1) % playerArray.length;
      }

      broadcastGameState(room);
      startTurnTimer(room);
    }
    else if (phase === 'sit_pass') {
      // Check if player can sit based on game rules
      const highestBid = Math.max(...Array.from(room.gameState.bids.values()));
      const trumpSuit = room.gameState.trumpSuit;
      const canSit = player.consecutiveSits < 2 && highestBid !== 1 && trumpSuit !== 'spades';
      const decision = canSit ? 'sit' : 'play';
      
      if (decision === 'sit') {
        player.consecutiveSits++;
        // Sitting penalty: if score < 5, add +1
        const playerScore = room.gameState.scores.get(player.id) || 16;
        if (playerScore < 5) {
          room.gameState.scores.set(player.id, playerScore + 1);
        }
      } else {
        player.consecutiveSits = 0;
        room.gameState.playingPlayers.add(player.id);
      }

      const playerArray = Array.from(room.players.values());
      const nextIndex = (room.gameState.currentPlayerIndex + 1) % playerArray.length;

      // Check if sit/pass is complete
      const allDecided = playerArray.every(p => 
        room.gameState.playingPlayers.has(p.id) || p.consecutiveSits > 0
      );
      
      if (allDecided) {
        if (room.gameState.playingPlayers.size === 0) {
          room.gameState.gamePhase = 'everyone_sat';
        } else {
          room.gameState.gamePhase = 'hand_play';
          room.gameState.currentPlayerIndex = (room.gameState.dealerIndex + 1) % playerArray.length;
        }
      } else {
        room.gameState.currentPlayerIndex = nextIndex;
      }
      
      broadcastGameState(room);
      if (room.gameState.gamePhase === 'sit_pass' || room.gameState.gamePhase === 'hand_play') {
        startTurnTimer(room);
      }
    }
    else if (phase === 'hand_play') {
      // Auto-play lowest valid card
      const currentTrick = room.gameState.currentTrick;
      const leadSuit = currentTrick.length > 0 ? currentTrick[0].card.suit : null;
      
      let validCards = player.hand;
      if (leadSuit) {
        const suitCards = player.hand.filter(c => c.suit === leadSuit);
        if (suitCards.length > 0) validCards = suitCards;
      }
      
      // Play lowest value card
      const cardToPlay = validCards.sort((a, b) => a.value - b.value)[0];
      
      if (cardToPlay) {
        player.hand = player.hand.filter(c => !(c.suit === cardToPlay.suit && c.rank === cardToPlay.rank));
        room.gameState.currentTrick.push({ playerId: player.id, card: cardToPlay });
        
        const playingPlayerIds = Array.from(room.gameState.playingPlayers);
        
        if (room.gameState.currentTrick.length === playingPlayerIds.length) {
          room.gameState.gamePhase = 'trick_complete';
        } else {
          const playerArray = Array.from(room.players.values());
          const startIdx = (room.gameState.currentPlayerIndex + 1) % playerArray.length;
          const nextIndex = findNextValidPlayer(playerArray, startIdx, room.gameState.playingPlayers);
          if (nextIndex === -1) {
            console.error('❌ No valid next player found in autoPlayTurn hand_play');
          }
          room.gameState.currentPlayerIndex = nextIndex >= 0 ? nextIndex : 0;
        }

        broadcastGameState(room);
        if (room.gameState.gamePhase === 'hand_play') {
          startTurnTimer(room);
        }
      }
    }
  } catch (error) {
    console.error('Error in autoPlayTurn:', error);
  }
}

function broadcastGameState(room: GameRoom) {
  room.players.forEach((player, playerId) => {
    if (player.ws && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify({
        type: 'GAME_STATE_SYNC',
        ...serializeGameState(room, playerId)
      }));
    }
  });
}

// =============================================================================
// STATE LOCK MANAGEMENT
// =============================================================================

const STATE_LOCK_TIMEOUT_MS = 5000; // 5 seconds max lock time

/**
 * Lock game state with auto-unlock timeout to prevent deadlocks.
 * This is critical - if sync_state isn't received within timeout, auto-unlock.
 */
function lockState(room: GameRoom): void {
  room.stateLocked = true;

  // Clear any existing timeout
  if (room.stateLockTimeout) {
    clearTimeout(room.stateLockTimeout);
  }

  // Set auto-unlock timeout to prevent deadlocks
  room.stateLockTimeout = setTimeout(() => {
    if (room.stateLocked) {
      console.warn(`⚠️ State lock timeout in room ${room.id} - auto-unlocking to prevent deadlock`);
      unlockState(room);

      // Trigger AI processing in case it was blocked
      if (!room.aiProcessing) {
        room.aiProcessing = true;
        try {
          processAITurn(room, (message) => broadcastToRoom(room.id, message));
        } finally {
          room.aiProcessing = false;
        }
      }
    }
  }, STATE_LOCK_TIMEOUT_MS);
}

/**
 * Unlock game state and clear the timeout.
 */
function unlockState(room: GameRoom): void {
  room.stateLocked = false;
  if (room.stateLockTimeout) {
    clearTimeout(room.stateLockTimeout);
    room.stateLockTimeout = undefined;
  }
}

/**
 * Schedule an AI timeout and track it for cleanup.
 * Automatically removes itself from tracking when executed.
 */
function scheduleAITimeout(room: GameRoom, callback: () => void, delayMs: number): NodeJS.Timeout {
  const timeout = setTimeout(() => {
    // Remove from tracking when executed
    room.aiTimeouts.delete(timeout);
    callback();
  }, delayMs);

  room.aiTimeouts.add(timeout);
  return timeout;
}

/**
 * Start a new round - rotates dealer, deals new cards, resets round state.
 * Called when transitioning from round_complete to bidding.
 */
function startNewRound(room: GameRoom): void {
  const playerArray = Array.from(room.players.values()) as (Player & { ws?: WebSocket })[];

  // CRITICAL: Rotate dealer to next player
  room.gameState.dealerIndex = (room.gameState.dealerIndex + 1) % playerArray.length;
  console.log(`🔄 Dealer rotated to index ${room.gameState.dealerIndex} (${playerArray[room.gameState.dealerIndex]?.name})`);

  // Increment round counter
  room.gameState.round += 1;

  // Deal new cards
  const shuffledDeck = shuffleDeck(createDeck());
  const dealtCards = dealCards(shuffledDeck, playerArray.length);

  playerArray.forEach((player, index) => {
    player.hand = dealtCards[index] || [];
  });

  // Reset round state
  room.gameState.deck = shuffledDeck.slice(playerArray.length * 5);
  room.gameState.currentTrick = [];
  room.gameState.completedTricks = [];
  room.gameState.bids = new Map();
  room.gameState.trumpSuit = null;
  room.gameState.highestBidder = null;
  room.gameState.playingPlayers = new Set();
  room.gameState.mustyPlayers = new Set();

  // Start bidding with player after dealer
  room.gameState.gamePhase = 'bidding';
  room.gameState.currentPlayerIndex = (room.gameState.dealerIndex + 1) % playerArray.length;

  console.log(`🎮 Starting round ${room.gameState.round} in room ${room.id}`);
}

// Validate a game action before applying it
// Returns null if valid, or an error object if invalid
function validateGameAction(
  room: GameRoom,
  action: string,
  payload: any
): { valid: false; error: string; code: string } | { valid: true } {
  const playerArray = Array.from(room.players.values());
  const currentPlayer = playerArray[room.gameState.currentPlayerIndex];

  if (!currentPlayer) {
    return { valid: false, error: 'No current player', code: 'INVALID_ACTION' };
  }

  switch (action) {
    case 'bid': {
      // Validate it's the bidding phase
      if (room.gameState.gamePhase !== 'bidding') {
        return { valid: false, error: 'Not in bidding phase', code: 'INVALID_ACTION' };
      }

      // Validate bid value
      if (typeof payload.bid !== 'number' || payload.bid < GAME.MIN_BID || payload.bid > GAME.MAX_BID) {
        return { valid: false, error: `Bid must be between ${GAME.MIN_BID} and ${GAME.MAX_BID}`, code: 'INVALID_BID' };
      }

      // Validate it's the player's turn
      if (payload.playerId !== currentPlayer.id) {
        return { valid: false, error: 'Not your turn', code: 'NOT_YOUR_TURN' };
      }

      // Get current highest bid
      const currentHighestBid = Math.max(0, ...Array.from(room.gameState.bids.values()));
      const isDealer = room.gameState.dealerIndex === room.gameState.currentPlayerIndex;

      // Validate bid rules
      const bidResult = validateBid(payload.bid, currentHighestBid, isDealer, payload.playerId, currentPlayer.id);
      if (!bidResult.valid) {
        return { valid: false, error: bidResult.error || 'Invalid bid', code: bidResult.code || 'INVALID_BID' };
      }
      break;
    }

    case 'trump': {
      // Validate it's the trump selection phase
      if (room.gameState.gamePhase !== 'trump_selection') {
        return { valid: false, error: 'Not in trump selection phase', code: 'INVALID_ACTION' };
      }

      // Validate the player is the highest bidder
      if (currentPlayer.id !== room.gameState.highestBidder) {
        return { valid: false, error: 'Only highest bidder can choose trump', code: 'NOT_YOUR_TURN' };
      }

      // Validate suit is valid
      const validSuits = ['hearts', 'diamonds', 'clubs', 'spades'];
      if (!validSuits.includes(payload.suit)) {
        return { valid: false, error: 'Invalid suit', code: 'INVALID_ACTION' };
      }
      break;
    }

    case 'sitpass': {
      // Validate it's the sit/pass phase
      if (room.gameState.gamePhase !== 'sit_pass') {
        return { valid: false, error: 'Not in sit/pass phase', code: 'INVALID_ACTION' };
      }

      // Validate it's the player's turn
      if (payload.playerId !== currentPlayer.id) {
        return { valid: false, error: 'Not your turn', code: 'NOT_YOUR_TURN' };
      }

      // Validate decision
      if (payload.decision !== 'sit' && payload.decision !== 'play') {
        return { valid: false, error: 'Invalid decision', code: 'INVALID_DECISION' };
      }

      const player = room.players.get(payload.playerId);
      if (!player) {
        return { valid: false, error: 'Player not found', code: 'PLAYER_NOT_FOUND' };
      }

      // Get highest bid
      const highestBid = Math.max(0, ...Array.from(room.gameState.bids.values()));

      // Validate sit decision rules
      const sitResult = validateSitDecision(
        payload.decision,
        payload.playerId,
        player.consecutiveSits,
        highestBid,
        room.gameState.trumpSuit,
        room.gameState.highestBidder
      );
      if (!sitResult.valid) {
        return { valid: false, error: sitResult.error || 'Invalid decision', code: sitResult.code || 'INVALID_DECISION' };
      }
      break;
    }

    case 'playcard': {
      // Validate it's the hand play phase
      if (room.gameState.gamePhase !== 'hand_play' && room.gameState.gamePhase !== 'everyone_sat') {
        return { valid: false, error: 'Not in hand play phase', code: 'INVALID_ACTION' };
      }

      // Validate it's the player's turn
      if (payload.playerId !== currentPlayer.id) {
        return { valid: false, error: 'Not your turn', code: 'NOT_YOUR_TURN' };
      }

      // Validate player is in playing players
      if (!room.gameState.playingPlayers.has(payload.playerId)) {
        return { valid: false, error: 'Player is not playing this round', code: 'INVALID_ACTION' };
      }

      const player = room.players.get(payload.playerId);
      if (!player) {
        return { valid: false, error: 'Player not found', code: 'PLAYER_NOT_FOUND' };
      }

      // Validate card is in hand
      const hasCard = player.hand.some(
        (c: Card) => c.suit === payload.card.suit && c.rank === payload.card.rank
      );
      if (!hasCard) {
        return { valid: false, error: 'Card not in your hand', code: 'CARD_NOT_IN_HAND' };
      }

      // Validate suit following
      const leadSuit = room.gameState.currentTrick.length > 0
        ? room.gameState.currentTrick[0].card.suit
        : null;

      if (leadSuit) {
        const hasLeadSuit = player.hand.some((c: Card) => c.suit === leadSuit);
        if (hasLeadSuit && payload.card.suit !== leadSuit) {
          return { valid: false, error: `Must follow suit (${leadSuit})`, code: 'MUST_FOLLOW_SUIT' };
        }
      }
      break;
    }

    case 'sync_state': {
      // sync_state is always valid (host authority)
      // Validate that it comes from the host
      if (payload.playerId && room.host !== payload.playerId) {
        return { valid: false, error: 'Only host can sync state', code: 'NOT_HOST' };
      }
      break;
    }

    case 'start_round': {
      // start_round is valid in round_complete phase from host
      if (room.gameState.gamePhase !== 'round_complete') {
        return { valid: false, error: 'Not in round complete phase', code: 'INVALID_ACTION' };
      }
      break;
    }

    case 'penalty': {
      // penalty is always valid in the right phase
      if (room.gameState.gamePhase !== 'everyone_sat') {
        return { valid: false, error: 'Not in penalty phase', code: 'INVALID_ACTION' };
      }
      break;
    }

    default:
      return { valid: false, error: `Unknown action: ${action}`, code: 'INVALID_ACTION' };
  }

  return { valid: true };
}

// Apply game action to server state (used by AI game loop)
function applyGameAction(room: GameRoom, action: string, payload: any) {
  const playerArray = Array.from(room.players.values()) as (Player & { ws?: WebSocket })[];

  switch (action) {
    case 'bid': {
      room.gameState.bids.set(payload.playerId, payload.bid);

      // Check if bidding is complete
      if (room.gameState.bids.size === playerArray.length) {
        const bidValues = Array.from(room.gameState.bids.values()) as number[];
        const highestBid = Math.max(...bidValues);
        const bidEntries = Array.from(room.gameState.bids.entries()) as [string, number][];
        const highestBidderId = bidEntries.find(([_, bid]) => bid === highestBid)?.[0];
        
        room.gameState.highestBidder = highestBidderId || null;
        room.gameState.gamePhase = 'trump_selection';
        room.gameState.currentPlayerIndex = playerArray.findIndex(p => p.id === highestBidderId);
      } else {
        room.gameState.currentPlayerIndex = (room.gameState.currentPlayerIndex + 1) % playerArray.length;
      }
      break;
    }
    
    case 'trump': {
      room.gameState.trumpSuit = payload.suit as Suit;

      // Check if sit/pass should be skipped (bid is 1 or trump is spades)
      const trumpBidValues = Array.from(room.gameState.bids.values()) as number[];
      const highestBid = Math.max(...trumpBidValues);
      const shouldSkipSitPass = highestBid === 1 || payload.suit === 'spades';
      
      if (shouldSkipSitPass) {
        // Everyone plays - skip sit/pass phase
        room.gameState.playingPlayers.clear();
        playerArray.forEach(p => {
          if (p.isActive) {
            room.gameState.playingPlayers.add(p.id);
          }
        });

        room.gameState.gamePhase = 'hand_play';
        const dealerIndex = room.gameState.dealerIndex;
        const trumpStartIdx = (dealerIndex + 1) % playerArray.length;
        const firstPlayerIndex = findNextValidPlayer(playerArray, trumpStartIdx, room.gameState.playingPlayers);
        if (firstPlayerIndex === -1) {
          console.error('❌ No valid first player found in applyGameAction trump');
        }
        room.gameState.currentPlayerIndex = firstPlayerIndex >= 0 ? firstPlayerIndex : 0;
      } else {
        // Go to sit/pass phase - start with player after the highest bidder
        room.gameState.gamePhase = 'sit_pass';
        const highestBidderIndex = playerArray.findIndex(p => p.id === room.gameState.highestBidder);
        room.gameState.currentPlayerIndex = (highestBidderIndex + 1) % playerArray.length;
      }
      break;
    }

    case 'sitpass': {
      const player = room.players.get(payload.playerId);
      if (player) {
        if (payload.decision === 'sit') {
          room.gameState.playingPlayers.delete(payload.playerId);
          // Sitting penalty: if score < 5, add +1
          const playerScore = room.gameState.scores.get(payload.playerId) || 16;
          if (playerScore < 5) {
            room.gameState.scores.set(payload.playerId, playerScore + 1);
          }
        } else {
          room.gameState.playingPlayers.add(payload.playerId);
        }
      }
      
      // Check if all players have decided
      const nextIndex = (room.gameState.currentPlayerIndex + 1) % playerArray.length;
      if (nextIndex === 0) {
        // All players have decided, move to next phase
        if (room.gameState.playingPlayers.size === 1) {
          room.gameState.gamePhase = 'everyone_sat';
          const bidderId = room.gameState.highestBidder;
          room.gameState.currentPlayerIndex = playerArray.findIndex(p => p.id === bidderId);
        } else {
          room.gameState.gamePhase = 'hand_play';
          const dealerIndex = room.gameState.dealerIndex;
          const sitPassStartIdx = (dealerIndex + 1) % playerArray.length;
          const firstPlayerIndex = findNextValidPlayer(playerArray, sitPassStartIdx, room.gameState.playingPlayers);
          if (firstPlayerIndex === -1) {
            console.error('❌ No valid first player found in applyGameAction sitpass');
          }
          room.gameState.currentPlayerIndex = firstPlayerIndex >= 0 ? firstPlayerIndex : 0;
        }
      } else {
        room.gameState.currentPlayerIndex = nextIndex;
      }
      break;
    }

    case 'playcard': {
      const player = room.players.get(payload.playerId);
      if (player) {
        player.hand = player.hand.filter(c => !(c.suit === payload.card.suit && c.rank === payload.card.rank));
        room.gameState.currentTrick.push({ playerId: payload.playerId, card: payload.card });

        const playingPlayerIds = Array.from(room.gameState.playingPlayers);
        if (room.gameState.currentTrick.length === playingPlayerIds.length) {
          // Trick is complete - determine winner and continue
          room.gameState.gamePhase = 'trick_complete';

          // Determine trick winner
          const leadCard = room.gameState.currentTrick[0].card;
          const leadSuit = leadCard.suit;
          const trumpSuit = room.gameState.trumpSuit;

          let winningPlay = room.gameState.currentTrick[0];
          for (const play of room.gameState.currentTrick) {
            if (play.card.suit === trumpSuit && winningPlay.card.suit !== trumpSuit) {
              winningPlay = play;
            } else if (play.card.suit === trumpSuit && winningPlay.card.suit === trumpSuit) {
              if (play.card.value > winningPlay.card.value) {
                winningPlay = play;
              }
            } else if (play.card.suit === leadSuit && winningPlay.card.suit === leadSuit) {
              if (play.card.value > winningPlay.card.value) {
                winningPlay = play;
              }
            }
          }

          // Move trick to completed tricks
          room.gameState.completedTricks.push([...room.gameState.currentTrick]);
          room.gameState.currentTrick = [];

          // Set next player to winner
          const winnerIndex = playerArray.findIndex(p => p.id === winningPlay.playerId);
          room.gameState.currentPlayerIndex = winnerIndex;

          // Check if hand is complete (all 5 tricks played)
          if (room.gameState.completedTricks.length >= 5) {
            room.gameState.gamePhase = 'round_complete';
          } else {
            // CRITICAL: For AI card plays, transition to hand_play immediately
            // For HUMAN card plays, stay in trick_complete and wait for sync_state from host
            // This prevents race conditions between server and client state management
            if (player.isAI) {
              room.gameState.gamePhase = 'hand_play';
              console.log(`🤖 AI trick complete - transitioning to hand_play, winner: ${playerArray[winnerIndex]?.name}`);
            } else {
              // Stay in trick_complete - host client will send sync_state after animation
              // LOCK STATE with timeout to prevent AI processing during animation
              // Timeout prevents deadlock if sync_state is never received
              lockState(room);
              console.log(`👤 Human trick complete - STATE LOCKED (5s timeout), waiting for sync_state from host`);
            }
          }
        } else {
          const playCardStartIdx = (room.gameState.currentPlayerIndex + 1) % playerArray.length;
          const nextIndex = findNextValidPlayer(playerArray, playCardStartIdx, room.gameState.playingPlayers);
          if (nextIndex === -1) {
            console.error('❌ No valid next player found in applyGameAction playcard');
          }
          room.gameState.currentPlayerIndex = nextIndex >= 0 ? nextIndex : 0;
        }
      }
      break;
    }

    case 'penalty': {
      // Handle everyone_sat penalty choice
      // When everyone sits except the bidder, bidder chooses:
      // - 'self': Take -5 to their own score (moves toward winning)
      // - 'others': Give +5 to all other players
      const choice = payload.choice;
      const bidderId = room.gameState.highestBidder;

      if (!bidderId) {
        console.error('❌ No highest bidder found for penalty');
        break;
      }

      if (choice === 'self') {
        // Bidder takes -5 (moves toward 0 = winning)
        const currentScore = room.gameState.scores.get(bidderId) || 16;
        room.gameState.scores.set(bidderId, currentScore - 5);
        console.log(`📊 Penalty: ${bidderId} takes -5 (${currentScore} -> ${currentScore - 5})`);
      } else if (choice === 'others') {
        // All other players get +5 (moves away from 0)
        const scoreEntries = Array.from(room.gameState.scores.entries()) as [string, number][];
        for (const [playerId, score] of scoreEntries) {
          if (playerId !== bidderId) {
            room.gameState.scores.set(playerId, score + 5);
            console.log(`📊 Penalty: ${playerId} gets +5 (${score} -> ${score + 5})`);
          }
        }
      }

      // Transition to round_complete to start a new round
      room.gameState.gamePhase = 'round_complete';
      break;
    }

    case 'sync_state': {
      // Host client sends sync_state to synchronize server state after trick completion
      // This is critical for keeping server and client in sync

      // UNLOCK STATE - host has finished animation, safe to process AI turns
      unlockState(room);
      console.log('📡 Received sync_state from host - STATE UNLOCKED:', payload);

      // SPECIAL CASE: If transitioning from round_complete to bidding, start new round properly
      if (room.gameState.gamePhase === 'round_complete' && payload.gamePhase === 'bidding') {
        startNewRound(room);
        // Skip normal sync_state processing since startNewRound handles everything
        break;
      }

      if (payload.gamePhase !== undefined) {
        room.gameState.gamePhase = payload.gamePhase;
      }
      if (payload.currentTrick !== undefined) {
        room.gameState.currentTrick = payload.currentTrick;
      }
      if (payload.currentPlayerIndex !== undefined) {
        room.gameState.currentPlayerIndex = payload.currentPlayerIndex;
      }
      if (payload.completedTricks !== undefined) {
        room.gameState.completedTricks = payload.completedTricks;
      }
      if (payload.playingPlayers !== undefined) {
        room.gameState.playingPlayers = new Set(payload.playingPlayers);
      }
      if (payload.scores !== undefined) {
        room.gameState.scores = new Map(Object.entries(payload.scores));
      }
      if (payload.bids !== undefined) {
        room.gameState.bids = new Map(Object.entries(payload.bids));
      }
      if (payload.trumpSuit !== undefined) {
        room.gameState.trumpSuit = payload.trumpSuit;
      }
      if (payload.highestBidder !== undefined) {
        room.gameState.highestBidder = payload.highestBidder;
      }
      if (payload.dealerIndex !== undefined) {
        room.gameState.dealerIndex = payload.dealerIndex;
      }
      if (payload.round !== undefined) {
        room.gameState.round = payload.round;
      }

      // Sync player hands if provided
      if (payload.players !== undefined) {
        const playerArray = Array.from(room.players.values());
        for (const playerData of payload.players) {
          const player = room.players.get(playerData.id);
          if (player && playerData.hand) {
            player.hand = playerData.hand;
          }
          if (player && playerData.consecutiveSits !== undefined) {
            player.consecutiveSits = playerData.consecutiveSits;
          }
        }
      }

      break;
    }

    case 'start_round': {
      // Explicitly start a new round (alternative to sync_state transition)
      startNewRound(room);
      break;
    }
  }
}

export function setupWebSocket(server: Server) {
  // Register applyGameAction and broadcastGameState with the AI game loop
  setApplyGameAction(applyGameAction);
  setBroadcastGameState(broadcastGameState);

  const wss = new WebSocketServer({ server, path: '/ws' });

  console.log('WebSocket server initialized on /ws');

  // Periodic room cleanup - runs every 5 minutes to clean up stale rooms
  const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
  const MAX_ROOM_AGE = 30 * 60 * 1000; // 30 minutes with no connected humans

  setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;

    rooms.forEach((room, roomId) => {
      // Check if room has any connected human players
      const connectedHumans = Array.from(room.players.values())
        .filter(p => !p.isAI && p.isConnected !== false);

      // Delete room if:
      // 1. No connected humans AND room is older than MAX_ROOM_AGE
      // 2. Room is in setup phase with only AI players
      const roomAge = now - room.createdAt;
      const shouldCleanup =
        (connectedHumans.length === 0 && roomAge > MAX_ROOM_AGE) ||
        (room.gameState.gamePhase === 'setup' && connectedHumans.length === 0 && roomAge > 60000);

      if (shouldCleanup) {
        console.log(`🧹 Auto-cleaning stale room ${roomId} (age: ${Math.round(roomAge / 1000)}s, humans: ${connectedHumans.length})`);
        deleteRoom(roomId);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned ${cleanedCount} stale rooms. Active rooms: ${rooms.size}`);
    }
  }, CLEANUP_INTERVAL);

  wss.on('connection', (ws: WebSocket) => {
    console.log('✅ WebSocket client connected');
    let currentPlayerId: string | null = null;
    let currentRoomId: string | null = null;

    ws.on('message', (data: string) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case 'CREATE_ROOM': {
            const playerId = `player_${Date.now()}_${Math.random()}`;
            const spectatorMode = message.spectatorMode || false;
            const room = createRoom(playerId, message.playerName, spectatorMode);
            
            currentPlayerId = playerId;
            currentRoomId = room.id;
            
            // Set ws for player if they joined as a player, or store spectator ws
            if (!spectatorMode && message.playerName) {
              const player = room.players.get(playerId)!;
              player.ws = ws;
            } else if (spectatorMode) {
              room.spectatorWs = ws;
            }

            // For spectators, send game state with null playerId but keep host status
            const gameState = serializeGameState(room, playerId);
            ws.send(JSON.stringify({
              type: 'ROOM_CREATED',
              ...gameState,
              localPlayerId: spectatorMode ? null : playerId, // Override to null for spectators
              isHost: true, // Spectators are always host since they created the room
              isSpectator: spectatorMode
            }));
            break;
          }

          case 'JOIN_ROOM': {
            const room = rooms.get(message.roomId);
            if (!room) {
              ws.send(JSON.stringify({ type: 'ERROR', message: 'Room not found' }));
              break;
            }

            if (room.players.size >= 8) {
              ws.send(JSON.stringify({ type: 'ERROR', message: 'Room is full' }));
              break;
            }

            if (room.gameState.gamePhase !== 'setup') {
              ws.send(JSON.stringify({ type: 'ERROR', message: 'Game already started' }));
              break;
            }

            const playerId = `player_${Date.now()}_${Math.random()}`;
            const player: Player & { ws?: WebSocket } = {
              id: playerId,
              name: message.playerName,
              hand: [],
              isActive: true,
              consecutiveSits: 0,
              isAI: false,
              ws,
              wallet: 100
            };

            room.players.set(playerId, player);
            room.gameState.scores.set(playerId, 16);
            
            currentPlayerId = playerId;
            currentRoomId = room.id;

            // Send state to joining player
            ws.send(JSON.stringify({
              type: 'JOINED_ROOM',
              ...serializeGameState(room, playerId)
            }));

            // Notify others
            broadcastToRoom(room.id, {
              type: 'PLAYER_JOINED',
              player: { id: playerId, name: player.name, isAI: false }
            }, playerId);

            break;
          }

          case 'REJOIN_ROOM': {
            const room = rooms.get(message.roomId);
            if (!room) {
              ws.send(JSON.stringify({ type: 'ERROR', message: 'Room not found' }));
              break;
            }

            // Check if player exists in the room by playerId (disconnected player)
            const playerId = message.playerId;
            const player = room.players.get(playerId);

            if (!player || player.isAI) {
              ws.send(JSON.stringify({ type: 'ERROR', message: 'Player not found in this game' }));
              break;
            }
            
            // Reconnect the player
            player.ws = ws;
            player.isConnected = true;
            currentPlayerId = playerId;
            currentRoomId = room.id;

            // Send current game state to rejoining player
            ws.send(JSON.stringify({
              type: 'REJOINED_ROOM',
              ...serializeGameState(room, playerId)
            }));

            // Notify others
            broadcastToRoom(room.id, {
              type: 'PLAYER_RECONNECTED',
              playerId,
              playerName: player.name
            }, playerId);

            console.log(`Player ${player.name} rejoined room ${room.id}`);
            break;
          }

          case 'ADD_AI': {
            if (!currentRoomId || !currentPlayerId) break;
            const room = rooms.get(currentRoomId);
            if (!room || room.host !== currentPlayerId || room.gameState.gamePhase !== 'setup') break;

            const aiId = `ai_${Date.now()}_${Math.random()}`;
            const aiPlayer: Player & { ws?: WebSocket } = {
              id: aiId,
              name: message.aiName,
              hand: [],
              isActive: true,
              consecutiveSits: 0,
              isAI: true,
              wallet: 100
            };

            room.players.set(aiId, aiPlayer);
            room.gameState.scores.set(aiId, 16);

            broadcastToRoom(room.id, {
              type: 'PLAYER_JOINED',
              player: { id: aiId, name: aiPlayer.name, isAI: true }
            });

            break;
          }

          case 'GAME_ACTION': {
            if (!currentRoomId) break;
            const room = rooms.get(currentRoomId);
            if (!room) break;

            // Stop current turn timer since action was received
            stopTurnTimer(room);

            // Update game state based on action
            const { action, payload } = message;

            // VALIDATE the action before applying
            const validationResult = validateGameAction(room, action, payload);
            if (!validationResult.valid) {
              logValidationError(validationResult.error, {
                roomId: currentRoomId,
                playerId: payload?.playerId || currentPlayerId || undefined,
                action,
                phase: room.gameState.gamePhase
              });
              ws.send(JSON.stringify({
                type: 'ERROR',
                code: validationResult.code,
                message: validationResult.error
              }));
              // Restart turn timer since action was rejected
              startTurnTimer(room);
              break;
            }

            // Track consecutiveSits on server for sitpass actions
            if (action === 'sitpass') {
              const player = room.players.get(payload.playerId);
              if (player) {
                if (payload.decision === 'play') {
                  player.consecutiveSits = 0;
                } else {
                  player.consecutiveSits += 1;
                }
              }
            }

            // Apply action to server state FIRST (already validated)
            applyGameAction(room, action, payload);

            // Broadcast the action to all players (for backward compatibility)
            broadcastToRoom(room.id, {
              type: 'GAME_STATE_UPDATE',
              action,
              payload
            });

            // CRITICAL: Broadcast full game state to ensure all clients are in sync
            broadcastGameState(room);

            // For sync_state (from host after trick completion), ALWAYS trigger AI processing
            // For trick_complete phase, wait for sync_state from host before continuing
            // For other phases, process AI turns normally
            const currentPhase = room.gameState.gamePhase;
            const shouldProcessAI = action === 'sync_state' ||
              (currentPhase !== 'trick_complete' && currentPhase !== 'round_complete');

            // GUARD: Don't process AI if state is locked (waiting for sync_state)
            if (room.stateLocked && action !== 'sync_state') {
              console.log(`🔒 State locked, skipping AI processing until sync_state`);
            } else if (room.aiProcessing) {
              console.log(`⏳ AI already processing, skipping duplicate call`);
            } else if (shouldProcessAI) {
              // Check if next player is AI and process their turn automatically
              // Use scheduleAITimeout for automatic cleanup
              scheduleAITimeout(room, () => {
                // Double-check guards before processing
                if (room.stateLocked || room.aiProcessing) {
                  console.log(`🔒 AI processing blocked by guard`);
                  return;
                }
                room.aiProcessing = true;
                try {
                  processAITurn(room, (message) => broadcastToRoom(room.id, message));
                } finally {
                  room.aiProcessing = false;
                }
                // Start timer as fallback for human players
                scheduleAITimeout(room, () => startTurnTimer(room), 500);
              }, action === 'sync_state' ? 100 : 500); // Faster response for sync_state
            } else {
              console.log(`⏸️ Waiting for sync_state from host (current phase: ${currentPhase})`);
            }

            break;
          }

          case 'REMOVE_PLAYER': {
            if (!currentRoomId || !currentPlayerId) break;
            const room = rooms.get(currentRoomId);
            if (!room || room.host !== currentPlayerId || room.gameState.gamePhase !== 'setup') break;

            const playerToRemove = message.playerId;
            if (playerToRemove === currentPlayerId) break; // Can't remove yourself

            room.players.delete(playerToRemove);
            room.gameState.scores.delete(playerToRemove);

            broadcastToRoom(room.id, {
              type: 'PLAYER_LEFT',
              playerId: playerToRemove
            });

            break;
          }

          case 'START_GAME': {
            if (!currentRoomId || !currentPlayerId) break;
            const room = rooms.get(currentRoomId);
            if (!room || room.host !== currentPlayerId) break;

            if (room.players.size < 4) {
              ws.send(JSON.stringify({ type: 'ERROR', message: 'Need at least 4 players' }));
              break;
            }

            // Deal cards to all players
            const shuffledDeck = shuffleDeck(createDeck());
            const playerArray = Array.from(room.players.values());
            const dealtCards = dealCards(shuffledDeck, playerArray.length);
            
            // Log all dealt cards for debugging
            console.log(`🃏 Dealing cards to ${playerArray.length} players in room ${room.id}`);
            const allCardIds: string[] = [];
            playerArray.forEach((player, index) => {
              player.hand = dealtCards[index] || [];
              const cardIds = player.hand.map(c => `${c.rank}${c.suit}`);
              console.log(`  Player ${index} (${player.name}): ${cardIds.join(', ')}`);
              allCardIds.push(...cardIds);
            });
            
            // Check for duplicates
            const uniqueCards = new Set(allCardIds);
            if (uniqueCards.size !== allCardIds.length) {
              console.error(`❌ DUPLICATE CARDS DEALT! ${allCardIds.length - uniqueCards.size} duplicates found`);
              console.error('All cards:', allCardIds.sort());
            } else {
              console.log(`✅ All ${allCardIds.length} cards unique`);
            }

            room.gameState.gamePhase = 'bidding';
            room.gameState.deck = shuffledDeck.slice(playerArray.length * 5); // Remaining cards
            room.gameState.currentPlayerIndex = (room.gameState.dealerIndex + 1) % playerArray.length;
            room.gameState.bids = new Map();
            room.gameState.trumpSuit = null;
            room.gameState.highestBidder = null;
            
            // Send personalized game state to each player (with their own hand)
            room.players.forEach((player, playerId) => {
              if (player.ws && player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(JSON.stringify({
                  type: 'GAME_STARTED',
                  ...serializeGameState(room, playerId)
                }));
              }
            });
            
            // Also send to spectator if present (they see all hands)
            if (room.spectatorWs && room.spectatorWs.readyState === WebSocket.OPEN) {
              room.spectatorWs.send(JSON.stringify({
                type: 'GAME_STARTED',
                ...serializeGameState(room, null) // null = spectator, sees all hands
              }));
            }

            // Check if first player is AI and process their turn
            scheduleAITimeout(room, () => {
              if (room.aiProcessing) {
                console.log(`⏳ AI already processing at game start`);
                return;
              }
              room.aiProcessing = true;
              try {
                processAITurn(room, (message) => broadcastToRoom(room.id, message));
              } finally {
                room.aiProcessing = false;
              }
              // Start timer as fallback for human players
              scheduleAITimeout(room, () => startTurnTimer(room), 500);
            }, 1000);

            break;
          }
        }
      } catch (error) {
        console.error('WebSocket error:', error);
        ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      if (currentRoomId && currentPlayerId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          const player = room.players.get(currentPlayerId);
          
          // If game is in progress, mark as disconnected instead of removing
          if (room.gameState.gamePhase !== 'setup' && player && !player.isAI) {
            player.isConnected = false;
            player.ws = undefined;
            
            broadcastToRoom(room.id, {
              type: 'PLAYER_DISCONNECTED',
              playerId: currentPlayerId,
              playerName: player.name
            });
            
            // If it's the disconnected player's turn, auto-play for them
            const playerArray = Array.from(room.players.values());
            const currentPlayer = playerArray[room.gameState.currentPlayerIndex];
            if (currentPlayer && currentPlayer.id === currentPlayerId) {
              console.log(`Auto-playing for disconnected player ${player.name}`);
              setTimeout(() => autoPlayTurn(room, player), 2000);
            }
            
            // Transfer host if needed
            if (currentPlayerId === room.host) {
              const newHost = Array.from(room.players.entries())
                .find(([id, p]) => !p.isAI && p.isConnected !== false && id !== currentPlayerId)?.[0] 
                || Array.from(room.players.entries()).find(([_, p]) => !p.isAI)?.[0]
                || Array.from(room.players.keys())[0];
              
              if (newHost) {
                room.host = newHost;
                broadcastToRoom(room.id, {
                  type: 'HOST_TRANSFERRED',
                  newHostId: newHost
                });
              }
            }
          } else {
            // Game not started or AI player - remove completely
            room.players.delete(currentPlayerId);

            // If room is empty, clean up room
            if (room.players.size === 0) {
              deleteRoom(currentRoomId);
            } else if (currentPlayerId === room.host) {
              // Game hasn't started yet, delete the room
              broadcastToRoom(room.id, {
                type: 'ROOM_CLOSED',
                reason: 'Host disconnected'
              });
              deleteRoom(currentRoomId);
            } else {
              // Non-host player left during setup - just notify others
              broadcastToRoom(room.id, {
                type: 'PLAYER_LEFT',
                playerId: currentPlayerId
              });
            }
          }
        }
      }
    });
  });

  console.log('WebSocket server initialized on /ws');
}
