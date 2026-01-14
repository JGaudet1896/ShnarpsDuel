# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm run dev          # Start development server (tsx server/index.ts)
npm run build        # Production build (vite + esbuild)
npm run start        # Run production server
npm run check        # TypeScript type checking
npm run db:push      # Push Drizzle schema to database
```

### iOS Deployment
```bash
npm run build                # Build web app first
npx cap sync ios             # Sync to iOS project
npx cap open ios             # Open in Xcode (Mac only)
```

## Architecture Overview

### Full-Stack Structure
- **client/** - React 18 frontend with Three.js for 3D rendering
- **server/** - Express.js backend with WebSocket support
- **shared/** - Shared TypeScript types and Drizzle database schema
- **ios/** - Capacitor iOS native wrapper

### Path Aliases
- `@/` → `client/src/`
- `@shared/` → `shared/`

### State Management (Zustand Stores)
- `useShnarps` (`client/src/lib/stores/useShnarps.tsx`) - Core game state: players, bids, tricks, scores, multiplayer sync
- `useGame` (`client/src/lib/stores/useGame.tsx`) - High-level game phase (ready/playing/ended)
- `useAudio` (`client/src/lib/stores/useAudio.tsx`) - Sound effects and music control
- `useSettings` - Game configuration (starting score, elimination threshold)
- `useWallet` - Persistent player wallet/currency

### Game Logic
Core game logic is in `client/src/lib/game/`:
- `gameLogic.ts` - Game phases, scoring rules, player validation
- `cardUtils.ts` - Deck creation, shuffling, dealing, trick winner determination
- `aiPlayer.ts` - Client-side AI decision hooks

Server-side AI in `server/ai/`:
- `aiEngine.ts` - AI bidding, trump selection, sit/play decisions, card play strategies
- `gameLoop.ts` - Multiplayer game loop management

### Game Phases Flow
`setup` → `bidding` → `trump_selection` → `sit_pass` → `hand_play` → `trick_complete` → (repeat for 5 tricks) → `round_complete` → `game_over`

Special phase: `everyone_sat` - When all players except bidder sit out

### Multiplayer Architecture
- WebSocket server on `/ws` endpoint (`server/websocket.ts`)
- Room-based with 6-character alphanumeric codes
- Host-authoritative scoring to prevent desync
- Supports mixed human/AI players in online rooms

### Scoring Rules
- Starting score: 16 points
- Elimination: score > 32
- Win: score ≤ 0
- Punt (bid 0): +5 if no tricks taken, -1 per trick otherwise
- Regular bid: -1 per trick won
- "Spading out": If trump is spades and bidder wins all 5 tricks, instant win

### Musty Rule
Players who sit 2 consecutive rounds must play the next round. `consecutiveSits` persists across rounds and only resets when a player actively chooses to play.

## Key Components

### Game UI (`client/src/components/game/`)
- `GameBoard.tsx` - Main 3D canvas with player positions
- `GameUI.tsx` - Phase-specific controls and overlays
- `BiddingPhase.tsx`, `SitPassPhase.tsx`, `HandPlayPhase.tsx` - Phase UIs
- `Card.tsx` - 3D card rendering
- `MultiplayerSetup.tsx` - Room creation/joining

### Database (Drizzle ORM)
Schema in `shared/schema.ts`:
- `users` - Player authentication
- `games` - Game metadata and serialized state
- `gamePlayers` - Player-game relationships

Requires `DATABASE_URL` environment variable (Neon PostgreSQL).

## AI Difficulty Levels
- **Easy**: Makes poor decisions, often random plays
- **Medium**: Occasionally makes mistakes (default)
- **Hard**: Optimal play, defensive bidding, collusion strategy (gangs up on leaders)
