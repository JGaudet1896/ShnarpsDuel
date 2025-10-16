import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  gameCode: text("game_code").notNull().unique(),
  hostId: integer("host_id").references(() => users.id),
  status: text("status").notNull().default("waiting"), // waiting, active, completed
  maxPlayers: integer("max_players").notNull().default(8),
  currentPlayers: integer("current_players").notNull().default(0),
  gameState: text("game_state"), // JSON string of game state
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const gamePlayers = pgTable("game_players", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => games.id),
  userId: integer("user_id").references(() => users.id),
  playerName: text("player_name").notNull(),
  score: integer("score").notNull().default(16),
  isActive: boolean("is_active").notNull().default(true),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertGameSchema = createInsertSchema(games).pick({
  gameCode: true,
  maxPlayers: true,
});

export const insertGamePlayerSchema = createInsertSchema(gamePlayers).pick({
  gameId: true,
  userId: true,
  playerName: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Game = typeof games.$inferSelect;
export type GamePlayer = typeof gamePlayers.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type InsertGamePlayer = z.infer<typeof insertGamePlayerSchema>;
