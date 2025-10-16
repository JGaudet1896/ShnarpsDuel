import { useEffect } from 'react';
import { useShnarps } from '../stores/useShnarps';
import { makeAIBid, chooseAITrumpSuit, makeAISitPlayDecision, chooseAICardToPlay } from '../game/aiPlayer';
import { isValidPlay } from '../game/cardUtils';
import { canPlayerSit } from '../game/gameLogic';

export function useAIPlayer() {
  const { 
    gamePhase, 
    players, 
    currentPlayerIndex, 
    bids,
    placeBid,
    chooseTrumpSuit,
    chooseSitOrPlay,
    choosePenalty,
    playCard,
    trumpSuit,
    currentTrick,
    playingPlayers,
    scores
  } = useShnarps();

  useEffect(() => {
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer || !currentPlayer.isAI) return;

    // Add delay to make AI decisions feel more natural
    const aiDelay = setTimeout(() => {
      // Bidding phase
      if (gamePhase === 'bidding') {
        const currentHighestBid = Math.max(0, ...Array.from(bids.values()));
        const isDealer = currentPlayerIndex === useShnarps.getState().dealerIndex;
        const aiBid = makeAIBid(currentPlayer.hand, currentHighestBid, isDealer);
        placeBid(currentPlayer.id, aiBid);
      }

      // Trump selection phase
      else if (gamePhase === 'trump_selection') {
        const aiTrump = chooseAITrumpSuit(currentPlayer.hand);
        chooseTrumpSuit(aiTrump);
      }

      // Everyone sat out phase
      else if (gamePhase === 'everyone_sat') {
        // AI strategy: Usually better to take -5 yourself (moves toward winning)
        // But if very close to losing (score >= 28), give +5 to others instead
        const currentScore = scores.get(currentPlayer.id) || 16;
        const choice = currentScore >= 28 ? 'others' : 'self';
        choosePenalty(choice);
      }

      // Sit/pass phase
      else if (gamePhase === 'sit_pass') {
        const highestBid = Math.max(0, ...Array.from(bids.values()));
        const canSit = canPlayerSit(currentPlayer, highestBid, trumpSuit);
        const decision = makeAISitPlayDecision(
          currentPlayer,
          currentPlayer.hand,
          trumpSuit,
          highestBid,
          canSit
        );
        chooseSitOrPlay(currentPlayer.id, decision);
      }

      // Hand play phase
      else if (gamePhase === 'hand_play' && playingPlayers.has(currentPlayer.id)) {
        const playableCards = currentPlayer.hand.filter(card =>
          isValidPlay(card, currentPlayer.hand, currentTrick, trumpSuit)
        );
        
        if (playableCards.length > 0) {
          const cardToPlay = chooseAICardToPlay(
            currentPlayer.hand,
            currentTrick,
            trumpSuit,
            playableCards
          );
          playCard(currentPlayer.id, cardToPlay);
        }
      }
    }, 800 + Math.random() * 400); // 800-1200ms delay

    return () => clearTimeout(aiDelay);
  }, [gamePhase, currentPlayerIndex, players, bids, trumpSuit, currentTrick, playingPlayers, scores, placeBid, chooseTrumpSuit, chooseSitOrPlay, choosePenalty, playCard]);
}
