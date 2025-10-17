import { useShnarps } from '../../lib/stores/useShnarps';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { useState } from 'react';

export default function GameHistory() {
  const { history, players } = useShnarps();
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <div className="fixed top-4 right-4 z-30">
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          className="bg-gray-800 text-white hover:bg-gray-700"
        >
          📜 History ({history.length} rounds)
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-40 w-96 max-h-96">
      <Card className="bg-white border-2 border-gray-300 shadow-2xl">
        <CardHeader className="pb-2 bg-white">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg text-gray-900">Game History</CardTitle>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="sm"
              className="text-gray-900 hover:bg-gray-100"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="bg-white">
          <ScrollArea className="h-80">
            {history.length === 0 ? (
              <p className="text-sm text-gray-600 text-center py-4">
                No rounds completed yet
              </p>
            ) : (
              <div className="space-y-3">
                {history.map((round) => {
                  const highestBidderName = players.find(
                    p => p.id === round.highestBidder
                  )?.name || 'Unknown';

                  return (
                    <div
                      key={round.round}
                      className="border-2 border-gray-300 rounded-lg p-3 bg-gray-100"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-sm">Round {round.round}</h3>
                        <span className="text-xs text-muted-foreground">
                          Trump: {round.trumpSuit === 'hearts' ? '♥' : 
                                 round.trumpSuit === 'diamonds' ? '♦' : 
                                 round.trumpSuit === 'clubs' ? '♣' : '♠'}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <p className="text-muted-foreground">
                          Highest Bid: {highestBidderName} ({round.bids.get(round.highestBidder || '') || 0})
                        </p>

                        <div className="mt-2">
                          <p className="font-medium mb-1">Results:</p>
                          {round.playingPlayers.map(playerId => {
                            const player = players.find(p => p.id === playerId);
                            const tricksWon = round.tricksWon.get(playerId) || 0;
                            const scoreChange = round.scoreChanges.get(playerId) || 0;
                            const finalScore = round.finalScores.get(playerId) || 0;

                            return (
                              <div
                                key={playerId}
                                className="flex justify-between py-1"
                              >
                                <span>{player?.name}</span>
                                <span>
                                  {tricksWon} tricks, {scoreChange > 0 ? '+' : ''}{scoreChange} → {finalScore}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
