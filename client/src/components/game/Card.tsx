import { Card as CardType, getSuitColor, getSuitSymbol } from '../../lib/game/cardUtils';

interface CardProps {
  card: CardType;
  isSelected?: boolean;
  isPlayable?: boolean;
  onClick?: () => void;
  className?: string;
  faceDown?: boolean;
}

export default function Card({ 
  card, 
  isSelected = false,
  isPlayable = true,
  onClick,
  className = '',
  faceDown = false
}: CardProps) {
  const suitColor = getSuitColor(card.suit);
  const suitSymbol = getSuitSymbol(card.suit);
  
  if (faceDown) {
    return (
      <div className={`w-16 h-24 bg-blue-700 border-2 border-blue-900 rounded-lg shadow-lg ${className}`}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-blue-900 text-3xl">🂠</div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={isPlayable ? onClick : undefined}
      disabled={!isPlayable}
      className={`
        w-16 h-24 bg-white border-2 rounded-lg shadow-lg
        flex flex-col relative
        transition-all duration-200
        ${isSelected ? 'border-blue-500 -translate-y-2 shadow-xl' : 'border-gray-300'}
        ${isPlayable ? 'hover:scale-105 cursor-pointer' : 'opacity-60 cursor-not-allowed'}
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
    </button>
  );
}
