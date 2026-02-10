import { motion, AnimatePresence } from 'framer-motion';
import { useShnarps } from '../../lib/stores/useShnarps';

export function TurnIndicator() {
  const {
    gamePhase,
    players,
    currentPlayerIndex,
    localPlayerId,
    playingPlayers,
  } = useShnarps();

  const currentPlayer = players[currentPlayerIndex];
  const isLocalPlayerTurn = currentPlayer?.id === localPlayerId;
  const isPlayingPhase = gamePhase === 'bidding' || gamePhase === 'sit_pass' || gamePhase === 'hand_play';

  // Don't show during setup or game over
  if (!isPlayingPhase || !currentPlayer) return null;

  // Get phase-specific action text
  const getActionText = () => {
    switch (gamePhase) {
      case 'bidding':
        return isLocalPlayerTurn ? 'Place your bid' : 'is bidding';
      case 'sit_pass':
        return isLocalPlayerTurn ? 'Play or sit out?' : 'is deciding';
      case 'hand_play':
        return isLocalPlayerTurn ? 'Play a card' : 'is playing';
      default:
        return '';
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${currentPlayer.id}-${gamePhase}`}
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40"
      >
        <div
          className={`
            flex items-center gap-3 px-4 py-2 rounded-full shadow-lg
            ${isLocalPlayerTurn
              ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white animate-turn-pulse'
              : 'bg-gray-900 bg-opacity-90 text-white'
            }
          `}
        >
          {isLocalPlayerTurn && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="w-3 h-3 rounded-full bg-white"
            />
          )}
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm sm:text-base">
              {isLocalPlayerTurn ? 'Your Turn!' : currentPlayer.name}
            </span>
            <span className="text-xs sm:text-sm opacity-90">
              {getActionText()}
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Phase indicator shown at the top
export function PhaseIndicator() {
  const { gamePhase, round } = useShnarps();

  const getPhaseInfo = () => {
    switch (gamePhase) {
      case 'setup':
        return { label: 'Setup', color: 'bg-gray-600' };
      case 'bidding':
        return { label: 'Bidding', color: 'bg-blue-600' };
      case 'trump_selection':
        return { label: 'Trump Selection', color: 'bg-purple-600' };
      case 'sit_pass':
        return { label: 'Sit or Play', color: 'bg-orange-600' };
      case 'hand_play':
        return { label: 'Playing', color: 'bg-green-600' };
      case 'trick_complete':
        return { label: 'Trick Complete', color: 'bg-teal-600' };
      case 'round_complete':
        return { label: 'Round Complete', color: 'bg-indigo-600' };
      case 'everyone_sat':
        return { label: 'Everyone Sat', color: 'bg-red-600' };
      case 'game_over':
        return { label: 'Game Over', color: 'bg-yellow-600' };
      default:
        return { label: gamePhase, color: 'bg-gray-600' };
    }
  };

  const { label, color } = getPhaseInfo();

  // Don't show during setup or game over (those have their own UIs)
  if (gamePhase === 'setup' || gamePhase === 'game_over') return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed top-4 left-4 z-30"
    >
      <div className={`${color} text-white px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2`}>
        <span className="text-xs font-medium opacity-80">Round {round}</span>
        <span className="w-px h-4 bg-white bg-opacity-30" />
        <span className="text-sm font-semibold">{label}</span>
      </div>
    </motion.div>
  );
}
