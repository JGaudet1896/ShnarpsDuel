import { useState } from 'react';
import { useShnarps } from '../../lib/stores/useShnarps';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import PlayerHand from './PlayerHand';

export default function BiddingPhase() {
  const { 
    players, 
    currentPlayerIndex, 
    bids, 
    placeBid,
    scores,
    localPlayerId
  } = useShnarps();
  
  const [selectedBid, setSelectedBid] = useState<number>(0);
  
  const currentPlayer = players[currentPlayerIndex];
  const isLocalPlayerTurn = currentPlayer?.id === localPlayerId;
  const localPlayer = players.find(p => p.id === localPlayerId);
  
  const highestBid = Math.max(0, ...Array.from(bids.values()));
  
  const handleBid = () => {
    if (currentPlayer && selectedBid >= 0) {
      placeBid(currentPlayer.id, selectedBid);
      setSelectedBid(0);
    }
  };
  
  const canBid = (bid: number) => {
    if (bid === 0) return true; // Can always pass
    return bid > highestBid && bid <= 5;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
      <Card className="w-full max-w-lg bg-gray-900 bg-opacity-95 text-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-center text-white text-lg md:text-xl">Bidding Phase</CardTitle>
          <p className="text-center text-sm text-gray-300">
            Current turn: <span className="font-semibold text-white">{currentPlayer?.name}</span>
          </p>
          <p className="text-center text-sm text-gray-300">
            Highest bid: <span className="font-semibold text-white">{highestBid}</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Your Hand */}
          {localPlayer && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-white text-center">Your Hand:</h3>
              <div className="flex justify-center bg-green-800 bg-opacity-30 p-3 rounded-lg">
                <PlayerHand
                  cards={localPlayer.hand}
                  isCurrentPlayer={false}
                  faceUp={true}
                />
              </div>
            </div>
          )}

          {/* Show all players' bids */}
          <div className="space-y-1.5">
            <h3 className="font-semibold text-sm text-white">Current Bids:</h3>
            {players.map((player) => (
              <div key={player.id} className="flex justify-between text-xs md:text-sm text-gray-200">
                <span className="truncate max-w-[120px]">{player.name}</span>
                <span className="font-mono text-xs whitespace-nowrap">
                  Score: {scores.get(player.id) || 16} | 
                  Bid: {bids.has(player.id) ? 
                    (bids.get(player.id) === 0 ? 'Pass' : bids.get(player.id)) : 
                    'Waiting...'}
                </span>
              </div>
            ))}
          </div>
          
          {/* Bidding controls for local player */}
          {isLocalPlayerTurn && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  variant={selectedBid === 0 ? "default" : "outline"}
                  size="lg"
                  onClick={() => setSelectedBid(0)}
                  className="min-w-[60px] h-11 touch-manipulation"
                >
                  Pass
                </Button>
                {[1, 2, 3, 4, 5].map(bid => (
                  <Button
                    key={bid}
                    variant={selectedBid === bid ? "default" : "outline"}
                    size="lg"
                    onClick={() => setSelectedBid(bid)}
                    disabled={!canBid(bid)}
                    className="min-w-[50px] h-11 touch-manipulation"
                  >
                    {bid}
                  </Button>
                ))}
              </div>
              
              <Button 
                onClick={handleBid}
                className="w-full h-12 text-base touch-manipulation"
                disabled={selectedBid < 0}
              >
                {selectedBid === 0 ? 'Pass' : `Bid ${selectedBid}`}
              </Button>
            </div>
          )}
          
          {!isLocalPlayerTurn && (
            <p className="text-center text-sm text-gray-300">
              Waiting for {currentPlayer?.name} to bid...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
