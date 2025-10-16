import { useState } from 'react';
import { useShnarps } from '../../lib/stores/useShnarps';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
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

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="pb-2">
          <CardTitle className="text-center text-lg">Hand Play</CardTitle>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Trump: {trumpSuit}</span>
            <span>Trick: {currentTrick.length}/{Array.from(playingPlayers).length}</span>
            <span>Turn: {currentPlayer?.name}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current trick display */}
          {currentTrick.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Current Trick:</h3>
              <div className="flex flex-wrap gap-2">
                {currentTrick.map((play, index) => {
                  const player = players.find(p => p.id === play.playerId);
                  return (
                    <div key={index} className="text-xs bg-muted p-2 rounded">
                      <div className="font-medium">{player?.name}</div>
                      <div>{play.card.rank} of {play.card.suit}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Local player controls */}
          {isLocalPlayerTurn && localPlayer && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">🃏 Your Hand - Click a card to play it:</h3>
              <div className="flex flex-wrap gap-3 justify-center">
                {localPlayer.hand.map((card, index) => {
                  const isPlayable = isCardPlayable(card);
                  const isSelected = selectedCard?.suit === card.suit && selectedCard?.rank === card.rank;
                  
                  return (
                    <Button
                      key={index}
                      variant={isSelected ? "default" : "outline"}
                      size="lg"
                      onClick={() => {
                        if (isPlayable) {
                          setSelectedCard(card);
                        }
                      }}
                      disabled={!isPlayable}
                      className={`flex flex-col h-auto p-3 min-w-[80px] transition-all ${
                        isSelected ? 'ring-2 ring-blue-500 scale-105' : ''
                      } ${
                        isPlayable ? 'hover:scale-105 cursor-pointer' : 'opacity-40'
                      }`}
                    >
                      <span className="text-sm font-bold">{card.rank}</span>
                      <span className="text-2xl">
                        {card.suit === 'hearts' ? '♥' : 
                         card.suit === 'diamonds' ? '♦' : 
                         card.suit === 'clubs' ? '♣' : '♠'}
                      </span>
                      <span className="text-xs capitalize">{card.suit}</span>
                    </Button>
                  );
                })}
              </div>
              
              {selectedCard ? (
                <Button 
                  onClick={handleCardPlay}
                  className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
                  size="lg"
                >
                  ✓ Play {selectedCard.rank} of {selectedCard.suit}
                </Button>
              ) : (
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    👆 Click any card above to select it, then click the play button
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Trick completion */}
          {isTrickComplete && (
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Trick complete!</p>
              <Button onClick={nextTrick} variant="default">
                Next Trick
              </Button>
            </div>
          )}
          
          {!isLocalPlayerTurn && !isTrickComplete && (
            <p className="text-center text-sm text-muted-foreground">
              Waiting for {currentPlayer?.name} to play...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
