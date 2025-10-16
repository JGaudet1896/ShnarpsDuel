import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";

// Game state validation schemas
const CreateGameSchema = z.object({
  playerName: z.string().min(1).max(50),
  maxPlayers: z.number().min(4).max(8).default(8)
});

const JoinGameSchema = z.object({
  gameCode: z.string().length(6),
  playerName: z.string().min(1).max(50)
});

const GameActionSchema = z.object({
  gameCode: z.string().length(6),
  playerId: z.string(),
  action: z.enum(['bid', 'trump', 'sitpass', 'playcard']),
  data: z.any()
});

function generateGameCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Create a new game
  app.post("/api/games", async (req, res) => {
    try {
      const { playerName, maxPlayers } = CreateGameSchema.parse(req.body);
      
      const gameCode = generateGameCode();
      const game = await storage.createGame({
        gameCode,
        maxPlayers: maxPlayers || 8,
        hostId: null, // For now, no user system
        status: "waiting"
      });
      
      // Add the creator as first player
      const player = await storage.addPlayerToGame(game.id, {
        playerName,
        userId: null
      });
      
      res.json({ 
        success: true, 
        game: {
          ...game,
          players: [player]
        }
      });
    } catch (error) {
      console.error("Create game error:", error);
      res.status(400).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to create game" 
      });
    }
  });

  // Join an existing game
  app.post("/api/games/join", async (req, res) => {
    try {
      const { gameCode, playerName } = JoinGameSchema.parse(req.body);
      
      const game = await storage.getGameByCode(gameCode);
      if (!game) {
        return res.status(404).json({ success: false, error: "Game not found" });
      }
      
      if (game.status !== "waiting") {
        return res.status(400).json({ success: false, error: "Game already started" });
      }
      
      if (game.currentPlayers >= game.maxPlayers) {
        return res.status(400).json({ success: false, error: "Game is full" });
      }
      
      const player = await storage.addPlayerToGame(game.id, {
        playerName,
        userId: null
      });
      
      const updatedGame = await storage.getGameById(game.id);
      const players = await storage.getGamePlayers(game.id);
      
      res.json({ 
        success: true, 
        game: updatedGame,
        players,
        playerId: player.id
      });
    } catch (error) {
      console.error("Join game error:", error);
      res.status(400).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to join game" 
      });
    }
  });

  // Get game state
  app.get("/api/games/:gameCode", async (req, res) => {
    try {
      const { gameCode } = req.params;
      
      const game = await storage.getGameByCode(gameCode);
      if (!game) {
        return res.status(404).json({ success: false, error: "Game not found" });
      }
      
      const players = await storage.getGamePlayers(game.id);
      
      res.json({ 
        success: true, 
        game: {
          ...game,
          gameState: game.gameState ? JSON.parse(game.gameState) : null
        },
        players 
      });
    } catch (error) {
      console.error("Get game error:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to get game" 
      });
    }
  });

  // Start game
  app.post("/api/games/:gameCode/start", async (req, res) => {
    try {
      const { gameCode } = req.params;
      
      const game = await storage.getGameByCode(gameCode);
      if (!game) {
        return res.status(404).json({ success: false, error: "Game not found" });
      }
      
      if (game.currentPlayers < 4) {
        return res.status(400).json({ success: false, error: "Need at least 4 players to start" });
      }
      
      // Initialize game state
      const initialGameState = {
        phase: 'bidding',
        round: 1,
        dealerIndex: 0,
        currentPlayerIndex: 1,
        bids: {},
        trumpSuit: null,
        highestBidder: null,
        playingPlayers: [],
        currentTrick: [],
        completedTricks: []
      };
      
      const updatedGame = await storage.updateGameState(game.id, "active", initialGameState);
      
      res.json({ success: true, game: updatedGame });
    } catch (error) {
      console.error("Start game error:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to start game" 
      });
    }
  });

  // Game action endpoint (bid, trump selection, sit/pass, play card)
  app.post("/api/games/action", async (req, res) => {
    try {
      const { gameCode, playerId, action, data } = GameActionSchema.parse(req.body);
      
      const game = await storage.getGameByCode(gameCode);
      if (!game) {
        return res.status(404).json({ success: false, error: "Game not found" });
      }
      
      if (game.status !== "active") {
        return res.status(400).json({ success: false, error: "Game not active" });
      }
      
      // Parse current game state
      const gameState = game.gameState ? JSON.parse(game.gameState) : {};
      
      // Process action based on type
      switch (action) {
        case 'bid':
          gameState.bids = gameState.bids || {};
          gameState.bids[playerId] = data.bid;
          // Logic to determine if bidding is complete and move to next phase
          break;
          
        case 'trump':
          gameState.trumpSuit = data.suit;
          gameState.phase = 'sit_pass';
          break;
          
        case 'sitpass':
          gameState.playingPlayers = gameState.playingPlayers || [];
          if (data.decision === 'play') {
            gameState.playingPlayers.push(playerId);
          }
          break;
          
        case 'playcard':
          gameState.currentTrick = gameState.currentTrick || [];
          gameState.currentTrick.push({
            playerId,
            card: data.card
          });
          break;
      }
      
      // Update game state in storage
      const updatedGame = await storage.updateGameState(game.id, game.status, gameState);
      
      res.json({ success: true, gameState });
    } catch (error) {
      console.error("Game action error:", error);
      res.status(400).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to process game action" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
