import { useShnarps } from '../../lib/stores/useShnarps';
import PlayerHand from './PlayerHand';
import Card from './Card';
import { useMemo } from 'react';

export default function GameBoard() {
  const { 
    players, 
    currentTrick, 
    gamePhase, 
    currentPlayerIndex,
    trumpSuit,
    playingPlayers,
    scores
  } = useShnarps();

  // Calculate player positions in a circle
  const playerPositions = useMemo(() => {
    return players.map((_, index) => {
      const angle = (index / players.length) * Math.PI * 2 - Math.PI / 2;
      const radius = 35; // percentage
      const x = 50 + Math.cos(angle) * radius;
      const y = 50 + Math.sin(angle) * radius;
      return { x, y, angle };
    });
  }, [players.length]);

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

      {/* Trump suit indicator */}
      {trumpSuit && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white rounded-lg px-6 py-3 shadow-lg">
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">Trump Suit</p>
            <p className={`text-4xl ${trumpSuit === 'hearts' || trumpSuit === 'diamonds' ? 'text-red-600' : 'text-gray-800'}`}>
              {trumpSuit === 'hearts' ? '♥' : 
               trumpSuit === 'diamonds' ? '♦' : 
               trumpSuit === 'clubs' ? '♣' : '♠'}
            </p>
          </div>
        </div>
      )}

      {/* Current trick cards in center */}
      {currentTrick.length > 0 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="flex gap-2">
            {currentTrick.map((play, index) => {
              const player = players.find(p => p.id === play.playerId);
              return (
                <div key={`${play.playerId}-${index}`} className="flex flex-col items-center gap-1">
                  <Card card={play.card} isPlayable={false} />
                  <p className="text-white text-xs font-medium bg-black bg-opacity-50 px-2 py-1 rounded">
                    {player?.name}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Player hands positioned around the table */}
      {players.map((player, index) => {
        const pos = playerPositions[index];
        const isCurrentPlayer = index === currentPlayerIndex;
        const isPlaying = playingPlayers.has(player.id);
        const isLocalPlayer = index === 0; // First player is local
        const score = scores.get(player.id) || 16;

        return (
          <div
            key={player.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
            }}
          >
            <div className="flex flex-col items-center gap-2">
              {/* Player info */}
              <div className={`
                px-4 py-2 rounded-lg shadow-md
                ${isCurrentPlayer ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-white'}
              `}>
                <p className="text-sm font-semibold">{player.name}</p>
                <p className="text-xs">
                  Score: {score}
                  {!isPlaying && gamePhase === 'hand_play' ? ' (Sitting)' : ''}
                </p>
              </div>

              {/* Player hand */}
              <PlayerHand
                cards={player.hand}
                isCurrentPlayer={isCurrentPlayer && gamePhase === 'hand_play' && isPlaying}
                faceUp={isLocalPlayer}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
