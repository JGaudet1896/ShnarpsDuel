import { useShnarps } from '../../lib/stores/useShnarps';
import PlayerHand from './PlayerHand';
import Card from './Card';
import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card as CardType, isValidPlay } from '../../lib/game/cardUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

// Hook to track window size for responsive layout
function useWindowSize() {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

// Score color helper
function getScoreColor(score: number): string {
  if (score <= 0) return 'bg-green-500';
  if (score >= 28) return 'bg-red-500';
  if (score > 20) return 'bg-orange-500';
  if (score > 16) return 'bg-yellow-500';
  return 'bg-blue-500';
}

export default function GameBoard() {
  const {
    players,
    currentTrick,
    gamePhase,
    currentPlayerIndex,
    dealerIndex,
    trumpSuit,
    playingPlayers,
    scores,
    bids,
    localPlayerId,
    highestBidder,
    lastTrickWinner,
    completedTricks,
    playCard
  } = useShnarps();

  const currentPlayer = players[currentPlayerIndex];
  const localPlayer = players.find(p => p.id === localPlayerId);
  // More robust check - if it's our turn based on currentPlayerIndex, we should be able to play
  // The playingPlayers check is a backup, but if currentPlayer is us, we're likely playing
  const isLocalPlayerTurn = currentPlayer?.id === localPlayerId &&
    (playingPlayers.has(currentPlayer.id) || playingPlayers.size === 0 || (localPlayer?.hand?.length ?? 0) > 0);

  // Directly play the card when tapped (no confirmation needed)
  const handleCardPlay = (card: CardType) => {
    if (!localPlayer || !currentPlayer) return;
    const isValid = isValidPlay(card, localPlayer.hand, currentTrick, trumpSuit);
    if (isValid) {
      playCard(currentPlayer.id, card);
    }
  };

  // Calculate tricks won by each player in current hand
  const tricksWon = useMemo(() => {
    const counts = new Map<string, number>();
    completedTricks.forEach(trick => {
      if (trick.length === 0 || !trumpSuit) return;
      
      // Determine winner of this trick
      const leadSuit = trick[0].card.suit;
      let winningPlay = trick[0];
      
      for (const play of trick) {
        const isTrump = play.card.suit === trumpSuit;
        const isWinningTrump = winningPlay.card.suit === trumpSuit;
        
        if (isTrump && !isWinningTrump) {
          winningPlay = play;
        } else if (isTrump && isWinningTrump) {
          const rankValues: { [key: string]: number } = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13, 'A': 14
          };
          if (rankValues[play.card.rank] > rankValues[winningPlay.card.rank]) {
            winningPlay = play;
          }
        } else if (!isTrump && !isWinningTrump && play.card.suit === leadSuit) {
          const rankValues: { [key: string]: number } = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13, 'A': 14
          };
          if (rankValues[play.card.rank] > rankValues[winningPlay.card.rank]) {
            winningPlay = play;
          }
        }
      }
      
      counts.set(winningPlay.playerId, (counts.get(winningPlay.playerId) || 0) + 1);
    });
    return counts;
  }, [completedTricks, trumpSuit]);

  const windowSize = useWindowSize();
  const isMobile = windowSize.width < 640;

  // Calculate player positions in a symmetric circle, with local player at bottom
  const playerPositions = useMemo(() => {
    const localPlayerIndex = players.findIndex(p => p.id === localPlayerId);

    return players.map((_, index) => {
      // Calculate offset so local player is at bottom (Math.PI/2 = 90 degrees = bottom)
      const positionIndex = localPlayerIndex >= 0
        ? (index - localPlayerIndex + players.length) % players.length
        : index;

      // Start at bottom and go counter-clockwise
      const angle = (positionIndex / players.length) * Math.PI * 2 + Math.PI / 2;

      // Use consistent radius for symmetry - smaller to keep content on screen
      const baseRadius = isMobile ? 30 : 32;
      const radius = players.length <= 4 ? baseRadius : baseRadius - 3;

      // Center point is shifted up slightly to account for bottom cards being taller
      const centerY = isMobile ? 45 : 46;
      const x = 50 + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      return { x, y, angle, positionIndex };
    });
  }, [players.length, players, localPlayerId, isMobile]);

  if (players.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-white text-xl">Waiting for players...</p>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        paddingBottom: isMobile ? 'max(120px, calc(env(safe-area-inset-bottom, 0px) + 100px))' : '1.5rem',
        paddingTop: isMobile ? '1rem' : '0.5rem'
      }}
    >
      {/* Game table center - enhanced with gradient and shadow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: isMobile ? '-5%' : '-3%' }}>
        <div className="relative">
          {/* Outer glow */}
          <div className="absolute inset-0 w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 rounded-full bg-green-500 opacity-20 blur-xl" />
          {/* Main table */}
          <div className="w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 rounded-full bg-gradient-to-br from-green-600 to-green-800 border-4 lg:border-8 border-green-500 shadow-2xl">
            {/* Table felt texture overlay */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-green-700/50 to-transparent" />
          </div>
        </div>
      </div>

      {/* Trump suit indicator - fixed center of screen */}
      <AnimatePresence>
        {trumpSuit && (gamePhase === 'hand_play' || gamePhase === 'trick_complete') && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed top-1/2 left-1/2 z-10"
            style={{ transform: 'translate(-50%, -50%)' }}
          >
            <div className="bg-white rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shadow-2xl border-4 border-gray-300">
              <span className={`text-4xl sm:text-5xl ${trumpSuit === 'hearts' || trumpSuit === 'diamonds' ? 'text-red-500' : 'text-gray-800'}`}>
                {trumpSuit === 'hearts' ? '♥' :
                 trumpSuit === 'diamonds' ? '♦' :
                 trumpSuit === 'clubs' ? '♣' : '♠'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current trick cards positioned in front of each player */}
      <AnimatePresence>
        {currentTrick.map((play, index) => {
          const playerIndex = players.findIndex(p => p.id === play.playerId);
          const playerPos = playerPositions[playerIndex];
          
          if (!playerPos) return null;
          
          // Calculate the visual position index (accounting for local player at bottom)
          const localPlayerIndex = players.findIndex(p => p.id === localPlayerId);
          const visualIndex = localPlayerIndex >= 0 
            ? (playerIndex - localPlayerIndex + players.length) % players.length 
            : playerIndex;
          
          // Position card towards center from player's visual position
          const angle = (visualIndex / players.length) * Math.PI * 2 + Math.PI / 2;
          const cardRadius = 25; // Closer to center than player
          const cardX = 50 + Math.cos(angle) * cardRadius;
          const cardY = 50 + Math.sin(angle) * cardRadius;
          
          return (
            <motion.div 
              key={`${play.playerId}-${index}`}
              initial={{ 
                opacity: 0, 
                scale: 0.5,
                left: `${playerPos.x}%`,
                top: `${playerPos.y}%`,
              }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                left: `${cardX}%`,
                top: `${cardY}%`,
              }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ 
                duration: 0.6,
                ease: "easeOut",
                delay: index * 0.2
              }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
            >
              <Card card={play.card} isPlayable={false} />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Player hands positioned around the table */}
      {players.map((player, index) => {
        const pos = playerPositions[index];
        const isCurrentPlayer = index === currentPlayerIndex;
        const isPlaying = playingPlayers.has(player.id);
        const isLocalPlayer = player.id === localPlayerId;
        const score = scores.get(player.id) || 16;
        const playerTricks = tricksWon.get(player.id) || 0;
        const isBidder = highestBidder === player.id;
        const playerBid = bids.get(player.id);

        return (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: !isPlaying && gamePhase === 'hand_play' ? 0.4 : 1,
              scale: 1
            }}
            transition={{ duration: 0.3 }}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              zIndex: isLocalPlayer ? 30 : isCurrentPlayer ? 20 : 10,
            }}
          >
            <div className="flex flex-col items-center gap-1">
              {/* Compact player badge */}
              <motion.div
                animate={isCurrentPlayer ? { scale: [1, 1.02, 1] } : {}}
                transition={{ duration: 1.5, repeat: isCurrentPlayer ? Infinity : 0 }}
                className={`
                  relative rounded-xl shadow-lg backdrop-blur-sm overflow-hidden
                  ${isCurrentPlayer
                    ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-transparent'
                    : ''
                  }
                `}
              >
                {/* Main badge content */}
                <div className={`
                  px-2 py-1.5 sm:px-3 sm:py-2 flex items-center gap-2
                  ${isCurrentPlayer
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-gray-900'
                    : 'bg-gray-900/90 text-white'
                  }
                `}>
                  {/* Dealer indicator */}
                  {index === dealerIndex && (
                    <div className="w-5 h-5 rounded-full bg-white border-2 border-gray-700 flex items-center justify-center flex-shrink-0" title="Dealer">
                      <span className="text-[8px] font-bold text-gray-800">D</span>
                    </div>
                  )}

                  {/* Player name */}
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs sm:text-sm font-semibold truncate max-w-[80px] sm:max-w-[100px]">
                      {player.name}
                    </span>
                    {/* Status indicators row */}
                    <div className="flex items-center gap-1 mt-0.5">
                      {player.isAI && (
                        <span className="text-[9px] opacity-70">AI</span>
                      )}
                      {!isPlaying && gamePhase === 'hand_play' && (
                        <span className="text-[9px] px-1 bg-gray-600 rounded">Out</span>
                      )}
                      {player.consecutiveSits >= 2 && gamePhase !== 'hand_play' && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-[9px] px-1 bg-red-500 rounded cursor-help">Musty</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Must play next round (sat out 2+ times)</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>

                  {/* Score badge */}
                  <div className={`
                    ${getScoreColor(score)} text-white
                    text-sm sm:text-base font-bold
                    w-8 h-8 sm:w-9 sm:h-9 rounded-lg
                    flex items-center justify-center flex-shrink-0
                    ${score >= 28 ? 'animate-pulse' : ''}
                  `}>
                    {score}
                  </div>
                </div>

                {/* Danger indicator for flicker */}
                {score >= 28 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                )}
              </motion.div>

              {/* Context badges - shown below main badge */}
              <div className="flex items-center gap-1 flex-wrap justify-center max-w-[120px]">
                {/* Bidding phase - show bid */}
                {gamePhase === 'bidding' && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`
                      text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full shadow
                      ${playerBid !== undefined
                        ? playerBid === 0
                          ? 'bg-gray-500 text-white'
                          : 'bg-yellow-400 text-gray-900'
                        : 'bg-gray-700 text-gray-300'
                      }
                    `}
                  >
                    {playerBid !== undefined
                      ? playerBid === 0 ? 'Pass' : `Bid ${playerBid}`
                      : '...'}
                  </motion.div>
                )}

                {/* Hand play phase - show bidder badge and tricks */}
                {(gamePhase === 'hand_play' || gamePhase === 'trick_complete') && isPlaying && (
                  <>
                    {isBidder && (
                      <div className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500 text-white shadow">
                        Bid {playerBid || 0}
                      </div>
                    )}
                    <div className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500 text-white shadow">
                      {playerTricks} trick{playerTricks !== 1 ? 's' : ''}
                    </div>
                  </>
                )}
              </div>

              {/* Player hand */}
              {/* Show hand if: player is playing, OR local player during any active phase with cards */}
              {(isPlaying || (isLocalPlayer && player.hand.length > 0 && gamePhase !== 'setup' && gamePhase !== 'game_over' && gamePhase !== 'round_complete')) && (
                <div className="mt-1">
                  <PlayerHand
                    cards={player.hand}
                    isCurrentPlayer={isCurrentPlayer && gamePhase === 'hand_play' && (isPlaying || isLocalPlayer)}
                    faceUp={isLocalPlayer}
                    onCardClick={isLocalPlayerTurn && gamePhase === 'hand_play' ? handleCardPlay : undefined}
                  />
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
