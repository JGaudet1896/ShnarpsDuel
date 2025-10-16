import { useShnarps } from '../../lib/stores/useShnarps';
import { Button } from '../ui/button';
import { canPlayerSit } from '../../lib/game/gameLogic';

export default function SitPassPhase() {
  const { 
    players, 
    currentPlayerIndex, 
    chooseSitOrPlay,
    bids,
    trumpSuit,
    localPlayerId
  } = useShnarps();
  
  const currentPlayer = players[currentPlayerIndex];
  const isLocalPlayerTurn = currentPlayer?.id === localPlayerId;
  const highestBid = Math.max(0, ...Array.from(bids.values()));
  
  const handleSitOrPlay = (decision: 'sit' | 'play') => {
    if (currentPlayer) {
      chooseSitOrPlay(currentPlayer.id, decision);
    }
  };
  
  const canSit = currentPlayer ? canPlayerSit(currentPlayer, highestBid, trumpSuit) : false;

  // Only show sit/play controls for local player's turn, positioned at bottom
  if (!isLocalPlayerTurn || !currentPlayer) return null;

  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40">
      <div className="flex gap-4 bg-gray-900 bg-opacity-90 px-6 py-3 rounded-lg shadow-xl">
        <Button
          onClick={() => handleSitOrPlay('play')}
          className="min-w-[100px] h-12 touch-manipulation bg-green-600 hover:bg-green-700 text-white font-bold"
        >
          In
        </Button>
        <Button
          onClick={() => handleSitOrPlay('sit')}
          disabled={!canSit}
          className="min-w-[100px] h-12 touch-manipulation bg-red-600 hover:bg-red-700 text-white font-bold disabled:opacity-30"
        >
          Out
        </Button>
      </div>
      {!canSit && (
        <p className="text-xs text-orange-400 font-medium text-center mt-2 bg-black bg-opacity-70 px-3 py-1 rounded">
          Must play{highestBid === 1 ? ' (bid 1)' : trumpSuit === 'spades' ? ' (spades)' : currentPlayer.consecutiveSits >= 2 ? ' (musty)' : ''}
        </p>
      )}
    </div>
  );
}
