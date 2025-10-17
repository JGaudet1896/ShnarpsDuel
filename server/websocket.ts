import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

type GamePhase = 'setup' | 'bidding' | 'trump_selection' | 'sit_pass' | 'everyone_sat' | 'hand_play' | 'trick_complete' | 'round_complete' | 'game_over';
type AIDifficulty = 'easy' | 'medium' | 'hard';

interface Card {
  suit: string;
  value: number;
  name: string;
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

function createRoom(hostId: string, hostName: string): GameRoom {
  const roomId = generateRoomCode();
  
  const hostPlayer: Player & { ws?: WebSocket } = {
    id: hostId,
    name: hostName,
    hand: [],
    isActive: true,
    consecutiveSits: 0,
    isAI: false,
    wallet: 100
  };

  const room: GameRoom = {
    id: roomId,
    players: new Map([[hostId, hostPlayer]]),
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
      scores: new Map([[hostId, 16]]),
      round: 1
    },
    host: hostId,
    createdAt: Date.now()
  };

  rooms.set(roomId, room);
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

function serializeGameState(room: GameRoom, playerId: string) {
  return {
    roomId: room.id,
    players: Array.from(room.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      hand: p.id === playerId ? p.hand : [], // Only send hand to the player who owns it
      isActive: p.isActive,
      consecutiveSits: p.consecutiveSits,
      isAI: p.isAI,
      aiDifficulty: p.aiDifficulty,
      avatar: p.avatar,
      wallet: p.wallet || 100
    })),
    gameState: {
      ...room.gameState,
      bids: Object.fromEntries(room.gameState.bids),
      playingPlayers: Array.from(room.gameState.playingPlayers),
      mustyPlayers: Array.from(room.gameState.mustyPlayers),
      scores: Object.fromEntries(room.gameState.scores)
    },
    localPlayerId: playerId,
    isHost: room.host === playerId
  };
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
            const room = createRoom(playerId, message.playerName);
            
            currentPlayerId = playerId;
            currentRoomId = room.id;
            
            const player = room.players.get(playerId)!;
            player.ws = ws;

            ws.send(JSON.stringify({
              type: 'ROOM_CREATED',
              ...serializeGameState(room, playerId)
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

            // Update game state based on action
            const { action, payload } = message;
            
            // Broadcast the action to all players
            broadcastToRoom(room.id, {
              type: 'GAME_STATE_UPDATE',
              action,
              payload
            });

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

            room.gameState.gamePhase = 'bidding';
            
            broadcastToRoom(room.id, {
              type: 'GAME_STARTED',
              gameState: serializeGameState(room, currentPlayerId).gameState
            });

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
          room.players.delete(currentPlayerId);
          
          // If room is empty or host left, clean up room
          if (room.players.size === 0 || currentPlayerId === room.host) {
            rooms.delete(currentRoomId);
          } else {
            // Notify others of player leaving
            broadcastToRoom(room.id, {
              type: 'PLAYER_LEFT',
              playerId: currentPlayerId
            });
          }
        }
      }
    });
  });

  console.log('WebSocket server initialized on /ws');
}
