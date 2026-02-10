import { useShnarps } from '@/lib/stores/useShnarps';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';

export function TurnTimer() {
  const { turnTimeRemaining, multiplayerMode, currentPlayerIndex, localPlayerId, players } = useShnarps();

  // Only show in multiplayer
  if (multiplayerMode !== 'online' || turnTimeRemaining === null) {
    return null;
  }

  const currentPlayer = players[currentPlayerIndex];
  const isLocalPlayerTurn = currentPlayer?.id === localPlayerId;

  const percentage = Math.max(0, (turnTimeRemaining / 30) * 100);
  const isLowTime = turnTimeRemaining <= 10;
  const isVeryLowTime = turnTimeRemaining <= 5;

  // Color based on time remaining
  const getColor = () => {
    if (isVeryLowTime) return { bg: 'bg-red-500', text: 'text-red-400', border: 'border-red-500' };
    if (isLowTime) return { bg: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500' };
    return { bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500' };
  };

  const colors = getColor();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -10 }}
        className="fixed top-14 right-4 z-30"
      >
        <div
          className={`
            bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-xl
            border ${colors.border} overflow-hidden
            ${isVeryLowTime ? 'animate-pulse' : ''}
          `}
        >
          <div className="px-3 py-2 flex items-center gap-2">
            <Clock className={`h-4 w-4 ${colors.text}`} />
            <span className={`text-lg font-bold tabular-nums ${colors.text}`}>
              {turnTimeRemaining}s
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-gray-800">
            <motion.div
              className={`h-full ${colors.bg}`}
              initial={{ width: '100%' }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
        {/* Warning message when low time */}
        {isVeryLowTime && isLocalPlayerTurn && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-xs text-red-400 font-medium text-center bg-red-900/50 rounded px-2 py-1"
          >
            Hurry!
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
