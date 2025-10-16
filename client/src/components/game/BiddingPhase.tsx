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
    <>
      {/* Bidding controls in center of table */}
      {isLocalPlayerTurn && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40">
          <Card className="bg-gray-900 bg-opacity-95 text-white border-yellow-400 border-2 shadow-2xl">
            <CardHeader className="pb-2 p-3 sm:p-4">
              <CardTitle className="text-center text-white text-base sm:text-lg">Your Bid</CardTitle>
              <p className="text-center text-xs sm:text-sm text-gray-300">
                Highest bid: <span className="font-semibold text-yellow-400">{highestBid}</span>
              </p>
            </CardHeader>
            <CardContent className="space-y-3 p-3 sm:p-4 pt-0">
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  variant={selectedBid === 0 ? "default" : "outline"}
                  size="lg"
                  onClick={() => setSelectedBid(0)}
                  className="min-w-[60px] h-12 touch-manipulation bg-gray-700 hover:bg-gray-600"
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
                    className="min-w-[50px] h-12 touch-manipulation"
                  >
                    {bid}
                  </Button>
                ))}
              </div>
              
              <Button 
                onClick={handleBid}
                className="w-full h-12 text-base touch-manipulation bg-green-600 hover:bg-green-700"
                disabled={selectedBid < 0}
              >
                {selectedBid === 0 ? 'Confirm Pass' : `Confirm Bid ${selectedBid}`}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status message when waiting */}
      {!isLocalPlayerTurn && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40">
          <Card className="bg-gray-900 bg-opacity-95 text-white shadow-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-gray-300">
                Waiting for <span className="font-semibold text-yellow-400">{currentPlayer?.name}</span> to bid...
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Highest bid: {highestBid}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
