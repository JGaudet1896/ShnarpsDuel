import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@fontsource/inter";
import "./index.css";

import GameBoard from "./components/game/GameBoard";
import GameUI from "./components/game/GameUI";
import { useShnarps } from "./lib/stores/useShnarps";
import { useAIPlayer } from "./lib/hooks/useAIPlayer";

const queryClient = new QueryClient();

function App() {
  const { initializeGame, gamePhase, players } = useShnarps();
  useAIPlayer(); // Enable AI player automation

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    console.log('Game Phase:', gamePhase);
    console.log('Players:', players.length);
  }, [gamePhase, players]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-screen h-screen bg-gradient-to-br from-green-800 to-green-900 overflow-hidden">
        <GameBoard />
        <GameUI />
      </div>
    </QueryClientProvider>
  );
}

export default App;
