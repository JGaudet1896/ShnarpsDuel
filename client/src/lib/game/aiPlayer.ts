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
  isDealer: boolean,
  playerCount: number,
  currentPlayerId: string,
  allScores: Map<string, number>,
  highestBidderId: string | null
): number {
  // Evaluate hand without knowing trump yet
  const avgStrength = (
    evaluateHandStrength(hand, 'hearts') +
    evaluateHandStrength(hand, 'diamonds') +
    evaluateHandStrength(hand, 'clubs') +
    evaluateHandStrength(hand, 'spades')
  ) / 4;

  // Check if opponent with current highest bid is close to winning
  const currentScore = allScores.get(currentPlayerId) || 16;
  const highestBidderScore = highestBidderId ? (allScores.get(highestBidderId) || 16) : 16;
  const someoneCloseToWinning = highestBidderScore <= 3;

  // DEFENSIVE BIDDING STRATEGY: Block players near winning from calling trump
  const canAffordPunt = currentScore >= 8; // If at 8+, a punt (+5) won't put you in danger

  if (someoneCloseToWinning && canAffordPunt) {
    // Always tries to block if possible and can afford it
    if (currentHighestBid < 5 && avgStrength >= 1.5) {
      // Overbid to prevent them from calling trump
      return Math.min(5, currentHighestBid + 1);
    }
  }

  // Adjust conservativeness based on player count
  let conservativenessAdjustment = 0;
  if (playerCount >= 7) {
    conservativenessAdjustment = 2;
  } else if (playerCount >= 5) {
    conservativenessAdjustment = 1;
  }

  const adjustedBid = Math.max(0, Math.min(5, Math.floor(avgStrength) - conservativenessAdjustment));

  // Only bid if we can beat current highest or if we're confident
  if (adjustedBid > currentHighestBid || (isDealer && adjustedBid === currentHighestBid + 1)) {
    return adjustedBid;
  }

  // NOTE: Bluffing removed - it doesn't make sense in this game since bluffing = punting.
  // The only strategic "bluff" is defensive bidding (already handled above) to block
  // players close to winning from calling trump.

  return 0; // Pass
}

// AI trump suit selection
export function chooseAITrumpSuit(hand: Card[]): string {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
  let bestSuit: typeof suits[number] = suits[0];
  let bestStrength = 0;

  for (const suit of suits) {
    const strength = evaluateHandStrength(hand, suit);
    if (strength > bestStrength) {
      bestStrength = strength;
      bestSuit = suit;
    }
  }

  // Always picks optimal suit
  return bestSuit;
}

// AI sit/play decision
export function makeAISitPlayDecision(
  player: Player,
  hand: Card[],
  trumpSuit: string | null,
  highestBid: number,
  canSit: boolean,
  currentScore: number | undefined,
  allScores: Map<string, number>
): 'sit' | 'play' {
  if (!canSit) return 'play';

  const handStrength = evaluateHandStrength(hand, trumpSuit);

  // Check if any opponent is close to winning (score ≤ 3)
  // Strategy: Gang up on them by playing to try to punt them
  const opponentScores = Array.from(allScores.entries()).filter(([id]) => id !== player.id);
  const someoneCloseToWinning = opponentScores.some(([_, score]) => score <= 3);

  // COLLUSION STRATEGY: If someone is at 3 or lower, be aggressive and play
  if (someoneCloseToWinning) {
    // Always plays to gang up unless hand is completely terrible
    if (handStrength === 0 && player.consecutiveSits === 0 && Math.random() > 0.7) {
      return 'sit'; // Only 30% chance to sit even with terrible hand
    }
    return 'play';
  }

  // If at 4 or lower, avoid sitting (sitting gives +1 penalty)
  if (currentScore !== undefined && currentScore <= 4) {
    // Only sits with terrible hand
    if (handStrength === 0 && player.consecutiveSits === 0) {
      return 'sit';
    }
    return 'play';
  }

  // Optimal strategy considering all factors
  if (handStrength >= 3) return 'play';
  if (player.consecutiveSits >= 1) return 'play';
  if (handStrength <= 1) return 'sit';
  return 'play';
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

  // If leading
  if (currentTrick.length === 0) {
    const trumpCards = playableCards.filter(c => c.suit === trumpSuit);
    const nonTrumpCards = playableCards.filter(c => c.suit !== trumpSuit);

    // Lead Ace of trump if available
    const trumpAce = trumpCards.find(c => c.value === 14);
    if (trumpAce) return trumpAce;

    // Lead Ace of non-trump if available
    const nonTrumpAce = nonTrumpCards.find(c => c.value === 14);
    if (nonTrumpAce) return nonTrumpAce;

    // If you have Ace of trump, can safely lead K or Q
    const hasAceOfTrump = trumpCards.some(c => c.value === 14);
    if (hasAceOfTrump) {
      const protectedHighTrumps = trumpCards.filter(c => c.value === 12 || c.value === 13);
      if (protectedHighTrumps.length > 0) {
        return protectedHighTrumps.reduce((highest, card) =>
          card.value > highest.value ? card : highest
        );
      }
    }

    // If multiple trump cards, lead low trump
    if (trumpCards.length >= 2) {
      return trumpCards.reduce((lowest, card) =>
        card.value < lowest.value ? card : lowest
      );
    }

    // Lead lowest non-trump
    if (nonTrumpCards.length > 0) {
      return nonTrumpCards.reduce((lowest, card) =>
        card.value < lowest.value ? card : lowest
      );
    }

    return playableCards.reduce((lowest, card) =>
      card.value < lowest.value ? card : lowest
    );
  }

  const leadSuit = currentTrick[0].card.suit;
  const highestCardInTrick = currentTrick.reduce((highest, play) =>
    play.card.value > highest.card.value ? play : highest
  );

  const trumpCardsInTrick = trumpSuit
    ? currentTrick.filter(play => play.card.suit === trumpSuit)
    : [];
  const highestTrumpInTrick = trumpCardsInTrick.length > 0
    ? trumpCardsInTrick.reduce((highest, play) =>
        play.card.value > highest.card.value ? play : highest
      )
    : null;

  const winningCards = playableCards.filter(card => {
    if (trumpSuit && card.suit === trumpSuit) {
      if (highestTrumpInTrick) {
        return card.value > highestTrumpInTrick.card.value;
      }
      if (highestCardInTrick.card.suit !== trumpSuit) {
        return true;
      }
      return card.value > highestCardInTrick.card.value;
    }
    if (card.suit === leadSuit && highestCardInTrick.card.suit === leadSuit && !highestTrumpInTrick) {
      return card.value > highestCardInTrick.card.value;
    }
    return false;
  });

  // Optimal play: win with lowest winning card, or dump lowest card
  if (winningCards.length > 0) {
    return winningCards.reduce((lowest, card) =>
      card.value < lowest.value ? card : lowest
    );
  }
  return playableCards.reduce((lowest, card) =>
    card.value < lowest.value ? card : lowest
  );
}
