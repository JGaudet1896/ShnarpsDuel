import { useState } from 'react';
import { useShnarps } from '../../lib/stores/useShnarps';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-96 max-w-lg">
        <CardHeader>
          <CardTitle className="text-center">Bidding Phase</CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            Current turn: <span className="font-semibold">{currentPlayer?.name}</span>
          </p>
          <p className="text-center text-sm">
            Highest bid: <span className="font-semibold">{highestBid}</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Show all players' bids */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Current Bids:</h3>
            {players.map((player) => (
              <div key={player.id} className="flex justify-between text-sm">
                <span>{player.name}</span>
                <span className="font-mono">
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
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedBid === 0 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedBid(0)}
                >
                  Pass
                </Button>
                {[1, 2, 3, 4, 5].map(bid => (
                  <Button
                    key={bid}
                    variant={selectedBid === bid ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedBid(bid)}
                    disabled={!canBid(bid)}
                  >
                    {bid}
                  </Button>
                ))}
              </div>
              
              <Button 
                onClick={handleBid}
                className="w-full"
                disabled={selectedBid < 0}
              >
                {selectedBid === 0 ? 'Pass' : `Bid ${selectedBid}`}
              </Button>
            </div>
          )}
          
          {!isLocalPlayerTurn && (
            <p className="text-center text-sm text-muted-foreground">
              Waiting for {currentPlayer?.name} to bid...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
