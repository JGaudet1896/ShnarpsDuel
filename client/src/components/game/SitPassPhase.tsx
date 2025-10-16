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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-96 max-w-lg bg-gray-900 bg-opacity-80 text-white">
        <CardHeader>
          <CardTitle className="text-center text-white">Sit or Play Phase</CardTitle>
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
        <CardContent className="space-y-4">
          {/* Show players' decisions */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-white">Player Status:</h3>
            {players.map((player) => (
              <div key={player.id} className="flex justify-between text-sm text-gray-200">
                <span>{player.name}</span>
                <span className="font-mono">
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
            <div className="space-y-4">
              {!canSit && (
                <p className="text-sm text-orange-600 font-medium">
                  You must play this hand
                  {highestBid === 1 ? ' (bid of 1)' : 
                   trumpSuit === 'spades' ? ' (trump is spades)' :
                   currentPlayer?.consecutiveSits >= 2 ? ' (musty)' : ''}
                </p>
              )}
              
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSitOrPlay('play')}
                  className="flex-1"
                  variant="default"
                >
                  Play
                </Button>
                <Button
                  onClick={() => handleSitOrPlay('sit')}
                  className="flex-1"
                  variant="outline"
                  disabled={!canSit}
                >
                  Sit Out
                </Button>
              </div>
              
              {canSit && currentPlayer && (
                <p className="text-xs text-muted-foreground text-center">
                  Consecutive sits: {currentPlayer.consecutiveSits}/2
                </p>
              )}
            </div>
          )}
          
          {!isLocalPlayerTurn && (
            <p className="text-center text-sm text-muted-foreground">
              Waiting for {currentPlayer?.name} to decide...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
