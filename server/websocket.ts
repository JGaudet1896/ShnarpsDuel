import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { processAITurn } from './ai/gameLoop';

type GamePhase = 'setup' | 'bidding' | 'trump_selection' | 'sit_pass' | 'everyone_sat' | 'hand_play' | 'trick_complete' | 'round_complete' | 'game_over';
type AIDifficulty = 'easy' | 'medium' | 'hard';

interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';
  value: number;
}

interface Player {
  id: string;
  name: string;
  hand: Card[];
  isActive: boolean;
  consecutiveSits: number;
  isAI: boolean;
  aiDifficulty?: AIDifficulty;
  avatar?: { color: string; icon: string };
  wallet?: number;
  isConnected?: boolean; // Track if human player is connected
}

interface GameRoom {
  id: string;
  players: Map<string, Player & { ws?: WebSocket }>;
  gameState: {
    gamePhase: GamePhase;
    currentPlayerIndex: number;
    dealerIndex: number;
    deck: Card[];
    currentTrick: { playerId: string; card: Card }[];
    completedTricks: { playerId: string; card: Card }[][];
    bids: Map<string, number>;
    trumpSuit: string | null;
    highestBidder: string | null;
    playingPlayers: Set<string>;
    mustyPlayers: Set<string>;
    scores: Map<string, number>;
    round: number;
  };
  host: string;
  createdAt: number;
  turnTimer?: NodeJS.Timeout;
  turnTimeLimit: number; // in seconds
  turnStartTime?: number;
}

const rooms = new Map<string, GameRoom>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar-looking chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
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
    turnTimeLimit: 0 // 0 = no timer (disabled for multiplayer)
  };

  rooms.set(roomId, room);
  console.log(`🎮 Room ${roomId} created (spectatorMode: ${spectatorMode}, players: ${players.size})`);
  return room;
}

function broadcastToRoom(roomId: string, message: any, excludePlayerId?: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  const messageStr = JSON.stringify(message);
  
  room.players.forEach((player, playerId) => {
    if (playerId !== excludePlayerId && player.ws && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(messageStr);
    }
  });
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
      aiDifficulty: p.aiDifficulty,
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
      const suitCounts = { hearts: 0, diamonds: 0, clubs: 0, spades: 0 };
      player.hand.forEach(card => suitCounts[card.suit]++);
      const trumpSuit = Object.entries(suitCounts).sort((a, b) => b[1] - a[1])[0][0];
      
      room.gameState.trumpSuit = trumpSuit;
      room.gameState.gamePhase = 'sit_pass';
      room.gameState.currentPlayerIndex = 0;
      
      broadcastGameState(room);
      startTurnTimer(room);
    }
    else if (phase === 'sit_pass') {
      // Auto-sit if possible, otherwise play
      const canSit = player.consecutiveSits < 2;
      const decision = canSit ? 'sit' : 'play';
      
      if (decision === 'sit') {
        player.consecutiveSits++;
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
          let nextIndex = (room.gameState.currentPlayerIndex + 1) % playerArray.length;
          while (!room.gameState.playingPlayers.has(playerArray[nextIndex].id)) {
            nextIndex = (nextIndex + 1) % playerArray.length;
          }
          room.gameState.currentPlayerIndex = nextIndex;
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

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  console.log('WebSocket server initialized on /ws');

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
            
            // Only set ws for player if they joined as a player (not spectator)
            if (!spectatorMode && message.playerName) {
              const player = room.players.get(playerId)!;
              player.ws = ws;
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
              aiDifficulty: message.difficulty,
              wallet: 100
            };

            room.players.set(aiId, aiPlayer);
            room.gameState.scores.set(aiId, 16);

            broadcastToRoom(room.id, {
              type: 'PLAYER_JOINED',
              player: { id: aiId, name: aiPlayer.name, isAI: true, aiDifficulty: aiPlayer.aiDifficulty }
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
            
            // Broadcast the action to all players
            broadcastToRoom(room.id, {
              type: 'GAME_STATE_UPDATE',
              action,
              payload
            });

            // Check if next player is AI and process their turn automatically
            setTimeout(() => {
              processAITurn(room, (message) => broadcastToRoom(room.id, message));
              // Start timer as fallback for human players
              setTimeout(() => startTurnTimer(room), 500);
            }, 500);

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

            // Check if first player is AI and process their turn
            setTimeout(() => {
              processAITurn(room, (message) => broadcastToRoom(room.id, message));
              // Start timer as fallback for human players
              setTimeout(() => startTurnTimer(room), 500);
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
              stopTurnTimer(room);
              rooms.delete(currentRoomId);
            } else if (currentPlayerId === room.host) {
              // Game hasn't started yet, delete the room
              stopTurnTimer(room);
              rooms.delete(currentRoomId);
              broadcastToRoom(room.id, {
                type: 'ROOM_CLOSED',
                reason: 'Host disconnected'
              });
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
