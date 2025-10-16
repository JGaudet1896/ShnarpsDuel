import { useShnarps } from '../../lib/stores/useShnarps';
import PlayerHand from './PlayerHand';
import Card from './Card';
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    completedTricks
  } = useShnarps();

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

  // Calculate player positions in a circle, with local player always at bottom
  const playerPositions = useMemo(() => {
    const localPlayerIndex = players.findIndex(p => p.id === localPlayerId);
    
    return players.map((_, index) => {
      // Calculate offset so local player is at bottom (Math.PI/2 = 90 degrees = bottom)
      const positionIndex = localPlayerIndex >= 0 
        ? (index - localPlayerIndex + players.length) % players.length 
        : index;
      
      // Start at bottom and go counter-clockwise
      const angle = (positionIndex / players.length) * Math.PI * 2 + Math.PI / 2;
      const radius = 35; // percentage
      const x = 50 + Math.cos(angle) * radius;
      const y = 50 + Math.sin(angle) * radius;
      return { x, y, angle };
    });
  }, [players.length, players, localPlayerId]);

  if (players.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-white text-xl">Waiting for players...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Game table center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 rounded-full bg-green-700 border-8 border-green-600 shadow-2xl" />
      </div>

      {/* Trump suit indicator - persistent during hand play */}
      {trumpSuit && (gamePhase === 'hand_play' || gamePhase === 'trick_complete') && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white bg-opacity-95 rounded-full w-16 h-16 flex items-center justify-center shadow-lg border-2 border-gray-300">
          <p className={`text-3xl ${trumpSuit === 'hearts' || trumpSuit === 'diamonds' ? 'text-red-600' : 'text-gray-800'}`}>
            {trumpSuit === 'hearts' ? '♥' : 
             trumpSuit === 'diamonds' ? '♦' : 
             trumpSuit === 'clubs' ? '♣' : '♠'}
          </p>
        </div>
      )}

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

        return (
          <div
            key={player.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ${
              !isPlaying && gamePhase === 'hand_play' ? 'opacity-30' : 'opacity-100'
            }`}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
            }}
          >
            <div className="flex flex-col items-center gap-2">
              {/* Player info */}
              <div className={`
                px-4 py-2 rounded-lg shadow-md relative
                ${isCurrentPlayer ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-white'}
              `}>
                <div className="flex items-center gap-2">
                  {/* Dealer indicator */}
                  {index === dealerIndex && (
                    <span className="text-lg" title="Dealer">🃏</span>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-semibold">
                        {player.name}
                        {player.isAI && ' 🤖'}
                      </p>
                    </div>
                    <div className={`text-2xl font-bold px-2 py-1 rounded ${
                      score <= 0 ? 'bg-green-600 text-white' : 
                      score >= 28 ? 'bg-red-600 text-white' : 
                      score > 16 ? 'bg-orange-500 text-white' : 
                      'bg-blue-600 text-white'
                    }`}>
                      {score}
                    </div>
                  </div>
                </div>
                
                {/* Status badges */}
                <div className="flex gap-1 mt-1">
                  {isCurrentPlayer && (
                    <span className="text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded">
                      Current Turn
                    </span>
                  )}
                  {!isPlaying && gamePhase === 'hand_play' && (
                    <span className="text-xs bg-gray-600 px-2 py-0.5 rounded">
                      Sitting Out
                    </span>
                  )}
                  {player.consecutiveSits >= 2 && gamePhase !== 'hand_play' && (
                    <span className="text-xs bg-red-600 px-2 py-0.5 rounded">
                      Musty - Must Play
                    </span>
                  )}
                </div>
              </div>

              {/* Bid display during bidding phase */}
              {gamePhase === 'bidding' && (
                <div className="mt-1 bg-yellow-400 text-gray-900 px-3 py-1 rounded-lg shadow-md">
                  <p className="text-xs font-bold text-center">
                    {bids.has(player.id) ? 
                      (bids.get(player.id) === 0 ? 'Pass' : `Bid: ${bids.get(player.id)}`) : 
                      '...'}
                  </p>
                </div>
              )}

              {/* Bidder indicator */}
              {highestBidder === player.id && (gamePhase === 'hand_play' || gamePhase === 'trick_complete') && (
                <div className="mt-1 bg-purple-600 text-white px-3 py-1 rounded-lg shadow-md">
                  <p className="text-xs font-bold text-center">
                    Bid: {bids.get(player.id) || 0}
                  </p>
                </div>
              )}

              {/* Flicker banner for players at 28+ score */}
              {score >= 28 && (
                <div className="mt-1 bg-red-600 text-white px-3 py-1 rounded-lg shadow-md animate-pulse">
                  <p className="text-xs font-bold text-center">
                    FLICKER
                  </p>
                </div>
              )}

              {/* Tricks won counter during hand play */}
              {(gamePhase === 'hand_play' || gamePhase === 'trick_complete') && isPlaying && (
                <div className="mt-1 bg-blue-600 text-white px-3 py-1 rounded-lg shadow-md">
                  <p className="text-xs font-bold text-center">
                    Tricks: {tricksWon.get(player.id) || 0}
                  </p>
                </div>
              )}

              {/* Player hand - hidden only during gameplay when sitting out */}
              {(isPlaying || (isLocalPlayer && (gamePhase === 'bidding' || gamePhase === 'sit_pass'))) && (
                <PlayerHand
                  cards={player.hand}
                  isCurrentPlayer={isCurrentPlayer && gamePhase === 'hand_play' && isPlaying}
                  faceUp={isLocalPlayer && gamePhase !== 'hand_play'}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
