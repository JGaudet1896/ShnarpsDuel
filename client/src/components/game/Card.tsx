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
  isCurrentPlayerCard?: boolean;
}

export default function Card({
  card,
  isSelected = false,
  isPlayable = true,
  onClick,
  className = '',
  faceDown = false,
  delay = 0,
  isCurrentPlayerCard = false
}: CardProps) {
  const suitColor = getSuitColor(card.suit);
  const suitSymbol = getSuitSymbol(card.suit);

  // Get suit name for accessibility
  const suitName = card.suit.charAt(0).toUpperCase() + card.suit.slice(1);
  const rankName = card.rank === 'A' ? 'Ace' :
                   card.rank === 'K' ? 'King' :
                   card.rank === 'Q' ? 'Queen' :
                   card.rank === 'J' ? 'Jack' : card.rank;

  if (faceDown) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.5, rotateY: 180 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        transition={{ duration: 0.3, delay }}
        className={`w-7 h-10 sm:w-8 sm:h-12 rounded shadow-md overflow-hidden ${className}`}
        aria-label="Face-down card"
        role="img"
      >
        {/* Card back design */}
        <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 border border-blue-900 flex items-center justify-center">
          <div className="w-4 h-6 sm:w-5 sm:h-8 rounded-sm bg-blue-500 bg-opacity-30 border border-blue-400 border-opacity-40 flex items-center justify-center">
            <div className="w-2 h-3 sm:w-3 sm:h-4 rounded-sm bg-gradient-to-br from-blue-300 to-blue-500 opacity-60" />
          </div>
        </div>
      </motion.div>
    );
  }

  // Determine glow and styling based on state
  const getCardStyles = () => {
    if (isSelected) {
      return {
        borderColor: '#22c55e',
        boxShadow: '0 0 20px 6px rgba(34, 197, 94, 0.6), 0 0 40px 12px rgba(34, 197, 94, 0.3), 0 10px 25px -5px rgba(0, 0, 0, 0.3)',
      };
    }
    if (isPlayable && isCurrentPlayerCard) {
      return {
        borderColor: '#3b82f6',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      };
    }
    return {
      borderColor: '#d1d5db',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    };
  };

  const cardStyles = getCardStyles();

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.5, y: -50 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: isSelected ? -12 : 0,
        ...cardStyles
      }}
      whileHover={isPlayable ? {
        scale: 1.08,
        y: isSelected ? -14 : -6,
        boxShadow: isSelected
          ? '0 0 25px 8px rgba(34, 197, 94, 0.7), 0 0 50px 15px rgba(34, 197, 94, 0.4), 0 15px 30px -5px rgba(0, 0, 0, 0.3)'
          : '0 0 15px 4px rgba(59, 130, 246, 0.5), 0 10px 25px -5px rgba(0, 0, 0, 0.2)'
      } : {}}
      whileTap={isPlayable ? { scale: 0.95 } : {}}
      transition={{
        duration: 0.2,
        delay,
        boxShadow: { duration: 0.15 }
      }}
      onClick={isPlayable ? onClick : undefined}
      disabled={!isPlayable}
      aria-label={`${rankName} of ${suitName}${isSelected ? ', selected' : ''}${!isPlayable ? ', not playable' : ''}`}
      aria-pressed={isSelected}
      style={cardStyles}
      className={`
        w-20 h-28 sm:w-16 sm:h-24 bg-white border-2 rounded-lg
        flex flex-col relative touch-manipulation transition-colors
        ${isSelected ? 'animate-card-glow z-10' : ''}
        ${isPlayable ? 'cursor-pointer active:scale-95' : 'opacity-50 cursor-not-allowed grayscale-[30%]'}
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
