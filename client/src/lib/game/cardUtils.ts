export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';
  value: number; // For comparison (A=14, K=13, etc.)
}

export function createDeck(): Card[] {
  const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Card['rank'][] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
  const values = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
  
  const deck: Card[] = [];
  
  for (const suit of suits) {
    for (let i = 0; i < ranks.length; i++) {
      deck.push({
        suit,
        rank: ranks[i],
        value: values[i]
      });
    }
  }
  
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(deck: Card[], numPlayers: number): Card[][] {
  const hands: Card[][] = Array.from({ length: numPlayers }, () => []);
  
  // Deal 5 cards to each player
  for (let cardIndex = 0; cardIndex < 5; cardIndex++) {
    for (let playerIndex = 0; playerIndex < numPlayers; playerIndex++) {
      const cardPosition = cardIndex * numPlayers + playerIndex;
      if (cardPosition < deck.length) {
        hands[playerIndex].push(deck[cardPosition]);
      }
    }
  }
  
  return hands;
}

export function getSuitColor(suit: Card['suit']): string {
  return suit === 'hearts' || suit === 'diamonds' ? '#dc2626' : '#1f2937';
}

export function getSuitSymbol(suit: Card['suit']): string {
  switch (suit) {
    case 'hearts': return '♥';
    case 'diamonds': return '♦';
    case 'clubs': return '♣';
    case 'spades': return '♠';
    default: return '';
  }
}

export function isValidPlay(
  card: Card,
  hand: Card[],
  currentTrick: { playerId: string; card: Card }[],
  trumpSuit: string | null
): boolean {
  // If first card of trick, any card is valid
  if (currentTrick.length === 0) return true;
  
  const leadCard = currentTrick[0].card;
  const leadSuit = leadCard.suit;
  
  // Must follow suit if possible
  const hasSuit = hand.some(c => c.suit === leadSuit);
  if (hasSuit && card.suit !== leadSuit) return false;
  
  return true;
}

export function determineTrickWinner(
  trick: { playerId: string; card: Card }[],
  trumpSuit: string | null
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
    // Higher card of lead suit beats lower (if no trump involved)
    else if (card.suit === leadSuit && winner.card.suit === leadSuit && (!trumpSuit || winner.card.suit !== trumpSuit)) {
      if (card.value > winner.card.value) {
        winner = play;
      }
    }
  }
  
  return winner.playerId;
}
