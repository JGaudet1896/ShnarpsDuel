import { useShnarps } from '../../lib/stores/useShnarps';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import BiddingPhase from './BiddingPhase';
import SitPassPhase from './SitPassPhase';
import HandPlayPhase from './HandPlayPhase';
import GameHistory from './GameHistory';
import MultiplayerSetup from './MultiplayerSetup';
import AvatarCustomizer, { Avatar, type PlayerAvatar } from './AvatarCustomizer';
import Tutorial from './Tutorial';
import AppWalkthrough from './AppWalkthrough';
import { useState, useEffect } from 'react';
import { AIDifficulty } from '../../lib/game/gameLogic';
import { useMultiplayer } from '../../lib/hooks/useMultiplayer';
import { BookOpen, HelpCircle } from 'lucide-react';

export default function GameUI() {
  const { 
    gamePhase, 
    players, 
    scores,
    round,
    joinGame,
    addAIPlayer,
    startGame,
    chooseTrumpSuit,
    choosePenalty,
    highestBidder,
    resetGame,
    localPlayerId
  } = useShnarps();
  
  const { mode, roomCode, isHost, addAIPlayer: addMultiplayerAI, startGame: startMultiplayerGame } = useMultiplayer();
  
  const [playerName, setPlayerName] = useState('');
  const [trumpSuit, setTrumpSuit] = useState<string>('');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');
  const [gameMode, setGameMode] = useState<'menu' | 'local' | 'online'>('menu');
  const [showAvatarCustomizer, setShowAvatarCustomizer] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<PlayerAvatar>({
    color: '#3B82F6',
    icon: '👤'
  });
  
  const isHighestBidder = highestBidder === localPlayerId;
  const localPlayer = players.find(p => p.id === localPlayerId);

  // Check if first-time user and show walkthrough
  useEffect(() => {
    const walkthroughCompleted = localStorage.getItem('shnarps_walkthrough_completed');
    if (!walkthroughCompleted && gamePhase === 'setup' && players.length === 0) {
      setShowWalkthrough(true);
    }
  }, [gamePhase, players.length]);

  // Welcome screen - choose game mode
  if (gameMode === 'menu' && gamePhase === 'setup' && players.length === 0) {
    return (
      <>
        <div className="fixed inset-0 flex items-start justify-center pt-8 md:pt-16" style={{ zIndex: 9999 }}>
          <Card className="w-full max-w-md mx-4 shadow-2xl bg-white">
            <CardHeader>
              <CardTitle className="text-center text-2xl">Shnarps Card Game</CardTitle>
              <p className="text-center text-sm text-muted-foreground">
                Choose your game mode
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => setGameMode('local')} className="w-full" size="lg">
                🏠 Local Game
              </Button>
              <Button onClick={() => setGameMode('online')} className="w-full" variant="outline" size="lg">
                🌐 Online Multiplayer
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Local: Play on one device<br/>
                Online: Play with friends in real-time
              </p>
              
              <div className="pt-4 border-t space-y-2">
                <Button 
                  onClick={() => setShowTutorial(true)} 
                  variant="ghost" 
                  className="w-full justify-start"
                  size="sm"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Game Tutorial (Learn How to Play)
                </Button>
                <Button 
                  onClick={() => setShowWalkthrough(true)} 
                  variant="ghost" 
                  className="w-full justify-start"
                  size="sm"
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  App Walkthrough (First Time Here?)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tutorial and Walkthrough modals */}
        <Tutorial open={showTutorial} onClose={() => setShowTutorial(false)} />
        <AppWalkthrough open={showWalkthrough} onClose={() => setShowWalkthrough(false)} />
      </>
    );
  }

  // Multiplayer setup
  if (gameMode === 'online' && mode === 'local') {
    return <MultiplayerSetup onBack={() => setGameMode('menu')} />;
  }

  // Setup phase
  if (gamePhase === 'setup') {
    // Show room code for online games
    const isOnline = mode === 'online';
    
    return (
      <div className="fixed inset-0 flex items-start justify-center pt-8 md:pt-16" style={{ zIndex: 9999 }}>
        <Card className="w-full max-w-md mx-4 shadow-2xl bg-white">
          <CardHeader>
            <CardTitle className="text-center">Shnarps Card Game</CardTitle>
            <p className="text-center text-sm text-muted-foreground">
              {isOnline ? `🌐 Online Room` : '🏠 Local Game'} • {players.length}/8 players
            </p>
            {isOnline && roomCode && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-blue-600 font-medium mb-1">Share this code with friends:</p>
                <p className="text-2xl font-bold text-blue-700 tracking-wider">{roomCode}</p>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current players */}
            {players.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Players:</h3>
                {players.map((player) => (
                  <div key={player.id} className="flex items-center gap-3 py-1">
                    {player.avatar && <Avatar avatar={player.avatar} size="sm" />}
                    <div className="flex-1 flex justify-between items-center">
                      <span className="text-sm">
                        {player.name}
                        {player.isAI && ` 🤖 (${player.aiDifficulty || 'medium'})`}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Score: {scores.get(player.id) || 16}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Join game - only for local mode */}
            {!isOnline && players.length < 8 && !localPlayer && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div onClick={() => setShowAvatarCustomizer(true)} className="cursor-pointer">
                    <Avatar avatar={currentAvatar} size="md" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Enter your name"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && playerName.trim()) {
                          joinGame(playerName.trim(), currentAvatar);
                          setPlayerName('');
                        }
                      }}
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    if (playerName.trim()) {
                      joinGame(playerName.trim(), currentAvatar);
                      setPlayerName('');
                    }
                  }}
                  disabled={!playerName.trim()}
                  className="w-full"
                >
                  Join Game
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Click avatar to customize
                </p>
              </div>
            )}
            
            {/* Add AI - for local or if host in online */}
            {players.length < 8 && (!isOnline || isHost) && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Add AI Player:</label>
                <div className="flex gap-2">
                  <Select value={aiDifficulty} onValueChange={(value) => setAiDifficulty(value as AIDifficulty)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={() => {
                      if (isOnline && isHost) {
                        // Get random ECHL player name
                        const echlPlayers = [
                          'Dennis Bonvie', 'Matt Carkner', 'Garrett Burnett', 'Brad Wingfield',
                          'Steve MacIntyre', 'Darren Schwartz', 'Chris Ferraro', 'Riley Cote',
                          'David-Alexandre Beauregard', 'Kip Brennan', 'Bryan Helmer', 'Brent Cullaton',
                          'Trevor Gallant', 'Tyler Mosienko', 'Zac Rinaldo', 'Cam Janssen',
                          'Jesse Schultz', 'Chris Durno', 'Joe Fallon', 'Jared Staal'
                        ];
                        const usedNames = players.map(p => p.name);
                        const availableNames = echlPlayers.filter(name => !usedNames.includes(name));
                        const aiName = availableNames.length > 0 
                          ? availableNames[Math.floor(Math.random() * availableNames.length)]
                          : `AI ${players.length + 1}`;
                        addMultiplayerAI(aiName, aiDifficulty);
                      } else {
                        addAIPlayer(aiDifficulty);
                      }
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    🤖 Add AI
                  </Button>
                </div>
              </div>
            )}
            
            {/* Start game */}
            {players.length >= 4 && (!isOnline || isHost) && (
              <Button 
                onClick={() => {
                  if (isOnline && isHost) {
                    startMultiplayerGame();
                  } else {
                    startGame();
                  }
                }} 
                className="w-full" 
                variant="default"
              >
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md bg-gray-900 bg-opacity-80 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-center text-white text-lg md:text-xl">Choose Trump Suit</CardTitle>
            <p className="text-center text-sm text-gray-300">
              You won the bid! Select the trump suit.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {isHighestBidder ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { suit: 'hearts', symbol: '♥', color: 'text-red-500' },
                    { suit: 'diamonds', symbol: '♦', color: 'text-red-500' },
                    { suit: 'clubs', symbol: '♣', color: 'text-white' },
                    { suit: 'spades', symbol: '♠', color: 'text-white' }
                  ].map(({ suit, symbol, color }) => (
                    <Button
                      key={suit}
                      variant={trumpSuit === suit ? "default" : "outline"}
                      onClick={() => setTrumpSuit(suit)}
                      className="h-20 flex flex-col touch-manipulation"
                    >
                      <span className={`text-3xl ${color}`}>{symbol}</span>
                      <span className="text-sm capitalize text-white">{suit}</span>
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
                  className="w-full h-12 text-base touch-manipulation"
                >
                  Choose {trumpSuit}
                </Button>
              </div>
            ) : (
              <p className="text-center text-sm text-gray-300">
                Waiting for the highest bidder to choose trump...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Everyone sat out phase
  if (gamePhase === 'everyone_sat') {
    const bidder = players.find(p => p.id === highestBidder);
    const isBidder = highestBidder === localPlayerId;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md bg-gray-900 bg-opacity-80 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-center text-white text-lg md:text-xl">Everyone Sat Out!</CardTitle>
            <p className="text-center text-sm text-gray-300">
              {isBidder ? 'Choose your penalty:' : `Waiting for ${bidder?.name} to choose penalty...`}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {isBidder ? (
              <div className="space-y-3">
                <p className="text-sm text-center text-gray-200">
                  Everyone sat out. You can either:
                </p>
                <Button
                  variant="outline"
                  onClick={() => choosePenalty('self')}
                  className="w-full h-auto flex flex-col gap-1 py-4 text-white border-gray-600 hover:bg-gray-700 touch-manipulation"
                >
                  <span className="font-semibold text-base">Take -5 to my score</span>
                  <span className="text-xs text-gray-300">Reduce your score by 5 points</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => choosePenalty('others')}
                  className="w-full h-auto flex flex-col gap-1 py-4 text-white border-gray-600 hover:bg-gray-700 touch-manipulation"
                >
                  <span className="font-semibold text-base">Give +5 to all others</span>
                  <span className="text-xs text-gray-300">Add 5 points to everyone else's score</span>
                </Button>
              </div>
            ) : (
              <p className="text-center text-sm text-gray-300">
                {bidder?.name} is deciding the penalty...
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md bg-gray-900 bg-opacity-80 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-center text-white text-xl md:text-2xl">Game Over!</CardTitle>
            <p className="text-center text-lg md:text-xl font-semibold text-green-400">
              {winner?.name} Wins!
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <h3 className="font-semibold text-sm text-white">Final Scores:</h3>
              {sortedPlayers.map((player, index) => (
                <div key={player.id} className="flex justify-between text-sm text-gray-200">
                  <span className="flex items-center gap-2 truncate max-w-[180px]">
                    {index === 0 && <span className="text-yellow-400">👑</span>}
                    {player.name}
                  </span>
                  <span className={`font-mono text-xs md:text-sm whitespace-nowrap ${player.score <= 0 ? 'text-green-400' : player.score > 32 ? 'text-red-400' : 'text-gray-200'}`}>
                    {player.score}
                    {player.score <= 0 && ' (Winner!)'}
                    {player.score > 32 && ' (Eliminated)'}
                  </span>
                </div>
              ))}
            </div>
            
            <Button onClick={resetGame} className="w-full h-12 text-base touch-manipulation">
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
      <div className="fixed top-2 left-2 sm:top-4 sm:left-4 z-30">
        <Card className="w-40 sm:w-64 bg-white/95">
          <CardContent className="pt-3 sm:pt-4 p-2 sm:p-4">
            <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span>Round:</span>
                <span className="font-mono">{round}</span>
              </div>
              <div className="flex justify-between">
                <span>Phase:</span>
                <span className="capitalize font-mono text-xs sm:text-sm">{gamePhase.replace('_', ' ')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scores overlay */}
      <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-30">
        <Card className="w-40 sm:w-56 bg-white/95">
          <CardHeader className="pb-1 sm:pb-2 p-2 sm:p-4">
            <CardTitle className="text-xs sm:text-sm">Scores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0.5 sm:space-y-1 p-2 sm:p-4 pt-0">
            {players.map((player) => {
              const score = scores.get(player.id) || 16;
              return (
                <div key={player.id} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  {player.avatar && <Avatar avatar={player.avatar} size="sm" showBorder={false} />}
                  <span className="truncate flex-1">{player.name}</span>
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

      {/* Game history */}
      {gamePhase !== 'setup' && <GameHistory />}

      {/* Avatar customizer */}
      <AvatarCustomizer
        open={showAvatarCustomizer}
        onClose={() => setShowAvatarCustomizer(false)}
        currentAvatar={currentAvatar}
        onSave={(avatar) => setCurrentAvatar(avatar)}
      />
    </div>
  );
}
