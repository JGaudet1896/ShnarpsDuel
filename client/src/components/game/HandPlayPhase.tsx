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
    nextTrick
  } = useShnarps();
  
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  
  const currentPlayer = players[currentPlayerIndex];
  const isLocalPlayerTurn = currentPlayerIndex === 0 && playingPlayers.has(players[0]?.id); // Assuming first player is local
  const localPlayer = players[0];
  
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
              <h3 className="font-semibold text-sm">Your Hand:</h3>
              <div className="flex flex-wrap gap-2">
                {localPlayer.hand.map((card, index) => {
                  const isPlayable = isCardPlayable(card);
                  const isSelected = selectedCard?.suit === card.suit && selectedCard?.rank === card.rank;
                  
                  return (
                    <Button
                      key={index}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCard(card)}
                      disabled={!isPlayable}
                      className="flex flex-col h-auto p-2 min-w-[60px]"
                    >
                      <span className="text-xs">{card.rank}</span>
                      <span className="text-lg">
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
                  className="w-full"
                >
                  Play {selectedCard.rank} of {selectedCard.suit}
                </Button>
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
