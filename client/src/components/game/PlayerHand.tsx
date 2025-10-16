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
      <div className="flex overflow-x-auto pb-1 touch-pan-x scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-200">
        {cards.map((card, index) => (
          <div key={`${card.suit}-${card.rank}-${index}`} 
               className={index > 0 ? '-ml-2' : ''}>
            <Card
              card={card}
              faceDown={true}
              delay={index * 0.1}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex overflow-x-auto pb-2 touch-pan-x scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-200">
      {cards.map((card, index) => (
        <div key={`${card.suit}-${card.rank}-${index}`} 
             className={index > 0 ? '-ml-4 sm:-ml-6' : ''}>
          <Card
            card={card}
            isSelected={selectedCard?.suit === card.suit && selectedCard?.rank === card.rank}
            isPlayable={isCurrentPlayer}
            onClick={() => isCurrentPlayer && onCardClick?.(card)}
            delay={index * 0.1}
          />
        </div>
      ))}
    </div>
  );
}
