import { useShnarps } from '../../lib/stores/useShnarps';
import { Button } from '../ui/button';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

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

  const getBidTooltip = (bid: number) => {
    if (bid === 0) return 'Pass this round (punt)';
    if (bid <= highestBid) return `Must bid higher than ${highestBid}`;
    return `Bid ${bid} trick${bid > 1 ? 's' : ''} - win ${bid} to avoid penalty`;
  };

  // Only show bidding controls for local player's turn
  if (!isLocalPlayerTurn || !localPlayer) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="fixed bottom-44 sm:bottom-40 left-1/2 transform -translate-x-1/2 z-40"
    >
      <div className="flex flex-col items-center gap-2">
        {/* Current bid indicator */}
        {highestBid > 0 && (
          <div className="bg-yellow-500 text-gray-900 px-3 py-1 rounded-full text-sm font-bold shadow">
            Current bid: {highestBid}
          </div>
        )}

        <div className="flex gap-2 bg-gray-900/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-2xl border border-gray-700">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => handleBid(0)}
                  className="min-w-[70px] h-12 touch-manipulation bg-gradient-to-b from-gray-500 to-gray-600 hover:from-gray-400 hover:to-gray-500 text-white font-bold shadow-lg transition-all"
                >
                  Pass
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Pass (punt) - get +5 if no tricks, -1 per trick won</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="w-px bg-gray-600" />

          {[1, 2, 3, 4, 5].map(bid => {
            const isAvailable = canBid(bid);
            const isNextBid = bid === highestBid + 1;

            return (
              <TooltipProvider key={bid}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => handleBid(bid)}
                      disabled={!isAvailable}
                      aria-label={getBidTooltip(bid)}
                      className={`
                        min-w-[48px] h-12 touch-manipulation font-bold text-lg shadow-lg transition-all
                        ${isAvailable
                          ? isNextBid
                            ? 'bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white ring-2 ring-blue-400 ring-offset-1 ring-offset-gray-900'
                            : 'bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                        }
                      `}
                    >
                      {bid}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{getBidTooltip(bid)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
