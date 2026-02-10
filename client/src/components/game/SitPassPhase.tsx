import { useShnarps } from '../../lib/stores/useShnarps';
import { Button } from '../ui/button';
import { canPlayerSit } from '../../lib/game/gameLogic';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Play, UserX } from 'lucide-react';

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

  // Only show sit/play controls for local player's turn
  if (!isLocalPlayerTurn || !currentPlayer) return null;

  const trumpSymbol = trumpSuit === 'hearts' ? '♥' :
                      trumpSuit === 'diamonds' ? '♦' :
                      trumpSuit === 'clubs' ? '♣' : '♠';
  const trumpColor = trumpSuit === 'hearts' || trumpSuit === 'diamonds' ? 'text-red-500' : 'text-white';

  const getSitBlockReason = () => {
    if (highestBid === 1) return 'Bid is 1 - everyone must play';
    if (trumpSuit === 'spades') return 'Trump is Spades - everyone must play';
    if (currentPlayer.consecutiveSits >= 2) return 'Musty rule - you sat out twice in a row';
    return 'You must play this round';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="fixed bottom-44 sm:bottom-40 left-1/2 transform -translate-x-1/2 z-40"
    >
      <div className="flex flex-col items-center gap-3">
        {/* Trump indicator */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring" }}
          className="bg-gray-900/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-gray-700"
        >
          <p className="text-sm text-white flex items-center gap-2">
            <span className="text-gray-400">Trump:</span>
            <span className={`text-3xl font-bold ${trumpColor}`}>{trumpSymbol}</span>
            <span className="capitalize font-medium">{trumpSuit}</span>
          </p>
        </motion.div>

        {/* Decision buttons */}
        <div className="flex gap-4 bg-gray-900/95 backdrop-blur-sm px-6 py-4 rounded-xl shadow-2xl border border-gray-700">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => handleSitOrPlay('play')}
                  className="min-w-[110px] h-14 touch-manipulation bg-gradient-to-b from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white font-bold text-lg shadow-lg flex items-center gap-2"
                >
                  <Play className="h-5 w-5" />
                  Play
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Play this round and try to win tricks</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => handleSitOrPlay('sit')}
                  disabled={!canSit}
                  aria-label={!canSit ? getSitBlockReason() : 'Sit out this round'}
                  className={`
                    min-w-[110px] h-14 touch-manipulation font-bold text-lg shadow-lg flex items-center gap-2
                    ${canSit
                      ? 'bg-gradient-to-b from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  <UserX className="h-5 w-5" />
                  Sit Out
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{canSit ? 'Skip this round - no score change' : getSitBlockReason()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Reason why sitting is blocked */}
        {!canSit && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-yellow-400 font-medium bg-yellow-900/50 px-3 py-1.5 rounded-lg border border-yellow-700"
            role="alert"
          >
            {getSitBlockReason()}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
