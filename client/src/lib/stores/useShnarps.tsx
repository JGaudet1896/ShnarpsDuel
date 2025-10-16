import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { Card, GamePhase, Player, GameState } from "../game/gameLogic";
import { createDeck, shuffleDeck, dealCards } from "../game/cardUtils";

interface ShnarpsState extends GameState {
  // Actions
  initializeGame: () => void;
  joinGame: (playerName: string) => void;
  startGame: () => void;
  placeBid: (playerId: string, bid: number) => void;
  chooseTrumpSuit: (suit: string) => void;
  chooseSitOrPlay: (playerId: string, decision: 'sit' | 'play') => void;
  playCard: (playerId: string, card: Card) => void;
  nextTrick: () => void;
  resetGame: () => void;
}

export const useShnarps = create<ShnarpsState>()(
  subscribeWithSelector((set, get) => ({
    // Initial game state
    gamePhase: 'setup' as GamePhase,
    players: [],
    currentPlayerIndex: 0,
    dealerIndex: 0,
    deck: [],
    currentTrick: [],
    completedTricks: [],
    bids: new Map(),
    trumpSuit: null,
    highestBidder: null,
    playingPlayers: new Set(),
    mustyPlayers: new Set(),
    scores: new Map(),
    round: 1,
    
    initializeGame: () => {
      const deck = shuffleDeck(createDeck());
      set({
        gamePhase: 'setup',
        players: [],
        currentPlayerIndex: 0,
        dealerIndex: 0,
        deck,
        currentTrick: [],
        completedTricks: [],
        bids: new Map(),
        trumpSuit: null,
        highestBidder: null,
        playingPlayers: new Set(),
        mustyPlayers: new Set(),
        scores: new Map(),
        round: 1,
      });
    },

    joinGame: (playerName: string) => {
      const state = get();
      if (state.players.length >= 8 || state.gamePhase !== 'setup') return;
      
      const newPlayer: Player = {
        id: `player_${Date.now()}_${Math.random()}`,
        name: playerName,
        hand: [],
        isActive: true,
        consecutiveSits: 0
      };
      
      const newScores = new Map(state.scores);
      newScores.set(newPlayer.id, 16); // Starting points
      
      set({
        players: [...state.players, newPlayer],
        scores: newScores
      });
    },

    startGame: () => {
      const state = get();
      if (state.players.length < 4) return;
      
      // Deal cards to all players
      const shuffledDeck = shuffleDeck(createDeck());
      const dealtCards = dealCards(shuffledDeck, state.players.length);
      
      const updatedPlayers = state.players.map((player, index) => ({
        ...player,
        hand: dealtCards[index] || []
      }));
      
      set({
        gamePhase: 'bidding',
        players: updatedPlayers,
        deck: shuffledDeck.slice(state.players.length * 5), // Remaining cards
        currentPlayerIndex: (state.dealerIndex + 1) % state.players.length,
        bids: new Map(),
        trumpSuit: null,
        highestBidder: null,
      });
    },

    placeBid: (playerId: string, bid: number) => {
      const state = get();
      if (state.gamePhase !== 'bidding') return;
      
      const currentPlayer = state.players[state.currentPlayerIndex];
      if (currentPlayer.id !== playerId) return;
      
      const newBids = new Map(state.bids);
      newBids.set(playerId, bid);
      
      // Find highest bid and bidder
      let highestBid = 0;
      let highestBidder = null;
      for (const [id, playerBid] of newBids) {
        if (playerBid > highestBid) {
          highestBid = playerBid;
          highestBidder = id;
        }
      }
      
      // Move to next player
      let nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
      
      // Check if bidding is complete (all players have bid)
      const allPlayersBid = state.players.every(player => newBids.has(player.id));
      
      if (allPlayersBid) {
        if (highestBidder) {
          // Move to trump selection if someone bid > 0
          set({
            bids: newBids,
            highestBidder,
            gamePhase: 'trump_selection',
            currentPlayerIndex: state.players.findIndex(p => p.id === highestBidder)
          });
        } else {
          // All players passed, reshuffle and deal again
          const shuffledDeck = shuffleDeck(createDeck());
          const dealtCards = dealCards(shuffledDeck, state.players.length);
          
          const updatedPlayers = state.players.map((player, index) => ({
            ...player,
            hand: dealtCards[index] || []
          }));
          
          set({
            players: updatedPlayers,
            deck: shuffledDeck.slice(state.players.length * 5),
            bids: new Map(),
            currentPlayerIndex: (state.dealerIndex + 1) % state.players.length
          });
        }
      } else {
        set({
          bids: newBids,
          currentPlayerIndex: nextPlayerIndex,
          highestBidder
        });
      }
    },

    chooseTrumpSuit: (suit: string) => {
      const state = get();
      if (state.gamePhase !== 'trump_selection') return;
      
      set({
        trumpSuit: suit,
        gamePhase: 'sit_pass',
        currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
        playingPlayers: new Set()
      });
    },

    chooseSitOrPlay: (playerId: string, decision: 'sit' | 'play') => {
      const state = get();
      if (state.gamePhase !== 'sit_pass') return;
      
      const currentPlayer = state.players[state.currentPlayerIndex];
      if (currentPlayer.id !== playerId) return;
      
      const newPlayingPlayers = new Set(state.playingPlayers);
      const newMustyPlayers = new Set(state.mustyPlayers);
      const updatedPlayers = [...state.players];
      
      const playerIndex = state.players.findIndex(p => p.id === playerId);
      
      if (decision === 'play') {
        newPlayingPlayers.add(playerId);
        updatedPlayers[playerIndex].consecutiveSits = 0;
      } else {
        updatedPlayers[playerIndex].consecutiveSits += 1;
        if (updatedPlayers[playerIndex].consecutiveSits >= 2) {
          newMustyPlayers.add(playerId);
        }
      }
      
      // Check if all players have decided
      let nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
      const allPlayersDecided = state.players.every(player => 
        newPlayingPlayers.has(player.id) || 
        (!newPlayingPlayers.has(player.id) && player.id !== playerId)
      );
      
      if (allPlayersDecided || nextPlayerIndex === ((state.currentPlayerIndex + 1) % state.players.length)) {
        // Start hand play phase
        set({
          playingPlayers: newPlayingPlayers,
          mustyPlayers: newMustyPlayers,
          players: updatedPlayers,
          gamePhase: 'hand_play',
          currentPlayerIndex: (state.dealerIndex + 1) % state.players.length,
          currentTrick: []
        });
      } else {
        set({
          playingPlayers: newPlayingPlayers,
          mustyPlayers: newMustyPlayers,
          players: updatedPlayers,
          currentPlayerIndex: nextPlayerIndex
        });
      }
    },

    playCard: (playerId: string, card: Card) => {
      const state = get();
      if (state.gamePhase !== 'hand_play') return;
      
      const currentPlayer = state.players[state.currentPlayerIndex];
      if (currentPlayer.id !== playerId || !state.playingPlayers.has(playerId)) return;
      
      // Remove card from player's hand
      const updatedPlayers = state.players.map(player => 
        player.id === playerId 
          ? { ...player, hand: player.hand.filter(c => c.suit !== card.suit || c.rank !== card.rank) }
          : player
      );
      
      const newTrick = [...state.currentTrick, { playerId, card }];
      
      // Check if trick is complete (all playing players have played)
      const playingPlayersList = Array.from(state.playingPlayers);
      if (newTrick.length === playingPlayersList.length) {
        // Determine trick winner and move to next trick
        set({
          players: updatedPlayers,
          currentTrick: newTrick,
          completedTricks: [...state.completedTricks, newTrick]
        });
      } else {
        // Move to next playing player
        let nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
        while (!state.playingPlayers.has(state.players[nextPlayerIndex].id)) {
          nextPlayerIndex = (nextPlayerIndex + 1) % state.players.length;
        }
        
        set({
          players: updatedPlayers,
          currentTrick: newTrick,
          currentPlayerIndex: nextPlayerIndex
        });
      }
    },

    nextTrick: () => {
      const state = get();
      
      // Check if hand is complete (all 5 tricks played)
      if (state.completedTricks.length === 5) {
        // Calculate scores and move to next round or end game
        const newScores = new Map(state.scores);
        
        // Update scores based on tricks won and bids
        for (const playerId of state.playingPlayers) {
          const tricksWon = state.completedTricks.filter(trick => {
            // Determine winner of each trick (simplified logic)
            return trick[0]?.playerId === playerId; // Placeholder logic
          }).length;
          
          const bid = state.bids.get(playerId) || 0;
          const currentScore = newScores.get(playerId) || 16;
          
          if (bid === 0) {
            // Punt: +5 points if no tricks taken, -1 per trick if any taken
            const scoreChange = tricksWon === 0 ? 5 : -tricksWon;
            newScores.set(playerId, currentScore + scoreChange);
          } else {
            // Regular bid: -1 per trick won
            newScores.set(playerId, currentScore - tricksWon);
          }
        }
        
        // Check for eliminated players (score > 32) and winners (score <= 0)
        const activePlayers = state.players.filter(player => {
          const score = newScores.get(player.id) || 16;
          return score <= 32 && score > 0;
        });
        
        if (activePlayers.length <= 1) {
          set({
            gamePhase: 'game_over',
            scores: newScores
          });
        } else {
          // Start next round
          const nextDealerIndex = (state.dealerIndex + 1) % activePlayers.length;
          const shuffledDeck = shuffleDeck(createDeck());
          const dealtCards = dealCards(shuffledDeck, activePlayers.length);
          
          const updatedPlayers = activePlayers.map((player, index) => ({
            ...player,
            hand: dealtCards[index] || [],
            isActive: true
          }));
          
          set({
            gamePhase: 'bidding',
            players: updatedPlayers,
            dealerIndex: nextDealerIndex,
            currentPlayerIndex: (nextDealerIndex + 1) % updatedPlayers.length,
            deck: shuffledDeck.slice(updatedPlayers.length * 5),
            currentTrick: [],
            completedTricks: [],
            bids: new Map(),
            trumpSuit: null,
            highestBidder: null,
            playingPlayers: new Set(),
            scores: newScores,
            round: state.round + 1
          });
        }
      } else {
        // Continue with next trick
        set({
          currentTrick: [],
          currentPlayerIndex: (state.dealerIndex + 1) % state.players.length
        });
      }
    },

    resetGame: () => {
      get().initializeGame();
    }
  }))
);
