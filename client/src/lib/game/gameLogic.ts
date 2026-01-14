import { Card } from './cardUtils';

export interface PlayerAvatar {
  color: string;
  icon: string;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  isActive: boolean;
  consecutiveSits: number;
  isAI: boolean;
  avatar?: PlayerAvatar;
  wallet?: number;
  punts?: number; // Track total punts across game
  isConnected?: boolean; // Track if player is connected in multiplayer
}

export type GamePhase = 'setup' | 'bidding' | 'trump_selection' | 'sit_pass' | 'everyone_sat' | 'hand_play' | 'trick_complete' | 'round_complete' | 'game_over';

export interface RoundHistory {
  round: number;
  bids: Map<string, number>;
  trumpSuit: string | null;
  highestBidder: string | null;
  playingPlayers: string[];
  tricksWon: Map<string, number>;
  scoreChanges: Map<string, number>;
  finalScores: Map<string, number>;
  punts?: Map<string, number>; // Track who punted this round
  moneyChanges?: Map<string, number>;
  finalWallets?: Map<string, number>;
}

export interface GameState {
  gamePhase: GamePhase;
  players: Player[];
  eliminatedPlayers: Player[]; // Players removed from game (score > 32) but tracked for final scoreboard
  currentPlayerIndex: number;
  dealerIndex: number;
  deck: Card[];
  currentTrick: { playerId: string; card: Card }[];
  completedTricks: { playerId: string; card: Card }[][];
  bids: Map<string, number>;
  trumpSuit: string | null;
  highestBidder: string | null;
  playingPlayers: Set<string>;
  mustyPlayers: Set<string>;
  scores: Map<string, number>;
  round: number;
  history: RoundHistory[];
  lastTrickWinner: string | null;
}

export function calculateScore(
  playerId: string,
  bid: number,
  tricksWon: number,
  currentScore: number,
  isHighestBidder: boolean = false
): number {
  if (bid === 0) {
    // Punted (bid 0): +5 if no tricks, -1 per trick if any
    return currentScore + (tricksWon === 0 ? 5 : -tricksWon);
  } else if (isHighestBidder) {
    // Highest bidder: must meet their bid or it's a punt
    if (tricksWon >= bid) {
      // Made the bid: -1 per trick won
      return currentScore - tricksWon;
    } else {
      // Didn't make the bid: +5 punt
      return currentScore + 5;
    }
  } else {
    // Other players who played (not punters, not highest bidder): -1 per trick won
    return currentScore - tricksWon;
  }
}

export function calculateGameEndPayout(
  players: Player[],
  scores: Map<string, number>,
  moneyPerPoint: number = 0.25,
  moneyPerPunt: number = 1.0
): Map<string, number> {
  // Money changes at game end: configurable per point + per punt
  const moneyChanges = new Map<string, number>();
  
  // Find the winner (score <= 0)
  const winner = players.find(p => (scores.get(p.id) || 16) <= 0);
  if (!winner) return moneyChanges;
  
  let totalPayout = 0;
  
  // Calculate what each loser pays
  players.forEach(player => {
    if (player.id !== winner.id) {
      const finalScore = scores.get(player.id) || 16;
      const punts = player.punts || 0;
      const amountOwed = (finalScore * moneyPerPoint) + (punts * moneyPerPunt);
      moneyChanges.set(player.id, -amountOwed);
      totalPayout += amountOwed;
    }
  });
  
  // Winner receives total payout
  moneyChanges.set(winner.id, totalPayout);
  
  return moneyChanges;
}

export function isPlayerEliminated(score: number, eliminationScore: number = 32): boolean {
  return score > eliminationScore;
}

export function hasPlayerWon(score: number, winningScore: number = 0): boolean {
  return score <= winningScore;
}

export function getNextActivePlayer(
  currentIndex: number,
  players: Player[],
  playingPlayers?: Set<string>
): number {
  let nextIndex = (currentIndex + 1) % players.length;
  
  while (
    nextIndex !== currentIndex && 
    (!players[nextIndex].isActive || 
     (playingPlayers && !playingPlayers.has(players[nextIndex].id)))
  ) {
    nextIndex = (nextIndex + 1) % players.length;
  }
  
  return nextIndex;
}

export function canPlayerSit(player: Player, bid: number, trumpSuit: string | null): boolean {
  // Cannot sit if bid is 1
  if (bid === 1) return false;
  
  // Cannot sit if trump is spades
  if (trumpSuit === 'spades') return false;
  
  // Cannot sit if already musty (2 consecutive sits)
  if (player.consecutiveSits >= 2) return false;
  
  return true;
}

export function validateBid(bid: number, currentHighestBid: number, isDealer: boolean): boolean {
  // Bid must be 0 (pass) or between 1-5
  if (bid < 0 || bid > 5) return false;
  
  // If someone has already bid 2+, must bid higher or pass
  if (currentHighestBid >= 2 && bid !== 0 && bid <= currentHighestBid) {
    return false;
  }
  
  // Dealer gets last chance to bid higher
  if (isDealer && bid !== 0 && bid <= currentHighestBid) {
    return false;
  }
  
  return true;
}
