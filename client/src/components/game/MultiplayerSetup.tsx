import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { useMultiplayer } from '../../lib/hooks/useMultiplayer';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface MultiplayerSetupProps {
  onBack: () => void;
  onConnected?: () => void;
}

export default function MultiplayerSetup({ onBack, onConnected }: MultiplayerSetupProps) {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join' | 'spectate'>('menu');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { connectToRoom, isConnected, mode: multiplayerMode } = useMultiplayer();
  const isMountedRef = useRef(true);

  // Track mount state to prevent state updates after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // When successfully connected to online mode, notify parent to close this dialog
  useEffect(() => {
    if (multiplayerMode === 'online' && onConnected) {
      console.log('✅ MultiplayerSetup: Connected to online mode, calling onConnected');
      if (isMountedRef.current) {
        setIsLoading(false);
        setError(null);
      }
      onConnected();
    }
  }, [multiplayerMode, onConnected]);

  // Validate player name
  const validatePlayerName = (name: string): string | null => {
    if (!name.trim()) return 'Please enter your name';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    if (name.trim().length > 20) return 'Name must be 20 characters or less';
    return null;
  };

  // Validate room code
  const validateRoomCode = (code: string): string | null => {
    if (!code.trim()) return 'Please enter a room code';
    if (code.trim().length !== 6) return 'Room code must be exactly 6 characters';
    if (!/^[A-Z0-9]+$/.test(code.trim().toUpperCase())) return 'Room code can only contain letters and numbers';
    return null;
  };

  const handleCreateRoom = async () => {
    const nameError = validatePlayerName(playerName);
    if (nameError) {
      setError(nameError);
      toast.error(nameError);
      return;
    }

    setError(null);
    setIsLoading(true);
    console.log('Create room button clicked, playerName:', playerName);

    try {
      await connectToRoom(playerName.trim(), undefined, false);
      toast.success('Room created successfully!');
    } catch (err) {
      if (isMountedRef.current) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create room. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
        setIsLoading(false);
      }
    }
  };

  const handleCreateSpectatorRoom = async () => {
    setError(null);
    setIsLoading(true);
    console.log('Creating spectator room (AI-only game)');

    try {
      await connectToRoom('', undefined, true);
      toast.success('Spectator room created!');
    } catch (err) {
      if (isMountedRef.current) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create spectator room.';
        setError(errorMsg);
        toast.error(errorMsg);
        setIsLoading(false);
      }
    }
  };

  const handleJoinRoom = async () => {
    const nameError = validatePlayerName(playerName);
    const codeError = validateRoomCode(roomCode);

    if (nameError || codeError) {
      const errorMsg = nameError || codeError;
      setError(errorMsg);
      toast.error(errorMsg!);
      return;
    }

    setError(null);
    setIsLoading(true);
    console.log('Join room button clicked, playerName:', playerName, 'roomCode:', roomCode);

    try {
      await connectToRoom(playerName.trim(), roomCode.trim().toUpperCase(), false);
      toast.success('Joined room successfully!');
    } catch (err) {
      if (isMountedRef.current) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to join room. Check the code and try again.';
        setError(errorMsg);
        toast.error(errorMsg);
        setIsLoading(false);
      }
    }
  };

  // Clear error when switching modes
  const handleModeChange = (newMode: typeof mode) => {
    setError(null);
    setMode(newMode);
  };

  if (mode === 'menu') {
    return (
      <div className="fixed inset-0 flex items-start justify-center pt-8 md:pt-16" style={{ zIndex: 9999 }}>
        <Card className="w-full max-w-md mx-4 shadow-2xl bg-white">
          <CardHeader>
            <CardTitle className="text-center">Online Multiplayer</CardTitle>
            <p className="text-center text-sm text-muted-foreground">
              Play with friends in real-time
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm" role="alert">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <Button onClick={() => handleModeChange('create')} className="w-full" size="lg" disabled={isLoading}>
              Create New Room
            </Button>
            <Button onClick={() => handleModeChange('join')} className="w-full" variant="outline" size="lg" disabled={isLoading}>
              Join Existing Room
            </Button>
            <Button onClick={handleCreateSpectatorRoom} className="w-full" variant="secondary" size="lg" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              🤖 Spectate AI Game
            </Button>
            <Button onClick={onBack} className="w-full" variant="ghost" disabled={isLoading}>
              Back to Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="fixed inset-0 flex items-start justify-center pt-8 md:pt-16" style={{ zIndex: 9999 }}>
        <Card className="w-full max-w-md mx-4 shadow-2xl bg-white">
          <CardHeader>
            <CardTitle className="text-center">Create Room</CardTitle>
            <p className="text-center text-sm text-muted-foreground">
              You'll get a room code to share with friends
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm" role="alert">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div>
              <label htmlFor="create-name" className="text-sm font-medium">Your Name</label>
              <Input
                id="create-name"
                placeholder="Enter your name (2-20 characters)"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && playerName.trim()) {
                    handleCreateRoom();
                  }
                }}
                maxLength={20}
                disabled={isLoading}
                aria-describedby={error ? "create-error" : undefined}
              />
              <p className="text-xs text-muted-foreground mt-1">Press Enter to create room</p>
            </div>
            <Button
              onClick={handleCreateRoom}
              className="w-full"
              disabled={!playerName.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Room'
              )}
            </Button>
            <Button onClick={() => handleModeChange('menu')} className="w-full" variant="ghost" disabled={isLoading}>
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className="fixed inset-0 flex items-start justify-center pt-8 md:pt-16" style={{ zIndex: 9999 }}>
        <Card className="w-full max-w-md mx-4 shadow-2xl bg-white">
          <CardHeader>
            <CardTitle className="text-center">Join Room</CardTitle>
            <p className="text-center text-sm text-muted-foreground">
              Enter the room code from your friend
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm" role="alert">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div>
              <label htmlFor="join-name" className="text-sm font-medium">Your Name</label>
              <Input
                id="join-name"
                placeholder="Enter your name (2-20 characters)"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  if (error) setError(null);
                }}
                maxLength={20}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="room-code" className="text-sm font-medium">Room Code</label>
              <Input
                id="room-code"
                placeholder="Enter 6-character code"
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value.toUpperCase());
                  if (error) setError(null);
                }}
                maxLength={6}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && playerName.trim() && roomCode.trim()) {
                    handleJoinRoom();
                  }
                }}
                disabled={isLoading}
                className="font-mono tracking-widest text-center text-lg"
              />
              <p className="text-xs text-muted-foreground mt-1">Press Enter to join</p>
            </div>
            <Button
              onClick={handleJoinRoom}
              className="w-full"
              disabled={!playerName.trim() || !roomCode.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Joining...
                </>
              ) : (
                'Join Room'
              )}
            </Button>
            <Button onClick={() => handleModeChange('menu')} className="w-full" variant="ghost" disabled={isLoading}>
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
