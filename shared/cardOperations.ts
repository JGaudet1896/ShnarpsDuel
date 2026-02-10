/**
 * Card Operations for ShnarpsDuel
 * Single source of truth for deck creation, shuffling, dealing, and trick evaluation
 */

import type { Card, Suit, Rank, TrickPlay } from './types';
import { RANKS, SUITS } from './types';
import { RANK_VALUES, SUIT_ORDER, GAME } from './constants';

// =============================================================================
// DECK CREATION
// =============================================================================

/**
 * Create a standard 52-card deck
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        suit,
        rank,
        value: RANK_VALUES[rank],
      });
    }
  }

  // Validate deck
  if (deck.length !== 52) {
    console.error(`DECK ERROR: Created deck has ${deck.length} cards instead of 52`);
  }

  return deck;
}

/**
 * Shuffle a deck using Fisher-Yates algorithm
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Deal cards to players
 * @param deck The deck to deal from
 * @param numPlayers Number of players
 * @param cardsPerPlayer Cards to deal to each player (default: 5)
 * @returns Array of hands, one per player
 */
export function dealCards(
  deck: Card[],
  numPlayers: number,
  cardsPerPlayer: number = GAME.CARDS_PER_HAND
): Card[][] {
  const hands: Card[][] = Array.from({ length: numPlayers }, () => []);

  // Deal cards one at a time to each player (like real dealing)
  for (let cardIndex = 0; cardIndex < cardsPerPlayer; cardIndex++) {
    for (let playerIndex = 0; playerIndex < numPlayers; playerIndex++) {
      const deckPosition = cardIndex * numPlayers + playerIndex;
      if (deckPosition < deck.length) {
        hands[playerIndex].push(deck[deckPosition]);
      }
    }
  }

  // Validate no duplicates
  const allCards: string[] = [];
  hands.forEach((hand, idx) => {
    hand.forEach(card => {
      const cardId = `${card.rank}${card.suit}`;
      if (allCards.includes(cardId)) {
        console.error(`DEAL ERROR: Duplicate card ${cardId} in player ${idx}'s hand`);
      }
      allCards.push(cardId);
    });
  });

  // Sort each hand by suit then by value
  return hands.map(hand => sortHandBySuit(hand));
}

// =============================================================================
// CARD SORTING & COMPARISON
// =============================================================================

/**
 * Sort a hand by suit (spades, hearts, diamonds, clubs) then by value (high to low)
 */
export function sortHandBySuit(hand: Card[]): Card[] {
  return [...hand].sort((a, b) => {
    // First sort by suit
    const suitDiff = SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
    if (suitDiff !== 0) return suitDiff;

    // Then by value (high to low within same suit)
    return b.value - a.value;
  });
}

/**
 * Compare two cards for sorting/ranking
 * Returns negative if a < b, positive if a > b, 0 if equal
 */
export function compareCards(a: Card, b: Card, trumpSuit: Suit | null = null): number {
  // Trump beats non-trump
  if (trumpSuit) {
    if (a.suit === trumpSuit && b.suit !== trumpSuit) return 1;
    if (b.suit === trumpSuit && a.suit !== trumpSuit) return -1;
  }

  // Same suit: compare by value
  if (a.suit === b.suit) {
    return a.value - b.value;
  }

  // Different suits (neither is trump): consider equal for trick purposes
  return 0;
}

// =============================================================================
// TRICK EVALUATION
// =============================================================================

/**
 * Determine the winner of a trick
 * @param trick Array of plays in the trick
 * @param trumpSuit The trump suit for this round
 * @returns The playerId of the winner
 */
export function determineTrickWinner(
  trick: TrickPlay[],
  trumpSuit: Suit | null
): string {
  if (trick.length === 0) return '';

  const leadSuit = trick[0].card.suit;
  let winner = trick[0];

  for (const play of trick) {
    const { card } = play;

    // Trump beats non-trump
    if (trumpSuit && card.suit === trumpSuit && winner.card.suit !== trumpSuit) {
      winner = play;
    }
    // Higher trump beats lower trump
    else if (trumpSuit && card.suit === trumpSuit && winner.card.suit === trumpSuit) {
      if (card.value > winner.card.value) {
        winner = play;
      }
    }
    // Higher card of lead suit beats lower (only if winner isn't trump)
    else if (
      card.suit === leadSuit &&
      winner.card.suit === leadSuit &&
      (!trumpSuit || winner.card.suit !== trumpSuit)
    ) {
      if (card.value > winner.card.value) {
        winner = play;
      }
    }
    // Cards not following suit and not trump don't beat anything
  }

  return winner.playerId;
}

/**
 * Get the lead suit from a trick
 */
export function getLeadSuit(trick: TrickPlay[]): Suit | null {
  if (trick.length === 0) return null;
  return trick[0].card.suit;
}

// =============================================================================
// PLAY VALIDATION
// =============================================================================

/**
 * Check if a card play is valid (follows suit rules)
 */
export function isValidPlay(
  card: Card,
  hand: Card[],
  currentTrick: TrickPlay[],
  trumpSuit: Suit | null
): boolean {
  // If first card of trick, any card is valid
  if (currentTrick.length === 0) return true;

  const leadSuit = currentTrick[0].card.suit;

  // Must follow suit if possible
  const hasSuit = hand.some(c => c.suit === leadSuit);
  if (hasSuit && card.suit !== leadSuit) return false;

  return true;
}

/**
 * Check if a card exists in a hand
 */
export function cardInHand(card: Card, hand: Card[]): boolean {
  return hand.some(c => c.suit === card.suit && c.rank === card.rank);
}

/**
 * Check if a hand contains a specific suit
 */
export function hasSuit(hand: Card[], suit: Suit): boolean {
  return hand.some(c => c.suit === suit);
}

/**
 * Get all valid plays from a hand given the current trick
 */
export function getValidPlays(
  hand: Card[],
  currentTrick: TrickPlay[],
  trumpSuit: Suit | null
): Card[] {
  if (currentTrick.length === 0) {
    // Any card is valid when leading
    return [...hand];
  }

  const leadSuit = currentTrick[0].card.suit;
  const suitCards = hand.filter(c => c.suit === leadSuit);

  // Must play a card of the lead suit if possible
  if (suitCards.length > 0) {
    return suitCards;
  }

  // Otherwise any card is valid
  return [...hand];
}

// =============================================================================
// HAND EVALUATION (for AI)
// =============================================================================

/**
 * Evaluate the strength of a hand (for AI bidding)
 * Returns a score from 0-100
 */
export function evaluateHandStrength(hand: Card[], trumpSuit: Suit | null = null): number {
  let score = 0;

  for (const card of hand) {
    // Base score from card value
    let cardScore = card.value - 2; // 0-12 range

    // Bonus for trump cards
    if (trumpSuit && card.suit === trumpSuit) {
      cardScore += 5;
    }

    // Bonus for aces and kings
    if (card.rank === 'A') cardScore += 3;
    if (card.rank === 'K') cardScore += 2;

    score += cardScore;
  }

  // Normalize to 0-100
  return Math.min(100, Math.round((score / 50) * 100));
}

/**
 * Count the number of cards in each suit
 */
export function countSuits(hand: Card[]): Record<Suit, number> {
  const counts: Record<Suit, number> = {
    hearts: 0,
    diamonds: 0,
    clubs: 0,
    spades: 0,
  };

  for (const card of hand) {
    counts[card.suit]++;
  }

  return counts;
}

/**
 * Find the suit with the most cards (for AI trump selection)
 */
export function findStrongestSuit(hand: Card[]): Suit {
  const counts = countSuits(hand);
  let strongestSuit: Suit = 'spades';
  let maxCount = 0;

  for (const suit of SUITS) {
    if (counts[suit] > maxCount) {
      maxCount = counts[suit];
      strongestSuit = suit;
    }
  }

  return strongestSuit;
}

// =============================================================================
// UI HELPERS
// =============================================================================

/**
 * Get the color for a suit (red for hearts/diamonds, black for clubs/spades)
 */
export function getSuitColor(suit: Suit): string {
  return suit === 'hearts' || suit === 'diamonds' ? '#dc2626' : '#1f2937';
}

/**
 * Get the symbol for a suit
 */
export function getSuitSymbol(suit: Suit): string {
  switch (suit) {
    case 'hearts': return '\u2665';   // ♥
    case 'diamonds': return '\u2666'; // ♦
    case 'clubs': return '\u2663';    // ♣
    case 'spades': return '\u2660';   // ♠
  }
}

/**
 * Format a card for display (e.g., "A♠", "10♥")
 */
export function formatCard(card: Card): string {
  return `${card.rank}${getSuitSymbol(card.suit)}`;
}
