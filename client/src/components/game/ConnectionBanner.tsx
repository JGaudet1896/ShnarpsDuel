import { useEffect, useState } from 'react';
import { useMultiplayer } from '../../lib/hooks/useMultiplayer';
import { useShnarps } from '../../lib/stores/useShnarps';
import { Wifi, WifiOff, Loader2, Users, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ConnectionBanner() {
  const { isConnected, mode } = useMultiplayer();
  const { multiplayerMode, websocket, players, multiplayerRoomCode } = useShnarps();
  const [showBanner, setShowBanner] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  useEffect(() => {
    // Only show banner in online mode
    if (multiplayerMode !== 'online') {
      setShowBanner(false);
      setShowSuccessBanner(false);
      return;
    }

    // Check websocket state
    const wsConnected = websocket && websocket.readyState === WebSocket.OPEN;

    if (!wsConnected && multiplayerMode === 'online') {
      setShowBanner(true);
      setShowSuccessBanner(false);
      setIsReconnecting(true);
    } else if (wsConnected) {
      // Show "Connected!" briefly then hide
      if (showBanner || isReconnecting) {
        setIsReconnecting(false);
        setShowSuccessBanner(true);
        setShowBanner(false);
        setTimeout(() => setShowSuccessBanner(false), 3000);
      }
    }
  }, [isConnected, multiplayerMode, websocket, showBanner, isReconnecting]);

  // Monitor websocket state changes
  useEffect(() => {
    if (!websocket || multiplayerMode !== 'online') return;

    const checkConnection = () => {
      if (websocket.readyState !== WebSocket.OPEN) {
        setShowBanner(true);
        setShowSuccessBanner(false);
        setIsReconnecting(true);
      }
    };

    // Check periodically
    const interval = setInterval(checkConnection, 1000);

    return () => clearInterval(interval);
  }, [websocket, multiplayerMode]);

  // Count connected human players
  const humanPlayers = players.filter(p => !p.isAI);
  const connectedPlayers = humanPlayers.filter(p => p.isConnected !== false);

  return (
    <>
      {/* Disconnection Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[9999] px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg"
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <WifiOff className="h-5 w-5" />
              <span className="font-medium">Connection lost. Reconnecting...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Banner */}
      <AnimatePresence>
        {showSuccessBanner && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[9999] px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-center justify-center gap-3">
              <Wifi className="h-5 w-5" />
              <span className="font-medium">Connected!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Online Status Indicator */}
      {multiplayerMode === 'online' && !showBanner && !showSuccessBanner && (
        <div className="fixed top-3 right-3 z-50">
          <div className="bg-gray-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 border border-gray-700">
            <Globe className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-xs text-gray-300 font-medium">{multiplayerRoomCode}</span>
            <div className="w-px h-3 bg-gray-600" />
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${
                websocket?.readyState === WebSocket.OPEN ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
              }`} />
              <Users className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs text-gray-300">{connectedPlayers.length}/{humanPlayers.length}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
