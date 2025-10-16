import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { useMultiplayer } from '../../lib/hooks/useMultiplayer';

interface MultiplayerSetupProps {
  onBack: () => void;
}

export default function MultiplayerSetup({ onBack }: MultiplayerSetupProps) {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const { connectToRoom, isConnected } = useMultiplayer();

  const handleCreateRoom = () => {
    if (playerName.trim()) {
      connectToRoom(playerName.trim());
    }
  };

  const handleJoinRoom = () => {
    if (playerName.trim() && roomCode.trim()) {
      connectToRoom(playerName.trim(), roomCode.trim().toUpperCase());
    }
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
            <Button onClick={() => setMode('create')} className="w-full" size="lg">
              Create New Room
            </Button>
            <Button onClick={() => setMode('join')} className="w-full" variant="outline" size="lg">
              Join Existing Room
            </Button>
            <Button onClick={onBack} className="w-full" variant="ghost">
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
            <div>
              <label className="text-sm font-medium">Your Name</label>
              <Input
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && playerName.trim()) {
                    handleCreateRoom();
                  }
                }}
              />
            </div>
            <Button 
              onClick={handleCreateRoom} 
              className="w-full" 
              disabled={!playerName.trim() || isConnected}
            >
              {isConnected ? 'Creating...' : 'Create Room'}
            </Button>
            <Button onClick={() => setMode('menu')} className="w-full" variant="ghost">
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
            <div>
              <label className="text-sm font-medium">Your Name</label>
              <Input
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Room Code</label>
              <Input
                placeholder="Enter 6-character code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && playerName.trim() && roomCode.trim()) {
                    handleJoinRoom();
                  }
                }}
              />
            </div>
            <Button 
              onClick={handleJoinRoom} 
              className="w-full" 
              disabled={!playerName.trim() || !roomCode.trim() || isConnected}
            >
              {isConnected ? 'Joining...' : 'Join Room'}
            </Button>
            <Button onClick={() => setMode('menu')} className="w-full" variant="ghost">
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
