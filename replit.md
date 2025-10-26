# Shnarps Card Game

## Overview

Shnarps is a multiplayer card game application built with a modern web stack. The game features a bidding phase, trump suit selection, and trick-taking gameplay with support for both human and AI players. The application supports both local (same device) and real-time online multiplayer using WebSockets. The frontend uses React with Three.js for 3D rendering, Express backend with WebSocket server, and PostgreSQL database for persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Updates

### Critical Multiplayer Fixes (October 26, 2024)
- **Mobile Card Visibility:** Improved iPhone card display by raising player position 8% on mobile and increasing bottom padding to 176px (pb-44) with safe-area support
- **Phase UI Positioning:** Adjusted bidding buttons, sit/pass controls, and play card button to bottom-56/bottom-32/bottom-8 on mobile to prevent overlap with raised cards
- **Reconnection Logic:** Fixed WebSocket close handler to only reset to menu after exhausting all 5 reconnection attempts, preventing premature menu boots
- **Rejoin Bug Fix:** Fixed critical bug where server looked for playerName instead of playerId during rejoin, causing reconnection failures
- **Error Handling:** Added try-catch around message handling to prevent freezes from server message errors
- **Enhanced Logging:** Added detailed logging for all WebSocket messages to aid debugging
- **Timer Disabled:** Removed turn timer from multiplayer games (set to 0) to allow players to take their time without rushing

### Multiplayer Stability & Bug Fixes (October 19, 2024)
- **WebSocket Reconnection:** Added automatic reconnection with exponential backoff (up to 5 attempts) to prevent players from being kicked to main menu during network hiccups
- **Connection Resilience:** WebSocket only resets to menu on explicit user disconnect or server-initiated close, not on temporary connection drops
- **Deck Validation:** Added comprehensive validation to detect and prevent duplicate cards in deck creation and dealing (both client and server side)
- **Mobile Card Display:** Fixed card visibility on iPhone 14 by increasing GameBoard bottom padding to 144px (pb-36) for mobile devices
- **MultiplayerSetup Dialog:** Fixed dialog appearing mid-game by adding checks for gamePhase and player count

### iOS App Deployment Setup (October 2024)
- **Capacitor Integration:** Added Capacitor to wrap the web app as a native iOS app for App Store deployment
- **iOS Platform:** Configured iOS project in `ios/` folder with proper build pipeline
- **App Configuration:** Set up app ID (com.shnarps.cardgame) and app name (Shnarps Card Game)
- **Build Scripts:** Configured web-to-native build and sync process
- **Documentation:** Created comprehensive deployment guides (IOS_DEPLOYMENT_GUIDE.md, IOS_QUICK_START.md)

### Player Customization (December 2024)
- **Avatars:** Players can customize their avatars with 8 colors and 24 icon options. Avatars appear throughout the UI (player lists, scores). AI players get random avatars automatically.

### Tutorial & Onboarding (December 2024)
- **Game Tutorial:** Comprehensive 10-step tutorial explaining Shnarps rules, phases, scoring, and strategy. Accessible from main menu.
- **App Walkthrough:** First-time user onboarding (9 steps) covering game modes, multiplayer setup, avatar customization, and UI navigation. Automatically shown to new users (tracked via localStorage).

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18+ with TypeScript for type safety and developer experience
- Vite as the build tool and dev server for fast HMR and optimized production builds
- TailwindCSS for utility-first styling with custom theming support
- Path aliases (`@/` for client/src, `@shared/` for shared code) for clean imports

**State Management**
- Zustand for lightweight, hook-based state management
- Multiple stores for separation of concerns:
  - `useShnarps`: Core game state (players, bids, tricks, scores)
  - `useGame`: Game phase management (ready, playing, ended)
  - `useAudio`: Sound effects and background music control
- React Query (@tanstack/react-query) for server state and API caching

**UI Components**
- Radix UI primitives for accessible, unstyled components
- Custom component library built on top of Radix (buttons, cards, dialogs, etc.)
- Framer Motion for animations and transitions
- Component organization follows atomic design principles

**3D Rendering**
- React Three Fiber for declarative Three.js in React
- @react-three/drei for helpful 3D utilities
- @react-three/postprocessing for visual effects
- GLSL shader support via vite-plugin-glsl

**Game UI Structure**
- GameBoard: Main 3D canvas and player positions
- Phase-specific components: BiddingPhase, SitPassPhase, HandPlayPhase
- Card rendering with animations and playability states
- GameHistory for round-by-round tracking

### Backend Architecture

**Server Framework**
- Express.js with TypeScript for type-safe server code
- ESM modules throughout for modern JavaScript
- Custom middleware for request logging and error handling
- Vite integration in development for seamless full-stack DX

**API Design**
- RESTful endpoints under `/api` namespace
- Zod schemas for request validation
- Game operations: create game, join game, game actions (bid, trump, sitpass, playcard)
- JSON responses with consistent error handling

**Storage Layer**
- Abstract storage interface (IStorage) for flexibility
- MemStorage implementation for in-memory development/testing
- Designed to swap to PostgreSQL persistence via Drizzle ORM
- Database schema ready in shared/schema.ts

**Development Features**
- Hot module replacement via Vite middleware
- Runtime error overlay for debugging
- Request/response logging with timing
- Production build optimization with esbuild

### Data Storage Solutions

**Database Schema (Drizzle ORM + PostgreSQL)**
- Users table: Authentication and player identity
- Games table: Game metadata, status, and serialized state
- GamePlayers table: Player-game relationships and scores
- Indexes on game_code for fast lookups
- Timestamps for auditing (createdAt, updatedAt)

**ORM Strategy**
- Drizzle-kit for schema management and migrations
- Type-safe queries with full TypeScript inference
- Zod integration for validation schemas
- Schema sharing between client and server via `shared/schema.ts`

**Session Management**
- Prepared for express-session with connect-pg-simple
- Session storage in PostgreSQL for persistence
- Cookie-based authentication ready

### Game Logic Architecture

**Card System**
- Standard 52-card deck implementation
- Card utilities: shuffle, deal, suit/rank helpers
- Play validation (following suit, trump rules)
- Trick evaluation and winner determination

**Game Phases**
1. Setup: Player joining and lobby management
2. Bidding: Sequential bidding with highest bid tracking
3. Trump Selection: Winner chooses trump suit
4. Sit/Pass: Players decide to play or sit out
5. Hand Play: Trick-taking gameplay
6. Scoring: Calculate and update player scores

**AI Player System**
- Hand strength evaluation based on trump and high cards
- Bidding strategy with bluffing probability
- Trump suit selection based on card distribution
- Sit/pass decision logic considering score and hand quality
- Card play using valid move filtering and heuristics
- Automated AI turns via useAIPlayer hook with natural delays
- Three difficulty levels: Easy (makes mistakes), Medium (occasional errors), Hard (optimal play)
- Uses random manly names for AI players (Jack, Luke, Cole, Ryan, Jake, Tyler, etc.)
- Advanced strategies: Collusion (gang up on leaders), Defensive bidding (block leaders from calling trump)

**Multiplayer System**
- WebSocket-based real-time communication (/ws endpoint)
- Room-based architecture with 6-character alphanumeric room codes
- Support for both local (same-device) and online multiplayer
- Host controls: Add AI bots, start game
- Real-time state synchronization across all connected players
- Automatic handling of player joins/leaves
- Works with AI bots in multiplayer rooms

**Scoring Rules**
- Punt (bid 0): +5 if no tricks taken, -1 per trick otherwise
- Regular bid: +bid value if made, -bid value if failed
- Overtime for tricks over bid
- Game ends when player reaches 0 or negative score
- Starting score: 16 points per player

### External Dependencies

**Database**
- Neon Serverless PostgreSQL (@neondatabase/serverless)
- Configured via DATABASE_URL environment variable
- Connection pooling for scalability

**UI Libraries**
- Radix UI component primitives (30+ components)
- Lucide React for icon system
- cmdk for command palette patterns
- class-variance-authority for component variants

**3D Graphics**
- Three.js via React Three Fiber
- GLSL shader support
- Post-processing effects pipeline
- Asset loading for 3D models (GLTF/GLB) and audio files

**Development Tools**
- TypeScript for type checking
- tsx for running TypeScript in Node.js
- Vite runtime error modal plugin for Replit
- PostCSS with Autoprefixer for CSS processing

**Fonts & Typography**
- Inter font family via @fontsource
- Custom CSS variables for theming
- Responsive typography system

**Validation & Forms**
- Zod for schema validation
- React Hook Form integration ready
- Drizzle-Zod for automatic schema generation

**Animation**
- Framer Motion for declarative animations
- CSS transitions via Tailwind
- Spring physics for natural movement

**Build & Deployment**
- Vite for frontend bundling
- esbuild for backend bundling
- Separate client and server builds
- Static asset serving in production
- Environment-based configuration (NODE_ENV)

**iOS Deployment (Capacitor)**
- Capacitor 7.4+ for native iOS app wrapping
- iOS project in `ios/` folder (Xcode project)
- Web app builds to `dist/public` and syncs to iOS
- App ID: com.shnarps.cardgame
- Supports all native iOS features and App Store deployment
- Build process: `vite build` → `npx cap sync ios` → Open in Xcode
- Requires Mac with Xcode and Apple Developer account for App Store submission