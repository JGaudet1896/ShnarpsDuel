import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@fontsource/inter";
import "./index.css";

import GameBoard from "./components/game/GameBoard";
import GameUI from "./components/game/GameUI";
import { useShnarps } from "./lib/stores/useShnarps";

const queryClient = new QueryClient();

function App() {
  const { initializeGame } = useShnarps();

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

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
