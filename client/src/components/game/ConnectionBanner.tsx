import { useEffect, useState } from 'react';
import { useMultiplayer } from '../../lib/hooks/useMultiplayer';
import { useShnarps } from '../../lib/stores/useShnarps';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

export function ConnectionBanner() {
  const { isConnected, mode } = useMultiplayer();
  const { multiplayerMode, websocket } = useShnarps();
  const [showBanner, setShowBanner] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    // Only show banner in online mode
    if (multiplayerMode !== 'online') {
      setShowBanner(false);
      return;
    }

    // Check websocket state
    const wsConnected = websocket && websocket.readyState === WebSocket.OPEN;

    if (!wsConnected && multiplayerMode === 'online') {
      setShowBanner(true);
      setIsReconnecting(true);
    } else if (wsConnected) {
      // Show "Connected!" briefly then hide
      if (showBanner) {
        setIsReconnecting(false);
        setTimeout(() => setShowBanner(false), 2000);
      }
    }
  }, [isConnected, multiplayerMode, websocket, showBanner]);

  // Monitor websocket state changes
  useEffect(() => {
    if (!websocket || multiplayerMode !== 'online') return;

    const checkConnection = () => {
      if (websocket.readyState !== WebSocket.OPEN) {
        setShowBanner(true);
        setIsReconnecting(true);
      }
    };

    // Check periodically
    const interval = setInterval(checkConnection, 1000);

    return () => clearInterval(interval);
  }, [websocket, multiplayerMode]);

  if (!showBanner) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] px-4 py-2 text-center text-sm font-medium transition-all duration-300 ${
        isReconnecting
          ? 'bg-yellow-500 text-yellow-900'
          : 'bg-green-500 text-white'
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center justify-center gap-2">
        {isReconnecting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <WifiOff className="h-4 w-4" />
            <span>Connection lost. Reconnecting...</span>
          </>
        ) : (
          <>
            <Wifi className="h-4 w-4" />
            <span>Connected!</span>
          </>
        )}
      </div>
    </div>
  );
}
