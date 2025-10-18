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
import { Settings as SettingsDialog } from '../Settings';
import { TransactionHistory } from '../TransactionHistory';
import { TurnTimer } from './TurnTimer';
import { useState, useEffect } from 'react';
import { AIDifficulty } from '../../lib/game/gameLogic';
import { useMultiplayer } from '../../lib/hooks/useMultiplayer';
import { useWallet } from '../../lib/stores/useWallet';
import { BookOpen, HelpCircle, Settings, X, Wallet, History } from 'lucide-react';

export default function GameUI() {
  const { 
    gamePhase, 
    players,
    eliminatedPlayers,
    scores,
    round,
    history,
    joinGame,
    addAIPlayer,
    startGame,
    chooseTrumpSuit,
    choosePenalty,
    highestBidder,
    resetGame,
    localPlayerId,
    isSimulating,
    setSimulating,
    removePlayer,
    multiplayerMode: mode,
    multiplayerRoomCode: roomCode,
    isMultiplayerHost: isHost
  } = useShnarps();
  
  const { addAIPlayer: addMultiplayerAI, removePlayer: removeMultiplayerPlayer, startGame: startMultiplayerGame } = useMultiplayer();
  
  const [playerName, setPlayerName] = useState('');
  const [trumpSuit, setTrumpSuit] = useState<string>('');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');
  const [gameMode, setGameMode] = useState<'menu' | 'local' | 'online'>('menu');
  const [showAvatarCustomizer, setShowAvatarCustomizer] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<PlayerAvatar>({
    color: '#3B82F6',
    icon: '👤'
  });
  
  const isHighestBidder = highestBidder === localPlayerId;
  const localPlayer = players.find(p => p.id === localPlayerId);
  const { balance } = useWallet();

  // DEBUG: Log all state values
  console.log('🔍 GameUI Render - gameMode:', gameMode, 'mode:', mode, 'gamePhase:', gamePhase, 'players:', players.length, 'roomCode:', roomCode);

  // Check if first-time user and show walkthrough
  useEffect(() => {
    const walkthroughCompleted = localStorage.getItem('shnarps_walkthrough_completed');
    if (!walkthroughCompleted && gamePhase === 'setup' && players.length === 0) {
      setShowWalkthrough(true);
    }
  }, [gamePhase, players.length]);

  // Welcome screen - choose game mode (only show if NOT in online mode)
  if (gameMode === 'menu' && gamePhase === 'setup' && players.length === 0 && mode === 'local') {
    console.log('Showing welcome menu - gameMode:', gameMode, 'mode:', mode, 'players:', players.length);
    return (
      <>
        <div className="fixed inset-0 flex items-start justify-center pt-8 md:pt-16" style={{ zIndex: 9999 }}>
          <Card className="w-full max-w-md mx-4 shadow-2xl bg-white relative">
            <div 
              className="absolute top-3 right-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setShowHistory(true)}
              title="View game statistics"
            >
              <div className="flex items-center gap-1 text-gray-600">
                <Wallet className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {balance.toFixed(0)}
                </span>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-center text-2xl">Shnarps</CardTitle>
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
                  onClick={() => setShowSettings(true)} 
                  variant="ghost" 
                  className="w-full justify-start"
                  size="sm"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings (Stakes & Rules)
                </Button>
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
        
        {/* Settings, Tutorial, Walkthrough, and Transaction History modals */}
        <SettingsDialog open={showSettings} onClose={() => setShowSettings(false)} />
        <Tutorial open={showTutorial} onClose={() => setShowTutorial(false)} />
        <AppWalkthrough open={showWalkthrough} onClose={() => setShowWalkthrough(false)} />
        <TransactionHistory open={showHistory} onClose={() => setShowHistory(false)} />
      </>
    );
  }

  // Multiplayer setup - only show if trying to connect AND not yet connected
  if (gameMode === 'online' && mode === 'local') {
    console.log('Showing multiplayer setup');
    return (
      <MultiplayerSetup 
        onBack={() => setGameMode('menu')} 
        onConnected={() => {
          console.log('✅ GameUI: Multiplayer connected, staying in online mode');
          // Don't change gameMode - just let the setup phase render
        }}
      />
    );
  }

  // Setup phase (works for both local and online games)
  if (gamePhase === 'setup') {
    // Show room code for online games
    const isOnline = mode === 'online';
    console.log('=== SETUP PHASE ===');
    console.log('gameMode:', gameMode, 'mode:', mode, 'roomCode:', roomCode, 'players:', players.length);
    
    return (
      <div className="fixed inset-0 flex items-start justify-center pt-8 md:pt-16" style={{ zIndex: 9999 }}>
        <Card className="w-full max-w-md mx-4 shadow-2xl bg-white">
          <CardHeader>
            <CardTitle className="text-center">Shnarps</CardTitle>
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
            {/* Current players - scrollable list */}
            {players.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Players:</h3>
                <div className="max-h-48 overflow-y-auto pr-2 space-y-1">
                  {players.map((player) => (
                    <div key={player.id} className="flex items-center gap-3 py-1">
                      {player.avatar && <Avatar avatar={player.avatar} size="sm" />}
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            {player.name}
                            {player.isAI && ` 🤖 (${player.aiDifficulty || 'medium'})`}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Score: {scores.get(player.id) || 16}
                          </span>
                        </div>
                        {!player.isAI && (
                          <div className="text-xs text-green-600 font-medium">
                            🪙 {(player.wallet || 100).toFixed(2)} coins
                          </div>
                        )}
                      </div>
                      {/* Remove button - only show if not local player and (in local mode OR host in online mode) */}
                      {player.id !== localPlayerId && (!isOnline || isHost) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (isOnline && isHost) {
                              removeMultiplayerPlayer(player.id);
                            } else {
                              removePlayer(player.id);
                            }
                          }}
                          className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
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
                    <SelectContent className="bg-white border-gray-300">
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={() => {
                      console.log('🤖 Add AI clicked - isOnline:', isOnline, 'isHost:', isHost);
                      if (isOnline && isHost) {
                        // Get random manly name for AI
                        const aiPlayerNames = [
                          'Jack', 'Luke', 'Cole', 'Ryan',
                          'Jake', 'Tyler', 'Chase', 'Dylan',
                          'Blake', 'Hunter', 'Mason', 'Logan',
                          'Austin', 'Carter', 'Wyatt', 'Cody',
                          'Trevor', 'Connor', 'Brett', 'Shane'
                        ];
                        const usedNames = players.map(p => p.name);
                        const availableNames = aiPlayerNames.filter(name => !usedNames.includes(name));
                        const aiName = availableNames.length > 0 
                          ? availableNames[Math.floor(Math.random() * availableNames.length)]
                          : `AI ${players.length + 1}`;
                        console.log('Adding multiplayer AI:', aiName, aiDifficulty);
                        addMultiplayerAI(aiName, aiDifficulty);
                      } else {
                        console.log('Adding local AI:', aiDifficulty);
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

  // Trump selection phase - only show UI if you won the bid
  if (gamePhase === 'trump_selection' && isHighestBidder) {
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
    // Get the last round history to see money changes
    const lastRound = history[history.length - 1];
    const moneyChanges = lastRound?.moneyChanges || new Map<string, number>();
    
    // Combine active players and eliminated players for final scoreboard
    const allPlayers = [...players, ...(eliminatedPlayers || [])];
    
    // Find the winner (player with score <= 0)
    const winner = allPlayers.find(p => (scores.get(p.id) ?? 16) <= 0);
    
    // Sort players: winner first, then by score (lowest to highest)
    const sortedPlayers = allPlayers
      .map(player => ({
        ...player,
        score: scores.get(player.id) ?? 16,
        wallet: player.wallet || 100,
        moneyChange: moneyChanges.get(player.id) || 0,
        punts: player.punts || 0,
        isEliminated: (scores.get(player.id) ?? 16) > 32
      }))
      .sort((a, b) => {
        // Winner (score <= 0) comes first
        if (a.id === winner?.id) return -1;
        if (b.id === winner?.id) return 1;
        // Then sort by score
        return a.score - b.score;
      });
    
    // Calculate total pot
    const totalPot = sortedPlayers.reduce((sum, p) => {
      if (p.id !== winner?.id) {
        const pointsCost = p.score * 0.25;
        const puntsCost = p.punts * 1.0;
        return sum + pointsCost + puntsCost;
      }
      return sum;
    }, 0);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md bg-gray-900 bg-opacity-80 text-white flex flex-col max-h-[90vh]">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="text-center text-white text-xl md:text-2xl">Game Over!</CardTitle>
            <div className="text-center mt-2 mb-3 py-2 bg-green-900 bg-opacity-40 rounded border border-green-500">
              <p className="text-2xl md:text-3xl font-bold text-green-400">
                🎉 {winner?.name} 🎉
              </p>
              <p className="text-sm text-green-300 mt-1">Winner!</p>
            </div>
            <p className="text-center text-sm text-yellow-400 font-bold">
              Total Pot: ${totalPot.toFixed(2)}
            </p>
          </CardHeader>
          <CardContent className="space-y-3 overflow-y-auto flex-1">
            <div className="space-y-2 pb-2">
              <h3 className="font-semibold text-sm text-white sticky top-0 bg-gray-900 py-1 z-10">Final Results:</h3>
              {sortedPlayers.map((player, index) => {
                const isWinner = player.id === winner?.id;
                const pointsCost = player.score * 0.25;
                const puntsCost = player.punts * 1.0;
                const totalOwed = pointsCost + puntsCost;
                
                return (
                  <div key={player.id} className={`bg-gray-800 bg-opacity-50 rounded p-2 space-y-1 ${player.isEliminated ? 'opacity-75' : ''}`}>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1 truncate max-w-[140px] font-semibold">
                        {isWinner && <span className="text-yellow-400">👑</span>}
                        {player.name}
                        {player.isEliminated && <span className="text-red-400 text-xs ml-1">(Elim)</span>}
                      </span>
                      <span className={`font-mono text-sm ${player.score <= 0 ? 'text-green-400' : player.score > 32 ? 'text-red-400' : 'text-gray-200'}`}>
                        {player.score} pts
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-300">
                      <div className="flex justify-between">
                        <span>Punts: {player.punts}</span>
                        <span>🪙 {player.wallet.toFixed(2)} coins</span>
                      </div>
                    </div>
                    
                    {!isWinner && (
                      <div className="text-xs border-t border-gray-600 pt-1">
                        <div className="flex justify-between text-gray-400">
                          <span>{player.score} pts × 🪙0.25</span>
                          <span>🪙{pointsCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>{player.punts} punts × 🪙1.00</span>
                          <span>🪙{puntsCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-red-400 border-t border-gray-700 pt-1">
                          <span>Total Owed:</span>
                          <span>-🪙{totalOwed.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                    
                    {isWinner && (
                      <div className="text-xs border-t border-gray-600 pt-1">
                        <div className="flex justify-between font-semibold text-green-400">
                          <span>Won:</span>
                          <span>+🪙{totalPot.toFixed(2)}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">
                          Owes: 🪙0.00
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
          <div className="p-6 pt-0 flex-shrink-0">
            <Button onClick={resetGame} className="w-full h-12 text-base touch-manipulation">
              {mode === 'online' ? 'Return to Menu' : 'Play Again'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Check if local player is eliminated
  const localPlayerScore = localPlayerId ? scores.get(localPlayerId) : undefined;
  const isLocalPlayerEliminated = localPlayerScore !== undefined && localPlayerScore > 32;

  // Phase-specific UI overlays
  return (
    <div>
      {/* Turn timer (multiplayer only) */}
      <TurnTimer />

      {/* Phase-specific overlays */}
      {gamePhase === 'bidding' && <BiddingPhase />}
      {gamePhase === 'sit_pass' && <SitPassPhase />}
      {gamePhase === 'hand_play' && <HandPlayPhase />}

      {/* Game history */}
      {gamePhase !== 'setup' && <GameHistory />}

      {/* Eliminated player - Simulate to End option */}
      {isLocalPlayerEliminated && !isSimulating && gamePhase !== 'game_over' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-gray-900 bg-opacity-95 text-white">
            <CardHeader>
              <CardTitle className="text-center text-red-400 text-xl">You've Been Eliminated!</CardTitle>
              <p className="text-center text-sm text-gray-300 mt-2">
                Your score went over 32 points. You're out of the game, but you can watch the bots play or simulate to the end.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => setSimulating(true)} 
                className="w-full h-12 text-base touch-manipulation bg-blue-600 hover:bg-blue-700"
              >
                ⚡ Simulate to End
              </Button>
              <p className="text-xs text-center text-gray-400">
                Or continue watching the bots play
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Simulating overlay */}
      {isSimulating && gamePhase !== 'game_over' && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm bg-gray-900 bg-opacity-95 text-white">
            <CardContent className="py-8 text-center">
              <div className="text-4xl mb-4">⚡</div>
              <p className="text-xl font-semibold mb-2">Simulating...</p>
              <p className="text-sm text-gray-400">Fast-forwarding to the end</p>
            </CardContent>
          </Card>
        </div>
      )}

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
