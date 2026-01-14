// Server-side game loop for AI players
import { makeAIBid, chooseAITrumpSuit, makeAISitPlayDecision, chooseAICardToPlay } from './aiEngine';
import { canPlayerSit, getPlayableCards } from './cardHelpers';

export interface GameRoom {
  roomCode: string;
  players: Map<string, any>;
  gameState: any;
}

// Import the applyGameAction function from websocket module
// This will be set by websocket.ts
let applyGameActionFn: ((room: GameRoom, action: string, payload: any) => void) | null = null;
let broadcastGameStateFn: ((room: GameRoom) => void) | null = null;

export function setApplyGameAction(fn: (room: GameRoom, action: string, payload: any) => void) {
  applyGameActionFn = fn;
}

export function setBroadcastGameState(fn: (room: GameRoom) => void) {
  broadcastGameStateFn = fn;
}

// Execute AI turn for the current player if they're an AI
export function processAITurn(room: GameRoom, broadcast: (message: any) => void): void {
  // Check if current player is AI - if not, stop the loop
  const playerArray = Array.from(room.players.values());
  const currentPlayer = playerArray[room.gameState.currentPlayerIndex];

  if (!currentPlayer || !currentPlayer.isAI) {
    // Not AI's turn, stop processing
    return;
  }

  const gamePhase = room.gameState.gamePhase;

  // Only proceed in these phases
  if (!['bidding', 'trump_selection', 'sit_pass', 'hand_play', 'everyone_sat'].includes(gamePhase)) {
    return;
  }

  // Add small delay to make AI feel more natural
  setTimeout(() => {
    try {
      // Re-check that it's still this player's turn (state may have changed)
      const updatedPlayerArray = Array.from(room.players.values());
      const updatedPlayer = updatedPlayerArray[room.gameState.currentPlayerIndex];
      if (!updatedPlayer || updatedPlayer.id !== currentPlayer.id) {
        // Player turn changed, don't process
        return;
      }

      switch (gamePhase) {
        case 'bidding': {
          const bidValues = Array.from(room.gameState.bids.values()) as number[];
          const currentHighestBid = Math.max(0, ...bidValues);
          const isDealer = room.gameState.currentPlayerIndex === room.gameState.dealerIndex;
          const highestBidderId = room.gameState.highestBidder;

          const aiBid = makeAIBid(
            currentPlayer.hand,
            currentHighestBid,
            isDealer,
            playerArray.length,
            currentPlayer.id,
            room.gameState.scores,
            highestBidderId
          );

          console.log(`🤖 AI ${currentPlayer.name} bids ${aiBid}`);

          // Apply action to server state
          if (applyGameActionFn) {
            applyGameActionFn(room, 'bid', { playerId: currentPlayer.id, bid: aiBid });
          }

          // Broadcast bid action to all clients
          broadcast({
            type: 'GAME_STATE_UPDATE',
            action: 'bid',
            payload: { playerId: currentPlayer.id, bid: aiBid }
          });

          // CRITICAL: Broadcast full game state to ensure sync
          if (broadcastGameStateFn) {
            broadcastGameStateFn(room);
          }

          // Continue processing next AI turn
          setTimeout(() => processAITurn(room, broadcast), 500);
          break;
        }

        case 'trump_selection': {
          const aiTrump = chooseAITrumpSuit(currentPlayer.hand);

          console.log(`🤖 AI ${currentPlayer.name} chooses ${aiTrump} as trump`);

          // Apply action to server state
          if (applyGameActionFn) {
            applyGameActionFn(room, 'trump', { suit: aiTrump });
          }

          broadcast({
            type: 'GAME_STATE_UPDATE',
            action: 'trump',
            payload: { suit: aiTrump }
          });

          // CRITICAL: Broadcast full game state to ensure sync
          if (broadcastGameStateFn) {
            broadcastGameStateFn(room);
          }

          // Continue processing next AI turn
          setTimeout(() => processAITurn(room, broadcast), 500);
          break;
        }

        case 'sit_pass': {
          const bidValues = Array.from(room.gameState.bids.values()) as number[];
          const highestBid = Math.max(0, ...bidValues);
          const canSit = canPlayerSit(currentPlayer, highestBid, room.gameState.trumpSuit);
          const currentScore = room.gameState.scores.get(currentPlayer.id);

          const decision = makeAISitPlayDecision(
            currentPlayer,
            currentPlayer.hand,
            room.gameState.trumpSuit,
            highestBid,
            canSit,
            currentScore,
            room.gameState.scores
          );

          console.log(`🤖 AI ${currentPlayer.name} decides to ${decision}`);

          // Update consecutiveSits on server
          if (decision === 'play') {
            currentPlayer.consecutiveSits = 0;
          } else {
            currentPlayer.consecutiveSits += 1;
          }

          // Apply action to server state
          if (applyGameActionFn) {
            applyGameActionFn(room, 'sitpass', { playerId: currentPlayer.id, decision });
          }

          broadcast({
            type: 'GAME_STATE_UPDATE',
            action: 'sitpass',
            payload: { playerId: currentPlayer.id, decision }
          });

          // CRITICAL: Broadcast full game state to ensure sync
          if (broadcastGameStateFn) {
            broadcastGameStateFn(room);
          }

          // Continue processing next AI turn
          setTimeout(() => processAITurn(room, broadcast), 500);
          break;
        }

        case 'hand_play': {
          // CRITICAL: Skip if this player is not in playingPlayers (they sat out)
          if (!room.gameState.playingPlayers.has(currentPlayer.id)) {
            console.log(`⚠️ AI ${currentPlayer.name} is sitting out, skipping hand_play`);
            return;
          }

          const playableCards = getPlayableCards(
            currentPlayer.hand,
            room.gameState.currentTrick,
            room.gameState.trumpSuit
          );

          const cardToPlay = chooseAICardToPlay(
            currentPlayer.hand,
            room.gameState.currentTrick,
            room.gameState.trumpSuit,
            playableCards
          );

          console.log(`🤖 AI ${currentPlayer.name} plays ${cardToPlay.rank}${cardToPlay.suit}`);

          // Apply action to server state
          if (applyGameActionFn) {
            applyGameActionFn(room, 'playcard', { playerId: currentPlayer.id, card: cardToPlay });
          }

          broadcast({
            type: 'GAME_STATE_UPDATE',
            action: 'playcard',
            payload: { playerId: currentPlayer.id, card: cardToPlay }
          });

          // CRITICAL: Broadcast full game state to ensure sync
          if (broadcastGameStateFn) {
            broadcastGameStateFn(room);
          }

          // Continue processing next AI turn
          setTimeout(() => processAITurn(room, broadcast), 500);
          break;
        }

        case 'everyone_sat': {
          // AI strategy: Usually better to take -5 yourself (moves toward winning)
          // But if very close to losing (score >= 28), give +5 to others instead
          const currentScore = room.gameState.scores.get(currentPlayer.id) || 16;
          const choice = currentScore >= 28 ? 'others' : 'self';

          console.log(`🤖 AI ${currentPlayer.name} chooses penalty: ${choice}`);

          // Apply action to server state
          if (applyGameActionFn) {
            applyGameActionFn(room, 'penalty', { choice });
          }

          broadcast({
            type: 'GAME_STATE_UPDATE',
            action: 'penalty',
            payload: { choice }
          });

          // CRITICAL: Broadcast full game state to ensure sync
          if (broadcastGameStateFn) {
            broadcastGameStateFn(room);
          }

          // Continue processing next AI turn
          setTimeout(() => processAITurn(room, broadcast), 500);
          break;
        }
      }
    } catch (error) {
      console.error('❌ Error processing AI turn:', error);
    }
  }, 800); // 800ms delay for natural feel
}
