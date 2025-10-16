import { useShnarps } from '../../lib/stores/useShnarps';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { canPlayerSit } from '../../lib/game/gameLogic';

export default function SitPassPhase() {
  const { 
    players, 
    currentPlayerIndex, 
    chooseSitOrPlay,
    playingPlayers,
    bids,
    trumpSuit,
    highestBidder,
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-gray-900 bg-opacity-80 text-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-center text-white text-lg md:text-xl">Sit or Play Phase</CardTitle>
          <p className="text-center text-sm text-gray-300">
            Current turn: <span className="font-semibold text-white">{currentPlayer?.name}</span>
          </p>
          <p className="text-center text-sm text-gray-300">
            Trump suit: <span className="font-semibold text-white">{trumpSuit}</span>
          </p>
          <p className="text-center text-sm text-gray-300">
            Winning bid: <span className="font-semibold text-white">{highestBid}</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Show players' decisions */}
          <div className="space-y-1.5">
            <h3 className="font-semibold text-sm text-white">Player Status:</h3>
            {players.map((player) => (
              <div key={player.id} className="flex justify-between text-xs md:text-sm text-gray-200">
                <span className="truncate max-w-[100px]">{player.name}</span>
                <span className="font-mono text-xs whitespace-nowrap">
                  {player.id === highestBidder ? 'Winner (Playing)' :
                   playingPlayers.has(player.id) ? 'Playing' :
                   player.consecutiveSits >= 2 ? 'Musty (Must Play)' :
                   'Waiting...'}
                </span>
              </div>
            ))}
          </div>
          
          {/* Decision controls for local player */}
          {isLocalPlayerTurn && (
            <div className="space-y-3">
              {!canSit && (
                <p className="text-sm text-orange-400 font-medium text-center">
                  You must play this hand
                  {highestBid === 1 ? ' (bid of 1)' : 
                   trumpSuit === 'spades' ? ' (trump is spades)' :
                   currentPlayer?.consecutiveSits >= 2 ? ' (musty)' : ''}
                </p>
              )}
              
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSitOrPlay('play')}
                  className="flex-1 h-12 text-base touch-manipulation"
                  variant="default"
                >
                  Play
                </Button>
                <Button
                  onClick={() => handleSitOrPlay('sit')}
                  className="flex-1 h-12 text-base touch-manipulation"
                  variant="outline"
                  disabled={!canSit}
                >
                  Sit Out
                </Button>
              </div>
              
              {canSit && currentPlayer && (
                <p className="text-xs text-gray-400 text-center">
                  Consecutive sits: {currentPlayer.consecutiveSits}/2
                </p>
              )}
            </div>
          )}
          
          {!isLocalPlayerTurn && (
            <p className="text-center text-sm text-gray-300">
              Waiting for {currentPlayer?.name} to decide...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
