// Helper functions for card validation
import type { Card, Player, Suit, TrickPlay } from '@shared/types';

export function canPlayerSit(player: Player, bid: number, trumpSuit: string | null): boolean {
  // Cannot sit if bid is 1
  if (bid === 1) return false;
  
  // Cannot sit if trump is spades
  if (trumpSuit === 'spades') return false;
  
  // Cannot sit if already musty (2 consecutive sits)
  if (player.consecutiveSits >= 2) return false;
  
  return true;
}

export function isValidPlay(card: Card, hand: Card[], currentTrick: { playerId: string; card: Card }[], trumpSuit: string | null): boolean {
  if (!hand.some(c => c.suit === card.suit && c.value === card.value)) {
    return false;
  }
  
  if (currentTrick.length === 0) {
    return true;
  }
  
  const leadSuit = currentTrick[0].card.suit;
  const hasLeadSuit = hand.some(c => c.suit === leadSuit);
  
  if (hasLeadSuit && card.suit !== leadSuit) {
    return false;
  }
  
  return true;
}

export function getPlayableCards(hand: Card[], currentTrick: { playerId: string; card: Card }[], trumpSuit: string | null): Card[] {
  if (currentTrick.length === 0) {
    return hand;
  }
  
  const leadSuit = currentTrick[0].card.suit;
  const cardsOfLeadSuit = hand.filter(c => c.suit === leadSuit);
  
  if (cardsOfLeadSuit.length > 0) {
    return cardsOfLeadSuit;
  }
  
  return hand;
}
