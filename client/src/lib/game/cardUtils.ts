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
  
  // Validate deck has exactly 52 unique cards
  if (deck.length !== 52) {
    console.error('❌ DECK ERROR: Deck has', deck.length, 'cards instead of 52!');
  }
  
  const uniqueCards = new Set(deck.map(c => `${c.rank}${c.suit}`));
  if (uniqueCards.size !== 52) {
    console.error('❌ DECK ERROR: Deck has duplicate cards!', deck.length - uniqueCards.size, 'duplicates found');
    console.error('Deck:', deck.map(c => `${c.rank}${c.suit}`).sort());
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

export function sortHandBySuit(hand: Card[]): Card[] {
  const suitOrder = { 'spades': 0, 'hearts': 1, 'diamonds': 2, 'clubs': 3 };
  
  return [...hand].sort((a, b) => {
    // First sort by suit
    const suitDiff = suitOrder[a.suit] - suitOrder[b.suit];
    if (suitDiff !== 0) return suitDiff;
    
    // Then by value (high to low within same suit)
    return b.value - a.value;
  });
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
  
  // Validate: Check for duplicate cards across all hands
  const allDealtCards: string[] = [];
  hands.forEach((hand, playerIndex) => {
    hand.forEach(card => {
      const cardId = `${card.rank}${card.suit}`;
      if (allDealtCards.includes(cardId)) {
        console.error(`❌ DEAL ERROR: Duplicate card ${cardId} found in player ${playerIndex}'s hand!`);
        console.error('All dealt cards:', allDealtCards);
        console.error('Current hand:', hand.map(c => `${c.rank}${c.suit}`));
      }
      allDealtCards.push(cardId);
    });
  });
  
  // Sort each hand by suit
  return hands.map(hand => sortHandBySuit(hand));
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
