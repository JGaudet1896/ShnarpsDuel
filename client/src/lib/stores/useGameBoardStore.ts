import { create } from 'zustand';
import { Card } from '../game/cardUtils';

interface GameBoardState {
  selectedCard: Card | null;
  setSelectedCard: (card: Card | null) => void;
}

export const useGameBoardStore = create<GameBoardState>((set) => ({
  selectedCard: null,
  setSelectedCard: (card) => set({ selectedCard: card }),
}));
