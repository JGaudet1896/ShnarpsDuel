import { useEffect, useRef, useState } from 'react';
import { useShnarps } from '../stores/useShnarps';

export type MultiplayerMode = 'local' | 'online';

export function useMultiplayer() {
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Get mode, roomCode, isHost, and websocket from Zustand store
  const { 
    multiplayerMode: mode, 
    multiplayerRoomCode: roomCode, 
    isMultiplayerHost: isHost,
    websocket,
    localPlayerId,
    setMultiplayerMode,
    setWebSocket 
  } = useShnarps();

  const attemptReconnect = (existingRoomCode: string) => {
    const store = useShnarps.getState();
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    console.log('Attempting to reconnect to WebSocket:', wsUrl);
    
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket reconnected! Rejoining room:', existingRoomCode);
      setIsConnected(true);
      reconnectAttempts.current = 0; // Reset counter on successful reconnect
      
      // Rejoin the existing room
      ws.send(JSON.stringify({
        type: 'REJOIN_ROOM',
        roomId: existingRoomCode,
        playerId: store.localPlayerId
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleServerMessage(message);
    };

    ws.onclose = (event) => {
      console.log('WebSocket closed during reconnect attempt', event.code);
      setIsConnected(false);
      
      // Try again if we haven't hit max attempts
      if (reconnectAttempts.current < maxReconnectAttempts && event.code !== 1000) {
        reconnectAttempts.current++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current - 1), 10000);
        console.log(`Reconnect attempt failed. Retrying ${reconnectAttempts.current}/${maxReconnectAttempts} in ${delay}ms...`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          attemptReconnect(existingRoomCode);
        }, delay);
      } else {
        console.log('Max reconnect attempts reached or connection closed normally');
        setMultiplayerMode('local', null, false);
        store.initializeGame();
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error during reconnect:', error);
      setIsConnected(false);
    };

    setWebSocket(ws);
  };

  const connectToRoom = (playerName: string, existingRoomCode?: string) => {
    reconnectAttempts.current = 0; // Reset reconnect counter for fresh connection
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

    ws.onclose = (event) => {
      console.log('WebSocket closed', event.code, event.reason);
      setIsConnected(false);
      
      // Only auto-reconnect if:
      // 1. We're in online mode (not a user-initiated disconnect)
      // 2. We have a room code (we were in a game)
      // 3. We haven't exceeded max reconnect attempts
      // 4. The close wasn't a normal close (code 1000) or server-initiated close
      const store = useShnarps.getState();
      const shouldReconnect = 
        store.multiplayerMode === 'online' && 
        store.multiplayerRoomCode && 
        reconnectAttempts.current < maxReconnectAttempts &&
        event.code !== 1000; // 1000 = normal closure
      
      if (shouldReconnect) {
        reconnectAttempts.current++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current - 1), 10000); // Exponential backoff, max 10s
        console.log(`Attempting reconnect ${reconnectAttempts.current}/${maxReconnectAttempts} in ${delay}ms...`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          attemptReconnect(store.multiplayerRoomCode!);
        }, delay);
      } else if (event.code !== 1000 && reconnectAttempts.current >= maxReconnectAttempts) {
        // Only reset to menu if we've exhausted all reconnection attempts
        console.log('Max reconnect attempts exhausted - returning to menu');
        setMultiplayerMode('local', null, false);
        store.initializeGame();
      }
      // Note: If event.code === 1000 (normal close), we don't reset to menu
      // The user explicitly disconnected via the disconnect() function
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
    console.log('Handling server message:', message.type, message);

    try {
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

      case 'HOST_TRANSFERRED':
        console.log('Host transferred to:', message.newHostId);
        const isNewHost = message.newHostId === store.localPlayerId;
        store.setMultiplayerMode('online', store.multiplayerRoomCode, isNewHost);
        // Also remove the player who left
        if (message.leftPlayerId) {
          store.removePlayer(message.leftPlayerId);
        }
        break;

      case 'ROOM_CLOSED':
        console.log('Room closed:', message.reason);
        alert(`Game ended: ${message.reason}`);
        setIsConnected(false);
        store.setMultiplayerMode('local', null, false);
        store.initializeGame();
        break;

      case 'PLAYER_DISCONNECTED':
        console.log('Player disconnected:', message.playerName);
        // Store will handle marking player as disconnected
        const disconnectedPlayer = store.players.find(p => p.id === message.playerId);
        if (disconnectedPlayer) {
          disconnectedPlayer.isConnected = false;
        }
        break;

      case 'PLAYER_RECONNECTED':
        console.log('Player reconnected:', message.playerName);
        const reconnectedPlayer = store.players.find(p => p.id === message.playerId);
        if (reconnectedPlayer) {
          reconnectedPlayer.isConnected = true;
        }
        break;

      case 'REJOINED_ROOM':
        console.log('Rejoined room:', message.roomId);
        store.setMultiplayerMode('online', message.roomId, message.isHost);
        store.setMultiplayerState(message.players, message.gameState, message.localPlayerId);
        setIsConnected(true);
        break;

      case 'TURN_TIMER_START':
        console.log('Turn timer started:', message.timeLimit);
        store.setTurnTimer(message.timeLimit);
        break;

      case 'GAME_STATE_SYNC':
        console.log('Game state sync');
        store.setMultiplayerState(message.players, message.gameState, message.localPlayerId || store.localPlayerId);
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
    } catch (error) {
      console.error('Error handling server message:', error, message);
      // Don't reset to menu on message handling errors - just log them
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
    // Clear any pending reconnection attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
    reconnectAttempts.current = 0;
    
    if (websocket) {
      websocket.close(1000, 'User disconnected'); // Normal closure
      setWebSocket(null);
    }
    setIsConnected(false);
    setMultiplayerMode('local', null, false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
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
    removePlayer,
    startGame,
    disconnect
  };
}
