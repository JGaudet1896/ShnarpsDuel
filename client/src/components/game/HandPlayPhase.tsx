import { useState } from 'react';
import { useShnarps } from '../../lib/stores/useShnarps';
import { Button } from '../ui/button';
import { Card as CardType, isValidPlay } from '../../lib/game/cardUtils';

export default function HandPlayPhase() {
  const { 
    players, 
    currentPlayerIndex, 
    currentTrick,
    playCard,
    playingPlayers,
    trumpSuit,
    nextTrick,
    localPlayerId
  } = useShnarps();
  
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  
  const currentPlayer = players[currentPlayerIndex];
  const localPlayer = players.find(p => p.id === localPlayerId);
  const isLocalPlayerTurn = currentPlayer?.id === localPlayerId && playingPlayers.has(currentPlayer.id);
  
  const handleCardPlay = () => {
    if (selectedCard && currentPlayer) {
      playCard(currentPlayer.id, selectedCard);
      setSelectedCard(null);
    }
  };
  
  const isCardPlayable = (card: CardType) => {
    if (!localPlayer) return false;
    return isValidPlay(card, localPlayer.hand, currentTrick, trumpSuit);
  };
  
  const isTrickComplete = currentTrick.length === Array.from(playingPlayers).length;

  // Trick complete button
  if (isTrickComplete) {
    return (
      <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40">
        <Button 
          onClick={nextTrick} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-8 touch-manipulation"
        >
          Next Trick
        </Button>
      </div>
    );
  }

  // Local player's turn - show hand
  if (isLocalPlayerTurn && localPlayer) {
    return (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 max-w-full px-2">
        <div className="flex gap-1 justify-center mb-3 overflow-x-auto pb-2">
          {localPlayer.hand.map((card, index) => {
            const isPlayable = isCardPlayable(card);
            const isSelected = selectedCard?.suit === card.suit && selectedCard?.rank === card.rank;
            const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
            const cardColor = isRed ? 'text-red-600' : 'text-black';
            
            return (
              <Button
                key={index}
                variant={isSelected ? "default" : "outline"}
                onClick={() => {
                  if (isPlayable) {
                    setSelectedCard(card);
                  }
                }}
                disabled={!isPlayable}
                className={`flex flex-col h-auto p-1 min-w-[45px] transition-all bg-white border-gray-600 touch-manipulation ${
                  isSelected ? 'ring-2 ring-blue-400 scale-110' : ''
                } ${
                  isPlayable ? 'hover:scale-105 cursor-pointer' : 'opacity-40'
                }`}
              >
                <span className={`text-[10px] font-bold ${cardColor}`}>{card.rank}</span>
                <span className={`text-lg ${cardColor}`}>
                  {card.suit === 'hearts' ? '♥' : 
                   card.suit === 'diamonds' ? '♦' : 
                   card.suit === 'clubs' ? '♣' : '♠'}
                </span>
              </Button>
            );
          })}
        </div>
        
        {selectedCard && (
          <Button 
            onClick={handleCardPlay}
            className="w-full max-w-md mx-auto bg-green-600 hover:bg-green-700 text-white font-bold h-12 touch-manipulation"
          >
            ✓ Play {selectedCard.rank} of {selectedCard.suit}
          </Button>
        )}
      </div>
    );
  }

  return null;
}
