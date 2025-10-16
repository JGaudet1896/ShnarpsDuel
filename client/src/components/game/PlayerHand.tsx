import Card from './Card';
import { Card as CardType } from '../../lib/game/cardUtils';

interface PlayerHandProps {
  cards: CardType[];
  isCurrentPlayer: boolean;
  selectedCard?: CardType;
  onCardClick?: (card: CardType) => void;
  faceUp?: boolean;
}

export default function PlayerHand({ 
  cards, 
  isCurrentPlayer,
  selectedCard,
  onCardClick,
  faceUp = true
}: PlayerHandProps) {

  if (!faceUp) {
    return (
      <div className="flex gap-1">
        {cards.map((_, index) => (
          <div key={index} className="w-12 h-20 bg-blue-700 border-2 border-blue-900 rounded-lg shadow-md">
            <div className="w-full h-full flex items-center justify-center text-blue-900 text-2xl">
              🂠
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      {cards.map((card, index) => (
        <Card
          key={`${card.suit}-${card.rank}-${index}`}
          card={card}
          isSelected={selectedCard?.suit === card.suit && selectedCard?.rank === card.rank}
          isPlayable={isCurrentPlayer}
          onClick={() => isCurrentPlayer && onCardClick?.(card)}
        />
      ))}
    </div>
  );
}
