import { useShnarps } from '../../lib/stores/useShnarps';
import { Button } from '../ui/button';
import { useGameBoardStore } from '../../lib/stores/useGameBoardStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, Hand } from 'lucide-react';

export default function HandPlayPhase() {
  const {
    currentPlayerIndex,
    currentTrick,
    playCard,
    playingPlayers,
    nextTrick,
    localPlayerId,
    players,
    trumpSuit
  } = useShnarps();

  const { selectedCard, setSelectedCard } = useGameBoardStore();

  const currentPlayer = players[currentPlayerIndex];
  const localPlayer = players.find(p => p.id === localPlayerId);
  // More robust check - if currentPlayer is us and we have cards, we can play
  const isLocalPlayerTurn = currentPlayer?.id === localPlayerId &&
    (playingPlayers.has(currentPlayer.id) || playingPlayers.size === 0 || (localPlayer?.hand?.length ?? 0) > 0);

  const handleCardPlay = () => {
    if (selectedCard && currentPlayer) {
      playCard(currentPlayer.id, selectedCard);
      setSelectedCard(null);
    }
  };

  const isTrickComplete = currentTrick.length === Array.from(playingPlayers).length;

  // Get suit symbol
  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '';
    }
  };

  const getSuitColor = (suit: string) => {
    return suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-gray-800';
  };

  // Trick complete button - positioned at top
  if (isTrickComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40"
      >
        <Button
          onClick={nextTrick}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-bold h-12 px-6 touch-manipulation shadow-xl flex items-center gap-2 text-base"
        >
          Next Trick
          <ArrowRight className="h-5 w-5" />
        </Button>
      </motion.div>
    );
  }

  // Local player's turn - show play button or select prompt at TOP of screen
  if (isLocalPlayerTurn) {
    return (
      <AnimatePresence mode="wait">
        {selectedCard ? (
          <motion.div
            key="play-button"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 max-w-full px-4"
          >
            <Button
              onClick={handleCardPlay}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white font-bold h-12 px-6 touch-manipulation shadow-xl flex items-center justify-center gap-2 text-base"
            >
              <Check className="h-5 w-5" />
              <span>Play</span>
              <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded">
                <span className="font-bold">{selectedCard.rank}</span>
                <span className={getSuitColor(selectedCard.suit)}>
                  {getSuitSymbol(selectedCard.suit)}
                </span>
              </span>
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="select-prompt"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40"
          >
            <div className="bg-yellow-500 text-gray-900 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border-2 border-yellow-400 animate-pulse">
              <Hand className="h-4 w-4" />
              <span className="text-sm font-bold">Your turn - tap a card</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return null;
}
