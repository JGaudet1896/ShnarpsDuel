import { motion } from 'framer-motion';
import { Card as CardType, getSuitColor, getSuitSymbol } from '../../lib/game/cardUtils';

interface CardProps {
  card: CardType;
  isSelected?: boolean;
  isPlayable?: boolean;
  onClick?: () => void;
  className?: string;
  faceDown?: boolean;
  delay?: number;
}

export default function Card({ 
  card, 
  isSelected = false,
  isPlayable = true,
  onClick,
  className = '',
  faceDown = false,
  delay = 0
}: CardProps) {
  const suitColor = getSuitColor(card.suit);
  const suitSymbol = getSuitSymbol(card.suit);
  
  if (faceDown) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.5, rotateY: 180 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        transition={{ duration: 0.3, delay }}
        className={`w-16 h-24 bg-blue-700 border-2 border-blue-900 rounded-lg shadow-lg ${className}`}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-blue-900 text-3xl">🂠</div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.5, y: -50 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        y: isSelected ? -8 : 0 
      }}
      whileHover={isPlayable ? { scale: 1.05 } : {}}
      transition={{ duration: 0.3, delay }}
      onClick={isPlayable ? onClick : undefined}
      disabled={!isPlayable}
      className={`
        w-16 h-24 bg-white border-2 rounded-lg shadow-lg
        flex flex-col relative
        ${isSelected ? 'border-blue-500 shadow-xl' : 'border-gray-300'}
        ${isPlayable ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}
        ${className}
      `}
    >
      {/* Top left corner */}
      <div className="absolute top-1 left-1 flex flex-col items-center leading-none">
        <span className="text-xs font-bold" style={{ color: suitColor }}>
          {card.rank}
        </span>
        <span className="text-sm" style={{ color: suitColor }}>
          {suitSymbol}
        </span>
      </div>

      {/* Center suit */}
      <div className="flex-1 flex items-center justify-center">
        <span className="text-3xl" style={{ color: suitColor }}>
          {suitSymbol}
        </span>
      </div>

      {/* Bottom right corner (rotated) */}
      <div className="absolute bottom-1 right-1 flex flex-col items-center leading-none rotate-180">
        <span className="text-xs font-bold" style={{ color: suitColor }}>
          {card.rank}
        </span>
        <span className="text-sm" style={{ color: suitColor }}>
          {suitSymbol}
        </span>
      </div>
    </motion.button>
  );
}
