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
import { ErrorBoundary } from './ErrorBoundary';
import { TurnIndicator, PhaseIndicator } from './TurnIndicator';
import { Confetti } from './Confetti';
import { useState, useEffect } from 'react';
import { useMultiplayer } from '../../lib/hooks/useMultiplayer';
import { useWallet } from '../../lib/stores/useWallet';
import { BookOpen, HelpCircle, Settings, X, Wallet, History, Copy, Check, Trophy, Crown, Medal, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [copiedRoomCode, setCopiedRoomCode] = useState(false);

  // Copy room code to clipboard
  const handleCopyRoomCode = async () => {
    if (roomCode) {
      try {
        await navigator.clipboard.writeText(roomCode);
        setCopiedRoomCode(true);
        toast.success('Room code copied!');
        setTimeout(() => setCopiedRoomCode(false), 2000);
      } catch (err) {
        console.error('Failed to copy room code:', err);
        toast.error('Failed to copy room code');
      }
    }
  };
  
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

  // Multiplayer setup - only show if trying to connect AND not yet connected AND not in an active game
  if (gameMode === 'online' && mode === 'local' && gamePhase === 'setup' && players.length === 0) {
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
    const playerCapacity = { current: players.length, min: 4, max: 8 };
    const canStart = playerCapacity.current >= playerCapacity.min;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 flex items-start justify-center pt-6 md:pt-12 px-4"
        style={{ zIndex: 9999 }}
      >
        <Card className="w-full max-w-md shadow-2xl bg-white overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-green-600 to-green-700 text-white">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Shnarps</CardTitle>
                <p className="text-sm text-green-100 mt-0.5">
                  {isOnline ? 'Online Room' : 'Local Game'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Globe className="h-5 w-5 text-green-200" />
                ) : (
                  <span className="text-xl">🏠</span>
                )}
              </div>
            </div>

            {/* Room code for online */}
            {isOnline && roomCode && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 bg-white/10 backdrop-blur rounded-lg"
              >
                <p className="text-xs text-green-100 mb-1">Share this code:</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-2xl font-bold tracking-widest font-mono">{roomCode}</p>
                  <button
                    onClick={handleCopyRoomCode}
                    className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                    aria-label={copiedRoomCode ? 'Copied!' : 'Copy room code'}
                  >
                    {copiedRoomCode ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            {/* Player capacity progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">Players</span>
                <span className={`font-bold ${canStart ? 'text-green-600' : 'text-orange-500'}`}>
                  {playerCapacity.current} / {playerCapacity.max}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${canStart ? 'bg-green-500' : 'bg-orange-400'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(playerCapacity.current / playerCapacity.max) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              {!canStart && (
                <p className="text-xs text-orange-600">Need {playerCapacity.min - playerCapacity.current} more player{playerCapacity.min - playerCapacity.current > 1 ? 's' : ''}</p>
              )}
            </div>

            {/* Player list */}
            {players.length > 0 && (
              <div className="space-y-2">
                <div className="max-h-40 overflow-y-auto pr-1 space-y-1.5">
                  {players.map((player, index) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                    >
                      {player.avatar && <Avatar avatar={player.avatar} size="sm" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium truncate">
                            {player.name}
                          </span>
                          {player.isAI && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 rounded text-gray-600">AI</span>
                          )}
                          {player.id === localPlayerId && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 rounded text-blue-600">You</span>
                          )}
                        </div>
                        {isOnline && !player.isAI && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${player.isConnected === false ? 'bg-red-500' : 'bg-green-500'}`} />
                            <span className="text-[10px] text-gray-500">
                              {player.isConnected === false ? 'Disconnected' : 'Connected'}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Remove button */}
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
                          className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Join game - only for local mode */}
            {!isOnline && players.length < 8 && !localPlayer && (
              <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div onClick={() => setShowAvatarCustomizer(true)} className="cursor-pointer hover:opacity-80 transition-opacity">
                    <Avatar avatar={currentAvatar} size="md" />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="Your name"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && playerName.trim()) {
                          joinGame(playerName.trim(), currentAvatar);
                          setPlayerName('');
                        }
                      }}
                      className="bg-white"
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
              </div>
            )}

            {/* Add AI button */}
            {players.length < 8 && (!isOnline || isHost) && (
              <Button
                onClick={() => {
                  if (isOnline && isHost) {
                    const aiPlayerNames = [
                      'Jack', 'Luke', 'Cole', 'Ryan', 'Jake', 'Tyler', 'Chase', 'Dylan',
                      'Blake', 'Hunter', 'Mason', 'Logan', 'Austin', 'Carter', 'Wyatt', 'Cody'
                    ];
                    const usedNames = players.map(p => p.name);
                    const availableNames = aiPlayerNames.filter(name => !usedNames.includes(name));
                    const aiName = availableNames.length > 0
                      ? availableNames[Math.floor(Math.random() * availableNames.length)]
                      : `AI ${players.length + 1}`;
                    addMultiplayerAI(aiName);
                  } else {
                    addAIPlayer();
                  }
                }}
                variant="outline"
                className="w-full"
              >
                <span className="mr-2">🤖</span> Add AI Player
              </Button>
            )}

            {/* Start game button */}
            {canStart && (!isOnline || isHost) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Button
                  onClick={() => {
                    if (isOnline && isHost) {
                      startMultiplayerGame();
                    } else {
                      startGame();
                    }
                  }}
                  className="w-full h-12 text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500"
                >
                  Start Game
                </Button>
              </motion.div>
            )}

            {/* Back button for local mode */}
            {!isOnline && (
              <Button
                variant="ghost"
                onClick={() => {
                  setGameMode('menu');
                  resetGame();
                }}
                className="w-full text-gray-500"
              >
                Back to Menu
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
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

  // Trump selection phase - waiting state for non-bidders
  if (gamePhase === 'trump_selection' && !isHighestBidder) {
    const bidder = players.find(p => p.id === highestBidder);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md bg-gray-900 bg-opacity-80 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-center text-white text-lg md:text-xl">Waiting for Trump</CardTitle>
            <p className="text-center text-sm text-gray-300">
              {bidder?.name || 'The bidder'} is choosing the trump suit...
            </p>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="flex gap-4 text-4xl animate-pulse">
              <span className="text-red-500">♥</span>
              <span className="text-red-500">♦</span>
              <span className="text-white">♣</span>
              <span className="text-white">♠</span>
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
    const isLocalPlayerWinner = winner?.id === localPlayerId;

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

    // Get placement icon
    const getPlacementIcon = (index: number, isWinner: boolean) => {
      if (isWinner) return <Crown className="h-5 w-5 text-yellow-400" />;
      if (index === 1) return <Medal className="h-4 w-4 text-gray-400" />;
      if (index === 2) return <Medal className="h-4 w-4 text-amber-700" />;
      return null;
    };

    return (
      <>
        <Confetti isActive={true} duration={5000} />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{
              duration: 0.5,
              delay: 0.2,
              type: "spring",
              stiffness: 200,
              damping: 20
            }}
          >
            <Card className="w-full max-w-md bg-gradient-to-b from-gray-900 to-gray-950 text-white flex flex-col max-h-[90vh] border border-gray-700 shadow-2xl">
              <CardHeader className="pb-3 flex-shrink-0">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                >
                  <CardTitle className="text-center text-white text-xl md:text-2xl flex items-center justify-center gap-2">
                    <Trophy className="h-6 w-6 text-yellow-400" />
                    Game Over!
                    <Trophy className="h-6 w-6 text-yellow-400" />
                  </CardTitle>
                </motion.div>

                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                  className="text-center mt-3 mb-3 py-4 bg-gradient-to-r from-yellow-900/40 via-yellow-800/40 to-yellow-900/40 rounded-lg border border-yellow-500/50 shadow-lg"
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Crown className="h-8 w-8 text-yellow-400" />
                  </div>
                  <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 bg-clip-text text-transparent">
                    {winner?.name}
                  </p>
                  <p className="text-sm text-yellow-300 mt-1 font-medium">
                    {isLocalPlayerWinner ? 'You won!' : 'Winner!'}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-900/50 to-emerald-900/50 px-4 py-2 rounded-full border border-green-500/40">
                    <span className="text-lg">💰</span>
                    <span className="text-lg font-bold text-green-400">
                      ${totalPot.toFixed(2)} pot
                    </span>
                  </div>
                </motion.div>
              </CardHeader>

              <CardContent className="space-y-3 overflow-y-auto flex-1 px-4">
                <div className="space-y-2 pb-2">
                  <h3 className="font-semibold text-sm text-gray-400 sticky top-0 bg-gray-900 py-1 z-10">Final Standings:</h3>
                  {sortedPlayers.map((player, index) => {
                    const isWinner = player.id === winner?.id;
                    const pointsCost = player.score * 0.25;
                    const puntsCost = player.punts * 1.0;
                    const totalOwed = pointsCost + puntsCost;

                    return (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 + index * 0.1 }}
                        className={`
                          rounded-lg p-3 space-y-2 transition-all
                          ${isWinner
                            ? 'bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border border-yellow-500/30'
                            : player.isEliminated
                              ? 'bg-gray-800/30 opacity-60 border border-gray-700/30'
                              : 'bg-gray-800/50 border border-gray-700/30'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-500 w-6">#{index + 1}</span>
                            {getPlacementIcon(index, isWinner)}
                            <span className="font-semibold truncate max-w-[120px]">
                              {player.name}
                              {player.isAI && <span className="ml-1 text-xs text-gray-500">AI</span>}
                            </span>
                          </div>
                          <div className={`
                            font-mono font-bold text-lg px-2 py-0.5 rounded
                            ${player.score <= 0
                              ? 'text-green-400 bg-green-900/30'
                              : player.score > 32
                                ? 'text-red-400 bg-red-900/30'
                                : 'text-gray-200'
                            }
                          `}>
                            {player.score}
                          </div>
                        </div>

                        {player.isEliminated && (
                          <div className="text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded inline-block">
                            Eliminated
                          </div>
                        )}

                        {isWinner && (
                          <div className="text-sm bg-green-900/30 rounded p-2 flex justify-between items-center">
                            <span className="text-green-300">Winnings:</span>
                            <span className="font-bold text-green-400">+${totalPot.toFixed(2)}</span>
                          </div>
                        )}

                        {!isWinner && !player.isEliminated && (
                          <div className="text-xs text-gray-400 flex justify-between">
                            <span>Owes to winner:</span>
                            <span className="text-red-400">-${totalOwed.toFixed(2)}</span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="p-4 pt-0 flex-shrink-0"
              >
                <Button
                  onClick={resetGame}
                  className="w-full h-12 text-base touch-manipulation bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
                >
                  {mode === 'online' ? 'Return to Menu' : 'Play Again'}
                </Button>
              </motion.div>
            </Card>
          </motion.div>
        </motion.div>
      </>
    );
  }

  // Check if local player is eliminated
  const localPlayerScore = localPlayerId ? scores.get(localPlayerId) : undefined;
  const isLocalPlayerEliminated = localPlayerScore !== undefined && localPlayerScore > 32;

  // Phase-specific UI overlays
  return (
    <div>
      {/* Turn indicator and phase display */}
      <TurnIndicator />
      <PhaseIndicator />

      {/* Turn timer (multiplayer only) */}
      <TurnTimer />

      {/* Phase-specific overlays with error boundaries */}
      {gamePhase === 'bidding' && (
        <ErrorBoundary componentName="Bidding Phase" onReset={() => window.location.reload()}>
          <BiddingPhase />
        </ErrorBoundary>
      )}
      {gamePhase === 'sit_pass' && (
        <ErrorBoundary componentName="Sit/Pass Phase" onReset={() => window.location.reload()}>
          <SitPassPhase />
        </ErrorBoundary>
      )}
      {gamePhase === 'hand_play' && (
        <ErrorBoundary componentName="Hand Play Phase" onReset={() => window.location.reload()}>
          <HandPlayPhase />
        </ErrorBoundary>
      )}

      {/* Game history - always shown after setup/game_over phases (handled by early returns above) */}
      <GameHistory />

      {/* Eliminated player - Simulate to End option */}
      {isLocalPlayerEliminated && !isSimulating && (
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

      {/* Simulating overlay - game_over already handled by early return above */}
      {isSimulating && (
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
