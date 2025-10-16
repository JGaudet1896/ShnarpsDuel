import { useShnarps } from '../../lib/stores/useShnarps';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import BiddingPhase from './BiddingPhase';
import SitPassPhase from './SitPassPhase';
import HandPlayPhase from './HandPlayPhase';
import { useState } from 'react';

export default function GameUI() {
  const { 
    gamePhase, 
    players, 
    scores,
    round,
    joinGame,
    startGame,
    chooseTrumpSuit,
    highestBidder,
    resetGame
  } = useShnarps();
  
  const [playerName, setPlayerName] = useState('');
  const [trumpSuit, setTrumpSuit] = useState<string>('');
  
  const isHighestBidder = highestBidder === players[0]?.id; // Assuming first player is local

  // Setup phase
  if (gamePhase === 'setup') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Shnarps Card Game</CardTitle>
            <p className="text-center text-sm text-muted-foreground">
              {players.length}/8 players joined
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current players */}
            {players.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Players:</h3>
                {players.map((player, index) => (
                  <div key={player.id} className="text-sm flex justify-between">
                    <span>{player.name}</span>
                    <span className="text-muted-foreground">
                      Score: {scores.get(player.id) || 16}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Join game */}
            {players.length < 8 && (
              <div className="space-y-2">
                <Input
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && playerName.trim()) {
                      joinGame(playerName.trim());
                      setPlayerName('');
                    }
                  }}
                />
                <Button 
                  onClick={() => {
                    if (playerName.trim()) {
                      joinGame(playerName.trim());
                      setPlayerName('');
                    }
                  }}
                  disabled={!playerName.trim()}
                  className="w-full"
                >
                  Join Game
                </Button>
              </div>
            )}
            
            {/* Start game */}
            {players.length >= 4 && (
              <Button onClick={startGame} className="w-full" variant="default">
                Start Game ({players.length} players)
              </Button>
            )}
            
            {players.length < 4 && (
              <p className="text-center text-sm text-muted-foreground">
                Need at least 4 players to start
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Trump selection phase
  if (gamePhase === 'trump_selection') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Choose Trump Suit</CardTitle>
            <p className="text-center text-sm text-muted-foreground">
              You won the bid! Select the trump suit.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {isHighestBidder ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { suit: 'hearts', symbol: '♥', color: 'text-red-600' },
                    { suit: 'diamonds', symbol: '♦', color: 'text-red-600' },
                    { suit: 'clubs', symbol: '♣', color: 'text-gray-700' },
                    { suit: 'spades', symbol: '♠', color: 'text-gray-700' }
                  ].map(({ suit, symbol, color }) => (
                    <Button
                      key={suit}
                      variant={trumpSuit === suit ? "default" : "outline"}
                      onClick={() => setTrumpSuit(suit)}
                      className="h-16 flex flex-col"
                    >
                      <span className={`text-2xl ${color}`}>{symbol}</span>
                      <span className="text-sm capitalize">{suit}</span>
                    </Button>
                  ))}
                </div>
                
                <Button 
                  onClick={() => {
                    if (trumpSuit) {
                      chooseTrumpSuit(trumpSuit);
                      setTrumpSuit('');
                    }
                  }}
                  disabled={!trumpSuit}
                  className="w-full"
                >
                  Choose {trumpSuit}
                </Button>
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                Waiting for the highest bidder to choose trump...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Game over phase
  if (gamePhase === 'game_over') {
    const sortedPlayers = players
      .map(player => ({
        ...player,
        score: scores.get(player.id) || 16
      }))
      .sort((a, b) => a.score - b.score);
    
    const winner = sortedPlayers[0];
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Game Over!</CardTitle>
            <p className="text-center text-lg font-semibold text-green-600">
              {winner?.name} Wins!
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Final Scores:</h3>
              {sortedPlayers.map((player, index) => (
                <div key={player.id} className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    {index === 0 && <span className="text-yellow-500">👑</span>}
                    {player.name}
                  </span>
                  <span className={`font-mono ${player.score <= 0 ? 'text-green-600' : player.score > 32 ? 'text-red-600' : ''}`}>
                    {player.score}
                    {player.score <= 0 && ' (Winner!)'}
                    {player.score > 32 && ' (Eliminated)'}
                  </span>
                </div>
              ))}
            </div>
            
            <Button onClick={resetGame} className="w-full">
              Play Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Phase-specific UI overlays
  return (
    <div>
      {/* Game info overlay */}
      <div className="fixed top-4 left-4 z-30">
        <Card className="w-64">
          <CardContent className="pt-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Round:</span>
                <span className="font-mono">{round}</span>
              </div>
              <div className="flex justify-between">
                <span>Phase:</span>
                <span className="capitalize font-mono">{gamePhase.replace('_', ' ')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scores overlay */}
      <div className="fixed top-4 right-4 z-30">
        <Card className="w-48">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Scores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {players.map((player) => {
              const score = scores.get(player.id) || 16;
              return (
                <div key={player.id} className="flex justify-between text-sm">
                  <span className="truncate">{player.name}</span>
                  <span className={`font-mono ${score <= 0 ? 'text-green-600' : score > 32 ? 'text-red-600' : ''}`}>
                    {score}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Phase-specific overlays */}
      {gamePhase === 'bidding' && <BiddingPhase />}
      {gamePhase === 'sit_pass' && <SitPassPhase />}
      {gamePhase === 'hand_play' && <HandPlayPhase />}
    </div>
  );
}
