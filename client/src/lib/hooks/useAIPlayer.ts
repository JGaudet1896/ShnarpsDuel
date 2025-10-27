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
    scores,
    isSimulating,
    multiplayerMode,
    isMultiplayerHost
  } = useShnarps();

  useEffect(() => {
    const currentPlayer = players[currentPlayerIndex];
    
    if (!currentPlayer || !currentPlayer.isAI) return;

    // In online multiplayer, only the host should control AI players
    if (multiplayerMode === 'online' && !isMultiplayerHost) {
      return;
    }

    const difficulty = currentPlayer.aiDifficulty || 'medium';

    // Check if any human players are in the game
    const hasHumanInGame = players.some(p => !p.isAI);
    
    // During hand_play, check if any human is actually playing (not sitting)
    const hasHumanPlaying = gamePhase === 'hand_play' 
      ? players.some(p => !p.isAI && playingPlayers.has(p.id))
      : hasHumanInGame;
    
    // Speed control: instant when simulating (10ms), fast when only bots (100-200ms), normal with humans (300-500ms)
    const baseDelay = isSimulating ? 10 : (hasHumanPlaying ? 300 : 100);
    const randomDelay = isSimulating ? 0 : (hasHumanPlaying ? 200 : 100);

    // Add delay to make AI decisions feel more natural
    const aiDelay = setTimeout(() => {
      // Bidding phase
      if (gamePhase === 'bidding') {
        const currentHighestBid = Math.max(0, ...Array.from(bids.values()));
        const isDealer = currentPlayerIndex === useShnarps.getState().dealerIndex;
        const highestBidderId = useShnarps.getState().highestBidder;
        const aiBid = makeAIBid(
          currentPlayer.hand, 
          currentHighestBid, 
          isDealer, 
          players.length,
          currentPlayer.id,
          scores,
          highestBidderId,
          difficulty
        );
        placeBid(currentPlayer.id, aiBid);
      }

      // Trump selection phase
      else if (gamePhase === 'trump_selection') {
        const aiTrump = chooseAITrumpSuit(currentPlayer.hand, difficulty);
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
        const currentScore = scores.get(currentPlayer.id) || 16;
        const decision = makeAISitPlayDecision(
          currentPlayer,
          currentPlayer.hand,
          trumpSuit,
          highestBid,
          canSit,
          currentScore,
          scores,
          difficulty
        );
        chooseSitOrPlay(currentPlayer.id, decision);
      }

      // Hand play phase
      else if (gamePhase === 'hand_play' && playingPlayers.has(currentPlayer.id)) {
        // CRITICAL: Check if this player already played in current trick
        const hasPlayedInTrick = currentTrick.some(play => play.playerId === currentPlayer.id);
        if (hasPlayedInTrick) {
          return; // Already played, don't play again
        }
        
        const playableCards = currentPlayer.hand.filter(card =>
          isValidPlay(card, currentPlayer.hand, currentTrick, trumpSuit)
        );
        
        if (playableCards.length > 0) {
          const cardToPlay = chooseAICardToPlay(
            currentPlayer.hand,
            currentTrick,
            trumpSuit,
            playableCards,
            difficulty
          );
          playCard(currentPlayer.id, cardToPlay);
        }
      }
    }, baseDelay + Math.random() * randomDelay);

    return () => clearTimeout(aiDelay);
  }, [gamePhase, currentPlayerIndex, players, bids, trumpSuit, currentTrick, playingPlayers, scores, isSimulating, multiplayerMode, isMultiplayerHost, placeBid, chooseTrumpSuit, chooseSitOrPlay, choosePenalty, playCard]);
}
