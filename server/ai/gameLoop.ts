// Server-side game loop for AI players
import { makeAIBid, chooseAITrumpSuit, makeAISitPlayDecision, chooseAICardToPlay } from './aiEngine';
import { canPlayerSit, getPlayableCards } from './cardHelpers';

export interface GameRoom {
  roomCode: string;
  players: Map<string, any>;
  gameState: any;
}

// Execute AI turn for the current player if they're an AI
export function processAITurn(room: GameRoom, broadcast: (message: any) => void): void {
  const playerArray = Array.from(room.players.values());
  const currentPlayer = playerArray[room.gameState.currentPlayerIndex];
  
  if (!currentPlayer || !currentPlayer.isAI) {
    // Not AI's turn
    return;
  }
  
  const gamePhase = room.gameState.gamePhase;
  
  // Add small delay to make AI feel more natural
  setTimeout(() => {
    try {
      switch (gamePhase) {
        case 'bidding': {
          const bidValues = Array.from(room.gameState.bids.values()) as number[];
          const currentHighestBid = Math.max(0, ...bidValues);
          const isDealer = room.gameState.currentPlayerIndex === room.gameState.dealerIndex;
          const highestBidderId = room.gameState.highestBidder;
          const difficulty = currentPlayer.aiDifficulty || 'medium';
          
          const aiBid = makeAIBid(
            currentPlayer.hand,
            currentHighestBid,
            isDealer,
            playerArray.length,
            currentPlayer.id,
            room.gameState.scores,
            highestBidderId,
            difficulty
          );
          
          console.log(`🤖 AI ${currentPlayer.name} bids ${aiBid}`);
          
          // Broadcast bid action to all clients
          broadcast({
            type: 'GAME_STATE_UPDATE',
            action: 'bid',
            payload: { playerId: currentPlayer.id, bid: aiBid }
          });
          break;
        }
        
        case 'trump_selection': {
          const difficulty = currentPlayer.aiDifficulty || 'medium';
          const aiTrump = chooseAITrumpSuit(currentPlayer.hand, difficulty);
          
          console.log(`🤖 AI ${currentPlayer.name} chooses ${aiTrump} as trump`);
          
          broadcast({
            type: 'GAME_STATE_UPDATE',
            action: 'trump',
            payload: { suit: aiTrump }
          });
          break;
        }
        
        case 'sit_pass': {
          const bidValues = Array.from(room.gameState.bids.values()) as number[];
          const highestBid = Math.max(0, ...bidValues);
          const canSit = canPlayerSit(currentPlayer, highestBid, room.gameState.trumpSuit);
          const currentScore = room.gameState.scores.get(currentPlayer.id);
          const difficulty = currentPlayer.aiDifficulty || 'medium';
          
          const decision = makeAISitPlayDecision(
            currentPlayer,
            currentPlayer.hand,
            room.gameState.trumpSuit,
            highestBid,
            canSit,
            currentScore,
            room.gameState.scores,
            difficulty
          );
          
          console.log(`🤖 AI ${currentPlayer.name} decides to ${decision}`);
          
          broadcast({
            type: 'GAME_STATE_UPDATE',
            action: 'sitpass',
            payload: { playerId: currentPlayer.id, decision }
          });
          break;
        }
        
        case 'hand_play': {
          const playableCards = getPlayableCards(
            currentPlayer.hand,
            room.gameState.currentTrick,
            room.gameState.trumpSuit
          );
          const difficulty = currentPlayer.aiDifficulty || 'medium';
          
          const cardToPlay = chooseAICardToPlay(
            currentPlayer.hand,
            room.gameState.currentTrick,
            room.gameState.trumpSuit,
            playableCards,
            difficulty
          );
          
          console.log(`🤖 AI ${currentPlayer.name} plays ${cardToPlay.rank}${cardToPlay.suit}`);
          
          broadcast({
            type: 'GAME_STATE_UPDATE',
            action: 'playcard',
            payload: { playerId: currentPlayer.id, card: cardToPlay }
          });
          break;
        }
        
        case 'everyone_sat': {
          // AI strategy: Usually better to take -5 yourself (moves toward winning)
          // But if very close to losing (score >= 28), give +5 to others instead
          const currentScore = room.gameState.scores.get(currentPlayer.id) || 16;
          const choice = currentScore >= 28 ? 'others' : 'self';
          
          console.log(`🤖 AI ${currentPlayer.name} chooses penalty: ${choice}`);
          
          broadcast({
            type: 'GAME_STATE_UPDATE',
            action: 'penalty',
            payload: { choice }
          });
          break;
        }
      }
    } catch (error) {
      console.error('❌ Error processing AI turn:', error);
    }
  }, 800); // 800ms delay for natural feel
}
