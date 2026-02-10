import { useShnarps } from '../../lib/stores/useShnarps';
import { Button } from '../ui/button';

export default function BiddingPhase() {
  const { 
    players, 
    currentPlayerIndex, 
    bids, 
    placeBid,
    localPlayerId
  } = useShnarps();
  
  const currentPlayer = players[currentPlayerIndex];
  const isLocalPlayerTurn = currentPlayer?.id === localPlayerId;
  const localPlayer = players.find(p => p.id === localPlayerId);
  
  const highestBid = Math.max(0, ...Array.from(bids.values()));
  
  const handleBid = (bid: number) => {
    if (currentPlayer) {
      placeBid(currentPlayer.id, bid);
    }
  };
  
  const canBid = (bid: number) => {
    if (bid === 0) return true; // Can always pass
    return bid > highestBid && bid <= 5;
  };

  // Only show bidding controls for local player's turn, positioned above player
  if (!isLocalPlayerTurn || !localPlayer) return null;

  return (
    <div className="fixed bottom-56 sm:bottom-48 left-1/2 transform -translate-x-1/2 z-40">
      <div className="flex gap-2 bg-gray-900 bg-opacity-90 px-4 py-3 rounded-lg shadow-xl">
        <Button
          onClick={() => handleBid(0)}
          disabled={!canBid(0)}
          className="min-w-[60px] h-12 touch-manipulation bg-red-600 hover:bg-red-700 text-white font-bold"
        >
          Pass
        </Button>
        {[1, 2, 3, 4, 5].map(bid => (
          <Button
            key={bid}
            onClick={() => handleBid(bid)}
            disabled={!canBid(bid)}
            aria-label={`Bid ${bid}${!canBid(bid) ? ' (not available - must bid higher than current bid)' : ''}`}
            className="min-w-[50px] h-12 touch-manipulation bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {bid}
          </Button>
        ))}
      </div>
    </div>
  );
}
