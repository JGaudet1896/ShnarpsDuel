import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { Card, GamePhase, Player, GameState, RoundHistory } from "../game/gameLogic";
import { createDeck, shuffleDeck, dealCards, determineTrickWinner } from "../game/cardUtils";

interface ShnarpsState extends GameState {
  localPlayerId: string | null;
  // Actions
  initializeGame: () => void;
  joinGame: (playerName: string) => void;
  addAIPlayer: () => void;
  startGame: () => void;
  placeBid: (playerId: string, bid: number) => void;
  chooseTrumpSuit: (suit: string) => void;
  chooseSitOrPlay: (playerId: string, decision: 'sit' | 'play') => void;
  choosePenalty: (choice: 'self' | 'others') => void;
  playCard: (playerId: string, card: Card) => void;
  nextTrick: () => void;
  resetGame: () => void;
}

export const useShnarps = create<ShnarpsState>()(
  subscribeWithSelector((set, get) => ({
    // Initial game state
    gamePhase: 'setup' as GamePhase,
    localPlayerId: null,
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
    history: [],
    
    initializeGame: () => {
      const deck = shuffleDeck(createDeck());
      set({
        gamePhase: 'setup',
        localPlayerId: null,
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
        history: [],
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
        consecutiveSits: 0,
        isAI: false
      };
      
      const newScores = new Map(state.scores);
      newScores.set(newPlayer.id, 16); // Starting points
      
      set({
        players: [...state.players, newPlayer],
        scores: newScores,
        localPlayerId: newPlayer.id // Store the local player's ID
      });
    },

    addAIPlayer: () => {
      const state = get();
      if (state.players.length >= 8 || state.gamePhase !== 'setup') return;
      
      // ECHL all-time penalty minutes leaders
      const echlPlayers = [
        'Dennis Bonvie', 'Matt Carkner', 'Garrett Burnett', 'Brad Wingfield',
        'Steve MacIntyre', 'Darren Schwartz', 'Chris Ferraro', 'Riley Cote',
        'David-Alexandre Beauregard', 'Kip Brennan', 'Bryan Helmer', 'Brent Cullaton',
        'Trevor Gallant', 'Tyler Mosienko', 'Zac Rinaldo', 'Cam Janssen',
        'Jesse Schultz', 'Chris Durno', 'Joe Fallon', 'Jared Staal'
      ];
      
      // Pick a random name that hasn't been used
      const usedNames = state.players.map(p => p.name);
      const availableNames = echlPlayers.filter(name => !usedNames.includes(name));
      const aiName = availableNames.length > 0 
        ? availableNames[Math.floor(Math.random() * availableNames.length)]
        : `AI ${state.players.length + 1}`;
      
      const newPlayer: Player = {
        id: `ai_${Date.now()}_${Math.random()}`,
        name: aiName,
        hand: [],
        isActive: true,
        consecutiveSits: 0,
        isAI: true
      };
      
      const newScores = new Map(state.scores);
      newScores.set(newPlayer.id, 16);
      
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
      
      // Highest bidder always plays
      const playingPlayers = new Set<string>();
      if (state.highestBidder) {
        playingPlayers.add(state.highestBidder);
      }
      
      // Check if everyone must play (bid of 1 or spades trump)
      const highestBid = Math.max(0, ...Array.from(state.bids.values()));
      const everyoneMustPlay = highestBid === 1 || suit === 'spades';
      
      if (everyoneMustPlay) {
        // Everyone plays, skip sit/pass phase
        state.players.forEach(player => playingPlayers.add(player.id));
        
        // Reset sit counters for all players
        const updatedPlayers = state.players.map(player => ({
          ...player,
          consecutiveSits: 0
        }));
        
        set({
          trumpSuit: suit,
          gamePhase: 'hand_play',
          players: updatedPlayers,
          currentPlayerIndex: (state.dealerIndex + 1) % state.players.length,
          playingPlayers,
          currentTrick: []
        });
      } else {
        // Move to sit/pass phase, starting with player after highest bidder
        const highestBidderIndex = state.players.findIndex(p => p.id === state.highestBidder);
        const nextPlayerIndex = (highestBidderIndex + 1) % state.players.length;
        
        set({
          trumpSuit: suit,
          gamePhase: 'sit_pass',
          currentPlayerIndex: nextPlayerIndex,
          playingPlayers
        });
      }
    },

    choosePenalty: (choice: 'self' | 'others') => {
      const state = get();
      if (state.gamePhase !== 'everyone_sat') return;
      
      const newScores = new Map(state.scores);
      
      if (choice === 'self') {
        // Reduce bidder's score by 5
        const currentScore = newScores.get(state.highestBidder!) || 16;
        newScores.set(state.highestBidder!, currentScore - 5);
      } else {
        // Add 5 to all other players' scores
        state.players.forEach(player => {
          if (player.id !== state.highestBidder) {
            const currentScore = newScores.get(player.id) || 16;
            newScores.set(player.id, currentScore + 5);
          }
        });
      }
      
      // Save round history with penalty
      const scoreChanges = new Map<string, number>();
      if (choice === 'self') {
        scoreChanges.set(state.highestBidder!, -5);
      } else {
        state.players.forEach(player => {
          if (player.id !== state.highestBidder) {
            scoreChanges.set(player.id, 5);
          }
        });
      }
      
      const roundHistory: RoundHistory = {
        round: state.round,
        bids: new Map(state.bids),
        trumpSuit: state.trumpSuit,
        highestBidder: state.highestBidder,
        playingPlayers: Array.from(state.playingPlayers),
        tricksWon: new Map(),
        scoreChanges,
        finalScores: new Map(newScores)
      };
      
      // Check for eliminated players and winners
      const activePlayers = state.players.filter(player => {
        const score = newScores.get(player.id) || 16;
        return score <= 32 && score > 0;
      });
      
      const hasWinner = Array.from(newScores.values()).some(score => score <= 0);
      
      if (activePlayers.length <= 1 || hasWinner) {
        set({
          gamePhase: 'game_over',
          scores: newScores,
          history: [...state.history, roundHistory]
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
          // Keep consecutiveSits from previous round - only reset when player chooses to play
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
          round: state.round + 1,
          history: [...state.history, roundHistory]
        });
      }
    },

    chooseSitOrPlay: (playerId: string, decision: 'sit' | 'play') => {
      const state = get();
      if (state.gamePhase !== 'sit_pass') return;
      
      const currentPlayer = state.players[state.currentPlayerIndex];
      if (currentPlayer.id !== playerId) return;
      
      const newPlayingPlayers = new Set(state.playingPlayers);
      const updatedPlayers = [...state.players];
      
      const playerIndex = state.players.findIndex(p => p.id === playerId);
      const highestBidderIndex = state.players.findIndex(p => p.id === state.highestBidder);
      
      if (decision === 'play') {
        newPlayingPlayers.add(playerId);
        updatedPlayers[playerIndex].consecutiveSits = 0;
      } else {
        updatedPlayers[playerIndex].consecutiveSits += 1;
        
        // If player is at 4 or lower and sits, add +1 to their score
        const playerScore = state.scores.get(playerId) || 16;
        if (playerScore <= 4) {
          const newScores = new Map(state.scores);
          newScores.set(playerId, playerScore + 1);
          set({ scores: newScores });
        }
      }
      
      // Move to next player
      let nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
      
      // Check if we've gone around to the highest bidder (they were first, so we're done)
      const backToHighestBidder = nextPlayerIndex === highestBidderIndex;
      
      if (backToHighestBidder) {
        // All players have decided
        const highestBid = Math.max(0, ...Array.from(state.bids.values()));
        
        // Check if everyone except the bidder sat out
        const everyoneSatOut = newPlayingPlayers.size === 1 && 
                                state.highestBidder && 
                                newPlayingPlayers.has(state.highestBidder);
        
        // Check if the bidder can choose penalty (bid >= 2 and trump is not spades)
        const canChoosePenalty = everyoneSatOut && highestBid >= 2 && state.trumpSuit !== 'spades';
        
        if (canChoosePenalty) {
          // Move to everyone_sat phase where bidder chooses penalty
          const bidderIndex = state.players.findIndex(p => p.id === state.highestBidder);
          set({
            playingPlayers: newPlayingPlayers,
            players: updatedPlayers,
            gamePhase: 'everyone_sat',
            currentPlayerIndex: bidderIndex
          });
        } else {
          // Start hand play phase
          // First player to lead is to the left of the dealer
          let firstPlayerIndex = (state.dealerIndex + 1) % state.players.length;
          
          // Make sure the first player is actually playing
          while (!newPlayingPlayers.has(state.players[firstPlayerIndex].id)) {
            firstPlayerIndex = (firstPlayerIndex + 1) % state.players.length;
          }
          
          set({
            playingPlayers: newPlayingPlayers,
            players: updatedPlayers,
            gamePhase: 'hand_play',
            currentPlayerIndex: firstPlayerIndex,
            currentTrick: []
          });
        }
      } else {
        set({
          playingPlayers: newPlayingPlayers,
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
        // Trick is complete - determine winner
        const trickWinnerId = determineTrickWinner(newTrick, state.trumpSuit);
        const newCompletedTricks = [...state.completedTricks, newTrick];
        
        // Check if all tricks are done (5 tricks total)
        if (newCompletedTricks.length === 5) {
          // Hand is complete - move to scoring
          set({
            players: updatedPlayers,
            currentTrick: newTrick,
            completedTricks: newCompletedTricks,
            gamePhase: 'trick_complete'
          });
          
          // Auto-trigger scoring after a delay
          setTimeout(() => {
            get().nextTrick();
          }, 1500);
        } else {
          // More tricks to play - winner leads next trick
          const winnerIndex = state.players.findIndex(p => p.id === trickWinnerId);
          
          set({
            players: updatedPlayers,
            currentTrick: [],
            completedTricks: newCompletedTricks,
            currentPlayerIndex: winnerIndex,
            gamePhase: 'trick_complete'
          });
          
          // Auto-transition back to hand_play after showing the trick winner
          setTimeout(() => {
            set({ gamePhase: 'hand_play' });
          }, 1000);
        }
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
      
      // Determine winner of current trick if it's complete
      let trickWinnerId = null;
      if (state.currentTrick.length > 0) {
        trickWinnerId = determineTrickWinner(state.currentTrick, state.trumpSuit);
      }
      
      // Check if hand is complete (all 5 tricks played)
      if (state.completedTricks.length === 5) {
        // Calculate scores and move to next round or end game
        const newScores = new Map(state.scores);
        
        // Count tricks won by each player
        const tricksWonByPlayer = new Map<string, number>();
        for (const trick of state.completedTricks) {
          const winnerId = determineTrickWinner(trick, state.trumpSuit);
          tricksWonByPlayer.set(winnerId, (tricksWonByPlayer.get(winnerId) || 0) + 1);
        }
        
        // Check for "spading out" - trump is spades and bidder won all 5 tricks
        const spadingOut = state.trumpSuit === 'spades' && 
                          state.highestBidder && 
                          tricksWonByPlayer.get(state.highestBidder) === 5;
        
        // Track score changes for history
        const scoreChanges = new Map<string, number>();
        
        if (spadingOut) {
          // Spading out: instant win for the bidder
          const bidderScore = newScores.get(state.highestBidder!) || 16;
          newScores.set(state.highestBidder!, 0); // Set to winning score
          scoreChanges.set(state.highestBidder!, -bidderScore);
        } else {
          // Update scores based on tricks won and bids
          for (const playerId of state.playingPlayers) {
            const tricksWon = tricksWonByPlayer.get(playerId) || 0;
            const bid = state.bids.get(playerId) || 0;
            const currentScore = newScores.get(playerId) || 16;
            const isHighestBidder = playerId === state.highestBidder;
            
            let scoreChange = 0;
            
            // Check for punt conditions
            if (tricksWon === 0) {
              // Didn't win any tricks: punt (+5)
              scoreChange = 5;
            } else if (isHighestBidder && tricksWon < bid) {
              // Highest bidder didn't meet their bid: punt (+5)
              scoreChange = 5;
            } else {
              // Normal scoring: -1 per trick won
              scoreChange = -tricksWon;
            }
            
            scoreChanges.set(playerId, scoreChange);
            newScores.set(playerId, currentScore + scoreChange);
          }
        }
        
        // Save round history
        const roundHistory: RoundHistory = {
          round: state.round,
          bids: new Map(state.bids),
          trumpSuit: state.trumpSuit,
          highestBidder: state.highestBidder,
          playingPlayers: Array.from(state.playingPlayers),
          tricksWon: tricksWonByPlayer,
          scoreChanges,
          finalScores: new Map(newScores)
        };
        
        // Check for eliminated players (score > 32) and winners (score <= 0)
        const activePlayers = state.players.filter(player => {
          const score = newScores.get(player.id) || 16;
          return score <= 32 && score > 0;
        });
        
        // Check if game is over
        const hasWinner = Array.from(newScores.values()).some(score => score <= 0);
        
        if (activePlayers.length <= 1 || hasWinner) {
          set({
            gamePhase: 'game_over',
            scores: newScores,
            history: [...state.history, roundHistory]
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
            round: state.round + 1,
            history: [...state.history, roundHistory]
          });
        }
      } else {
        // Continue with next trick - winner of this trick leads the next
        const winnerIndex = trickWinnerId 
          ? state.players.findIndex(p => p.id === trickWinnerId)
          : (state.dealerIndex + 1) % state.players.length;
        
        // Make sure the next player to play is actually playing
        let nextPlayerIndex = winnerIndex;
        while (!state.playingPlayers.has(state.players[nextPlayerIndex].id)) {
          nextPlayerIndex = (nextPlayerIndex + 1) % state.players.length;
        }
        
        set({
          currentTrick: [],
          currentPlayerIndex: nextPlayerIndex
        });
      }
    },

    resetGame: () => {
      get().initializeGame();
    }
  }))
);
