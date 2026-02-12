import { useShnarps } from '../../lib/stores/useShnarps';
import { Button } from '../ui/button';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function HandPlayPhase() {
  const {
    currentTrick,
    playingPlayers,
    nextTrick
  } = useShnarps();

  const isTrickComplete = currentTrick.length === Array.from(playingPlayers).length && playingPlayers.size > 0;

  // Only show Next Trick button when trick is complete
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

  return null;
}
