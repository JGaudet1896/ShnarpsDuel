import { useEffect, useRef, useState } from 'react';
import { useShnarps } from '../stores/useShnarps';

export type MultiplayerMode = 'local' | 'online';

export function useMultiplayer() {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [mode, setMode] = useState<MultiplayerMode>('local');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);

  const connectToRoom = (playerName: string, existingRoomCode?: string) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      setIsConnected(true);
      
      if (existingRoomCode) {
        // Join existing room
        ws.send(JSON.stringify({
          type: 'JOIN_ROOM',
          roomId: existingRoomCode,
          playerName
        }));
      } else {
        // Create new room
        ws.send(JSON.stringify({
          type: 'CREATE_ROOM',
          playerName
        }));
        setIsHost(true);
      }
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleServerMessage(message);
    };

    ws.onclose = () => {
      setIsConnected(false);
      setMode('local');
      setRoomCode(null);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    wsRef.current = ws;
    setMode('online');
  };

  const handleServerMessage = (message: any) => {
    const store = useShnarps.getState();

    switch (message.type) {
      case 'ROOM_CREATED':
        setRoomCode(message.roomId);
        store.setMultiplayerState(message.players, message.gameState, message.localPlayerId);
        break;

      case 'JOINED_ROOM':
        setRoomCode(message.roomId);
        store.setMultiplayerState(message.players, message.gameState, message.localPlayerId);
        break;

      case 'PLAYER_JOINED':
        store.addRemotePlayer(message.player);
        break;

      case 'PLAYER_LEFT':
        store.removePlayer(message.playerId);
        break;

      case 'GAME_STATE_UPDATE':
        store.applyGameAction(message.action, message.payload);
        break;

      case 'GAME_STARTED':
        store.syncGameState(message.gameState);
        break;

      case 'ERROR':
        console.error('Server error:', message.message);
        alert(message.message);
        break;
    }
  };

  const sendAction = (action: string, payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'GAME_ACTION',
        action,
        payload
      }));
    }
  };

  const addAIPlayer = (aiName: string, difficulty: 'easy' | 'medium' | 'hard') => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && isHost) {
      wsRef.current.send(JSON.stringify({
        type: 'ADD_AI',
        aiName,
        difficulty
      }));
    }
  };

  const startGame = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && isHost) {
      wsRef.current.send(JSON.stringify({
        type: 'START_GAME'
      }));
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setMode('local');
    setRoomCode(null);
    setIsHost(false);
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    mode,
    isConnected,
    roomCode,
    isHost,
    connectToRoom,
    sendAction,
    addAIPlayer,
    startGame,
    disconnect
  };
}
