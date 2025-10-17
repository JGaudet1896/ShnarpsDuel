import { useShnarps } from '../../lib/stores/useShnarps';
import { Button } from '../ui/button';
import { useGameBoardStore } from '../../lib/stores/useGameBoardStore';

export default function HandPlayPhase() {
  const { 
    currentPlayerIndex, 
    currentTrick,
    playCard,
    playingPlayers,
    nextTrick,
    localPlayerId,
    players
  } = useShnarps();
  
  const { selectedCard, setSelectedCard } = useGameBoardStore();
  
  const currentPlayer = players[currentPlayerIndex];
  const isLocalPlayerTurn = currentPlayer?.id === localPlayerId && playingPlayers.has(currentPlayer.id);
  
  const handleCardPlay = () => {
    if (selectedCard && currentPlayer) {
      playCard(currentPlayer.id, selectedCard);
      setSelectedCard(null);
    }
  };
  
  const isTrickComplete = currentTrick.length === Array.from(playingPlayers).length;

  // Trick complete button
  if (isTrickComplete) {
    return (
      <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40">
        <Button 
          onClick={nextTrick} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-8 touch-manipulation"
        >
          Next Trick
        </Button>
      </div>
    );
  }

  // Local player's turn - show play button if card is selected
  if (isLocalPlayerTurn && selectedCard) {
    return (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 max-w-full px-2">
        <Button 
          onClick={handleCardPlay}
          className="w-full max-w-md mx-auto bg-green-600 hover:bg-green-700 text-white font-bold h-12 touch-manipulation"
        >
          ✓ Play {selectedCard.rank} of {selectedCard.suit}
        </Button>
      </div>
    );
  }

  return null;
}
