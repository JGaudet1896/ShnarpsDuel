import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
  size: number;
}

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
}

const COLORS = [
  '#fbbf24', // gold
  '#22c55e', // green
  '#3b82f6', // blue
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f97316', // orange
  '#06b6d4', // cyan
];

export function Confetti({ isActive, duration = 4000 }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (isActive) {
      // Generate confetti pieces
      const newPieces: ConfettiPiece[] = [];
      for (let i = 0; i < 50; i++) {
        newPieces.push({
          id: i,
          x: Math.random() * 100,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          delay: Math.random() * 0.5,
          rotation: Math.random() * 360,
          size: 8 + Math.random() * 8,
        });
      }
      setPieces(newPieces);

      // Clear after duration
      const timer = setTimeout(() => {
        setPieces([]);
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setPieces([]);
    }
  }, [isActive, duration]);

  return (
    <AnimatePresence>
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{
            opacity: 1,
            y: -20,
            x: `${piece.x}vw`,
            rotate: 0,
            scale: 1,
          }}
          animate={{
            opacity: [1, 1, 0],
            y: '110vh',
            rotate: piece.rotation + 720,
            scale: [1, 1.2, 0.8],
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 3 + Math.random(),
            delay: piece.delay,
            ease: 'easeOut',
          }}
          style={{
            position: 'fixed',
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        />
      ))}
    </AnimatePresence>
  );
}

// Smaller celebration for trick wins
export function TrickWinCelebration({
  isActive,
  winnerName
}: {
  isActive: boolean;
  winnerName?: string;
}) {
  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.5, y: -20 }}
      className="fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
    >
      <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-6 py-3 rounded-full shadow-2xl">
        <p className="text-lg font-bold text-center">
          {winnerName ? `${winnerName} wins the trick!` : 'Trick complete!'}
        </p>
      </div>
    </motion.div>
  );
}
