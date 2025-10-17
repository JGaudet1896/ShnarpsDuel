import { useEffect, useRef, useState } from 'react';
import { useShnarps } from '../stores/useShnarps';

export type MultiplayerMode = 'local' | 'online';

export function useMultiplayer() {
  const [isConnected, setIsConnected] = useState(false);
  
  // Get mode, roomCode, isHost, and websocket from Zustand store
  const { 
    multiplayerMode: mode, 
    multiplayerRoomCode: roomCode, 
    isMultiplayerHost: isHost,
    websocket,
    setMultiplayerMode,
    setWebSocket 
  } = useShnarps();

  const connectToRoom = (playerName: string, existingRoomCode?: string) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    console.log('Connecting to WebSocket:', wsUrl);
    
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      if (existingRoomCode) {
        console.log('Joining room:', existingRoomCode);
        ws.send(JSON.stringify({
          type: 'JOIN_ROOM',
          roomId: existingRoomCode,
          playerName
        }));
      } else {
        console.log('Creating new room');
        ws.send(JSON.stringify({
          type: 'CREATE_ROOM',
          playerName
        }));
        // Mode will be set to 'online' when we receive ROOM_CREATED message
      }
    };

    ws.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      const message = JSON.parse(event.data);
      handleServerMessage(message);
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
      setIsConnected(false);
      setMultiplayerMode('local', null, false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    setWebSocket(ws);
    // Note: Don't set mode to 'online' here - wait for ROOM_CREATED/JOINED_ROOM message
  };

  const handleServerMessage = (message: any) => {
    const store = useShnarps.getState();
    console.log('Handling server message:', message.type);

    switch (message.type) {
      case 'ROOM_CREATED':
        console.log('Room created:', message.roomId);
        store.setMultiplayerMode('online', message.roomId, true);
        store.setMultiplayerState(message.players, message.gameState, message.localPlayerId);
        break;

      case 'JOINED_ROOM':
        console.log('Joined room:', message.roomId);
        store.setMultiplayerMode('online', message.roomId, false);
        store.setMultiplayerState(message.players, message.gameState, message.localPlayerId);
        break;

      case 'PLAYER_JOINED':
        console.log('Player joined:', message.player.name);
        store.addRemotePlayer(message.player);
        break;

      case 'PLAYER_LEFT':
        console.log('Player left:', message.playerId);
        store.removePlayer(message.playerId);
        break;

      case 'GAME_STATE_UPDATE':
        console.log('Game state update:', message.action);
        store.applyGameAction(message.action, message.payload);
        break;

      case 'GAME_STARTED':
        console.log('Game started');
        // Update both players (with hands) and game state
        store.setMultiplayerState(message.players, message.gameState, message.localPlayerId || store.localPlayerId);
        break;

      case 'ERROR':
        console.error('Server error:', message.message);
        alert(message.message);
        break;
        
      default:
        console.warn('Unknown message type:', message.type);
    }
  };

  const sendAction = (action: string, payload: any) => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify({
        type: 'GAME_ACTION',
        action,
        payload
      }));
    }
  };

  const addAIPlayer = (aiName: string, difficulty: 'easy' | 'medium' | 'hard') => {
    console.log('addAIPlayer called:', { aiName, difficulty, hasWs: !!websocket, wsState: websocket?.readyState, isHost });
    if (websocket && websocket.readyState === WebSocket.OPEN && isHost) {
      console.log('Sending ADD_AI message to server');
      websocket.send(JSON.stringify({
        type: 'ADD_AI',
        aiName,
        difficulty
      }));
    } else {
      console.log('Cannot send ADD_AI - conditions not met');
    }
  };

  const startGame = () => {
    if (websocket && websocket.readyState === WebSocket.OPEN && isHost) {
      websocket.send(JSON.stringify({
        type: 'START_GAME'
      }));
    }
  };

  const removePlayer = (playerId: string) => {
    if (websocket && websocket.readyState === WebSocket.OPEN && isHost) {
      websocket.send(JSON.stringify({
        type: 'REMOVE_PLAYER',
        playerId
      }));
    }
  };

  const disconnect = () => {
    if (websocket) {
      websocket.close();
      setWebSocket(null);
    }
    setIsConnected(false);
    setMultiplayerMode('local', null, false);
  };

  // Don't close WebSocket on unmount - it should persist across components
  // Only close it explicitly via disconnect() or when connection fails

  return {
    mode,
    isConnected,
    roomCode,
    isHost,
    connectToRoom,
    sendAction,
    addAIPlayer,
    removePlayer,
    startGame,
    disconnect
  };
}
