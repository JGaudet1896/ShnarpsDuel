import { users, type User, type InsertUser } from "@shared/schema";

// Game-related types for REST API (note: main game logic uses WebSockets)
interface Game {
  id: number;
  gameCode: string;
  maxPlayers: number;
  currentPlayers: number;
  hostId: number | null;
  status: 'waiting' | 'active' | 'finished';
  gameState: string | null;
  createdAt: Date;
}

interface GamePlayer {
  id: string;
  gameId: number;
  playerName: string;
  userId: number | null;
  joinedAt: Date;
}

interface CreateGameInput {
  gameCode: string;
  maxPlayers: number;
  hostId: number | null;
  status: 'waiting' | 'active' | 'finished';
}

interface AddPlayerInput {
  playerName: string;
  userId: number | null;
}

// Storage interface with CRUD methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  // Game methods (for REST API - main game uses WebSockets)
  createGame(input: CreateGameInput): Promise<Game>;
  getGameByCode(gameCode: string): Promise<Game | undefined>;
  getGameById(id: number): Promise<Game | undefined>;
  getGamePlayers(gameId: number): Promise<GamePlayer[]>;
  addPlayerToGame(gameId: number, input: AddPlayerInput): Promise<GamePlayer>;
  updateGameState(gameId: number, status: string, gameState: any): Promise<Game>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private games: Map<number, Game>;
  private gamePlayers: Map<number, GamePlayer[]>;
  currentId: number;
  currentGameId: number;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.gamePlayers = new Map();
    this.currentId = 1;
    this.currentGameId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Game methods (for REST API - primary game management uses WebSockets)
  async createGame(input: CreateGameInput): Promise<Game> {
    const id = this.currentGameId++;
    const game: Game = {
      id,
      gameCode: input.gameCode,
      maxPlayers: input.maxPlayers,
      currentPlayers: 0,
      hostId: input.hostId,
      status: input.status,
      gameState: null,
      createdAt: new Date()
    };
    this.games.set(id, game);
    this.gamePlayers.set(id, []);
    return game;
  }

  async getGameByCode(gameCode: string): Promise<Game | undefined> {
    return Array.from(this.games.values()).find(
      (game) => game.gameCode === gameCode
    );
  }

  async getGameById(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async getGamePlayers(gameId: number): Promise<GamePlayer[]> {
    return this.gamePlayers.get(gameId) || [];
  }

  async addPlayerToGame(gameId: number, input: AddPlayerInput): Promise<GamePlayer> {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    const player: GamePlayer = {
      id: `player_${Date.now()}_${Math.random()}`,
      gameId,
      playerName: input.playerName,
      userId: input.userId,
      joinedAt: new Date()
    };

    const players = this.gamePlayers.get(gameId) || [];
    players.push(player);
    this.gamePlayers.set(gameId, players);

    // Update current player count
    game.currentPlayers = players.length;
    this.games.set(gameId, game);

    return player;
  }

  async updateGameState(gameId: number, status: string, gameState: any): Promise<Game> {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    game.status = status as Game['status'];
    game.gameState = JSON.stringify(gameState);
    this.games.set(gameId, game);

    return game;
  }
}

export const storage = new MemStorage();
