import Card from './Card';
import { Card as CardType } from '../../lib/game/cardUtils';

interface PlayerHandProps {
  cards: CardType[];
  isCurrentPlayer: boolean;
  onCardClick?: (card: CardType) => void;
  faceUp?: boolean;
}

export default function PlayerHand({
  cards,
  isCurrentPlayer,
  onCardClick,
  faceUp = true
}: PlayerHandProps) {

  if (!faceUp) {
    return (
      <div className="flex justify-center items-center">
        {cards.slice(0, 5).map((card, index) => (
          <div key={`${card.suit}-${card.rank}-${index}`}
               className={index > 0 ? '-ml-4 sm:-ml-5' : ''}>
            <Card
              card={card}
              faceDown={true}
              delay={index * 0.05}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex justify-center max-w-[280px] sm:max-w-[320px] lg:max-w-[400px] overflow-x-auto pb-2 touch-pan-x scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-transparent">
      {cards.map((card, index) => (
        <div key={`${card.suit}-${card.rank}-${index}`}
             className={index > 0 ? '-ml-3 sm:-ml-4 lg:-ml-5' : ''}>
          <Card
            card={card}
            isPlayable={isCurrentPlayer}
            onClick={() => isCurrentPlayer && onCardClick?.(card)}
            delay={index * 0.1}
          />
        </div>
      ))}
    </div>
  );
}
