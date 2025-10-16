import { Card } from './cardUtils';
import { Player } from './gameLogic';

// Evaluate hand strength (0-5 scale)
export function evaluateHandStrength(hand: Card[], trumpSuit: string | null): number {
  let strength = 0;
  
  // Count high cards
  for (const card of hand) {
    if (card.value >= 12) { // J, Q, K, A
      strength += (card.suit === trumpSuit ? 1.5 : 1);
    } else if (card.value >= 10) {
      strength += (card.suit === trumpSuit ? 1 : 0.5);
    }
  }
  
  // Bonus for trump cards
  if (trumpSuit) {
    const trumpCount = hand.filter(c => c.suit === trumpSuit).length;
    strength += trumpCount * 0.5;
  }
  
  return Math.min(5, Math.floor(strength));
}

// AI bidding strategy
export function makeAIBid(
  hand: Card[], 
  currentHighestBid: number,
  isDealer: boolean
): number {
  // Evaluate hand without knowing trump yet
  const avgStrength = (
    evaluateHandStrength(hand, 'hearts') +
    evaluateHandStrength(hand, 'diamonds') +
    evaluateHandStrength(hand, 'clubs') +
    evaluateHandStrength(hand, 'spades')
  ) / 4;
  
  const bid = Math.floor(avgStrength);
  
  // Only bid if we can beat current highest or if we're confident
  if (bid > currentHighestBid || (isDealer && bid === currentHighestBid + 1)) {
    return bid;
  }
  
  // Small chance to bluff
  if (Math.random() < 0.15 && currentHighestBid < 3) {
    return currentHighestBid + 1;
  }
  
  return 0; // Pass
}

// AI trump suit selection
export function chooseAITrumpSuit(hand: Card[]): string {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
  let bestSuit = suits[0];
  let bestStrength = 0;
  
  for (const suit of suits) {
    const strength = evaluateHandStrength(hand, suit);
    if (strength > bestStrength) {
      bestStrength = strength;
      bestSuit = suit;
    }
  }
  
  return bestSuit;
}

// AI sit/play decision
export function makeAISitPlayDecision(
  player: Player,
  hand: Card[],
  trumpSuit: string | null,
  highestBid: number,
  canSit: boolean,
  currentScore?: number
): 'sit' | 'play' {
  if (!canSit) return 'play';
  
  const handStrength = evaluateHandStrength(hand, trumpSuit);
  
  // If at 4 or lower, avoid sitting (sitting gives +1 penalty)
  // Only sit if hand is really terrible (strength 0)
  if (currentScore !== undefined && currentScore <= 4) {
    if (handStrength === 0 && player.consecutiveSits === 0) {
      return 'sit'; // Only sit with worst hand possible
    }
    return 'play';
  }
  
  // Play if hand is decent
  if (handStrength >= 2) return 'play';
  
  // Avoid becoming musty
  if (player.consecutiveSits >= 1) return 'play';
  
  // Sit if hand is weak
  return 'sit';
}

// AI card play selection
export function chooseAICardToPlay(
  hand: Card[],
  currentTrick: { playerId: string; card: Card }[],
  trumpSuit: string | null,
  playableCards: Card[]
): Card {
  if (playableCards.length === 0) return hand[0];
  if (playableCards.length === 1) return playableCards[0];
  
  // If leading, play highest card
  if (currentTrick.length === 0) {
    return playableCards.reduce((highest, card) => 
      card.value > highest.value ? card : highest
    );
  }
  
  const leadSuit = currentTrick[0].card.suit;
  const highestCardInTrick = currentTrick.reduce((highest, play) => 
    play.card.value > highest.card.value ? play : highest
  );
  
  // Try to win the trick
  const winningCards = playableCards.filter(card => {
    // Trump beats non-trump
    if (trumpSuit && card.suit === trumpSuit && highestCardInTrick.card.suit !== trumpSuit) {
      return true;
    }
    // Higher trump beats lower trump
    if (trumpSuit && card.suit === trumpSuit && highestCardInTrick.card.suit === trumpSuit) {
      return card.value > highestCardInTrick.card.value;
    }
    // Higher card of lead suit
    if (card.suit === leadSuit && highestCardInTrick.card.suit === leadSuit) {
      return card.value > highestCardInTrick.card.value;
    }
    return false;
  });
  
  // If we can win, play the lowest winning card
  if (winningCards.length > 0) {
    return winningCards.reduce((lowest, card) => 
      card.value < lowest.value ? card : lowest
    );
  }
  
  // If we can't win, play the lowest card
  return playableCards.reduce((lowest, card) => 
    card.value < lowest.value ? card : lowest
  );
}
