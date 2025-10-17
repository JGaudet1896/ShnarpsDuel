import { Card } from './cardUtils';
import { Player, AIDifficulty } from './gameLogic';

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
  difficulty: AIDifficulty = 'medium'
): number {
  // Evaluate hand without knowing trump yet
  const avgStrength = (
    evaluateHandStrength(hand, 'hearts') +
    evaluateHandStrength(hand, 'diamonds') +
    evaluateHandStrength(hand, 'clubs') +
    evaluateHandStrength(hand, 'spades')
  ) / 4;
  
  // Adjust conservativeness based on player count
  let conservativenessAdjustment = 0;
  if (playerCount >= 7) {
    conservativenessAdjustment = 2;
  } else if (playerCount >= 5) {
    conservativenessAdjustment = 1;
  }
  
  // Difficulty-based bid adjustments
  let difficultyAdjustment = 0;
  let bluffChance = 0;
  
  if (difficulty === 'easy') {
    // Easy: Makes poor bids, often overbids or underbids
    difficultyAdjustment = Math.random() > 0.5 ? 1 : -1; // Random +1 or -1
    bluffChance = 0.3; // Bluffs often (bad strategy)
  } else if (difficulty === 'medium') {
    // Medium: Occasionally makes mistakes
    difficultyAdjustment = Math.random() > 0.7 ? 1 : 0; // 30% chance of +1
    bluffChance = playerCount <= 4 ? 0.15 : 0.08;
  } else { // hard
    // Hard: Optimal play, no random errors
    difficultyAdjustment = 0;
    bluffChance = playerCount <= 4 ? 0.1 : 0.05; // Strategic bluffing only
  }
  
  const adjustedBid = Math.max(0, Math.min(5, Math.floor(avgStrength) - conservativenessAdjustment + difficultyAdjustment));
  
  // Only bid if we can beat current highest or if we're confident
  if (adjustedBid > currentHighestBid || (isDealer && adjustedBid === currentHighestBid + 1)) {
    return adjustedBid;
  }
  
  // Bluffing logic
  if (Math.random() < bluffChance && currentHighestBid < 3) {
    return currentHighestBid + 1;
  }
  
  return 0; // Pass
}

// AI trump suit selection
export function chooseAITrumpSuit(hand: Card[], difficulty: AIDifficulty = 'medium'): string {
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
  
  // Easy: Sometimes picks randomly instead of optimal
  if (difficulty === 'easy' && Math.random() > 0.5) {
    return suits[Math.floor(Math.random() * suits.length)];
  }
  
  // Medium: Occasionally picks suboptimal suit
  if (difficulty === 'medium' && Math.random() > 0.8) {
    const otherSuits = suits.filter(s => s !== bestSuit);
    return otherSuits[Math.floor(Math.random() * otherSuits.length)];
  }
  
  // Hard: Always picks optimal
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
  allScores: Map<string, number>,
  difficulty: AIDifficulty = 'medium'
): 'sit' | 'play' {
  if (!canSit) return 'play';
  
  const handStrength = evaluateHandStrength(hand, trumpSuit);
  
  // Check if any opponent is close to winning (score ≤ 3)
  // Strategy: Gang up on them by playing to try to punt them
  const opponentScores = Array.from(allScores.entries()).filter(([id]) => id !== player.id);
  const someoneCloseToWinning = opponentScores.some(([_, score]) => score <= 3);
  
  // Easy: Makes poor sit/play decisions (often sits with good hands or plays with bad)
  if (difficulty === 'easy') {
    // Easy bots don't recognize the collusion strategy
    if (Math.random() > 0.6) {
      return Math.random() > 0.5 ? 'sit' : 'play'; // Random 40% of the time
    }
  }
  
  // COLLUSION STRATEGY: If someone is at 3 or lower, be aggressive and play
  if (someoneCloseToWinning && difficulty !== 'easy') {
    if (difficulty === 'hard') {
      // Hard: Always plays to gang up unless hand is completely terrible
      if (handStrength === 0 && player.consecutiveSits === 0 && Math.random() > 0.7) {
        return 'sit'; // Only 30% chance to sit even with terrible hand
      }
      return 'play';
    } else if (difficulty === 'medium') {
      // Medium: Usually plays, but occasionally sits
      if (handStrength >= 1 || player.consecutiveSits >= 1) {
        return 'play';
      }
      if (Math.random() > 0.5) {
        return 'play'; // 50% chance to play even with weak hand
      }
      return 'sit';
    }
  }
  
  // If at 4 or lower, avoid sitting (sitting gives +1 penalty)
  if (currentScore !== undefined && currentScore <= 4) {
    if (difficulty === 'hard') {
      // Hard: Only sits with terrible hand
      if (handStrength === 0 && player.consecutiveSits === 0) {
        return 'sit';
      }
      return 'play';
    } else {
      // Easy/Medium: Sometimes makes mistakes
      if (handStrength <= 1 && player.consecutiveSits === 0 && Math.random() > (difficulty === 'easy' ? 0.3 : 0.6)) {
        return 'sit';
      }
      return 'play';
    }
  }
  
  // Medium: Uses basic strategy
  if (difficulty === 'medium') {
    if (handStrength >= 2) return 'play';
    if (player.consecutiveSits >= 1) return 'play';
    return 'sit';
  }
  
  // Hard: Optimal strategy considering all factors
  if (difficulty === 'hard') {
    if (handStrength >= 3) return 'play';
    if (player.consecutiveSits >= 1) return 'play';
    if (handStrength <= 1) return 'sit';
    return 'play';
  }
  
  // Easy: Poor default strategy
  return handStrength >= 3 ? 'play' : 'sit';
}

// AI card play selection
export function chooseAICardToPlay(
  hand: Card[],
  currentTrick: { playerId: string; card: Card }[],
  trumpSuit: string | null,
  playableCards: Card[],
  difficulty: AIDifficulty = 'medium'
): Card {
  if (playableCards.length === 0) return hand[0];
  if (playableCards.length === 1) return playableCards[0];
  
  // Easy: Often plays random cards
  if (difficulty === 'easy' && Math.random() > 0.4) {
    return playableCards[Math.floor(Math.random() * playableCards.length)];
  }
  
  // If leading
  if (currentTrick.length === 0) {
    // IMPROVED LEADING STRATEGY
    const trumpCards = playableCards.filter(c => c.suit === trumpSuit);
    const nonTrumpCards = playableCards.filter(c => c.suit !== trumpSuit);
    
    if (difficulty === 'hard') {
      // HARD: Smart leading strategy
      
      // Strategy 1: If you have the Ace of trump, lead it (guaranteed winner)
      const trumpAce = trumpCards.find(c => c.value === 14);
      if (trumpAce) return trumpAce;
      
      // Strategy 2: If you have Ace of any non-trump suit, lead it
      const nonTrumpAce = nonTrumpCards.find(c => c.value === 14);
      if (nonTrumpAce) return nonTrumpAce;
      
      // Strategy 3: If you have multiple high trump cards (Q, K, or A), you can lead the lowest high one
      const highTrumps = trumpCards.filter(c => c.value >= 12); // Q, K, A
      if (highTrumps.length >= 2) {
        return highTrumps.reduce((lowest, card) => 
          card.value < lowest.value ? card : lowest
        );
      }
      
      // Strategy 4: If you have trump, lead low trump to draw out higher cards
      if (trumpCards.length > 0) {
        return trumpCards.reduce((lowest, card) => 
          card.value < lowest.value ? card : lowest
        );
      }
      
      // Strategy 5: Lead lowest non-trump to get rid of weak cards
      if (nonTrumpCards.length > 0) {
        return nonTrumpCards.reduce((lowest, card) => 
          card.value < lowest.value ? card : lowest
        );
      }
      
      // Fallback: play lowest card
      return playableCards.reduce((lowest, card) => 
        card.value < lowest.value ? card : lowest
      );
      
    } else if (difficulty === 'medium') {
      // MEDIUM: Decent strategy with occasional mistakes
      
      // 70% of time, use good strategy
      if (Math.random() > 0.3) {
        // Lead Ace of trump if you have it
        const trumpAce = trumpCards.find(c => c.value === 14);
        if (trumpAce) return trumpAce;
        
        // Lead Ace of non-trump if you have it
        const nonTrumpAce = nonTrumpCards.find(c => c.value === 14);
        if (nonTrumpAce) return nonTrumpAce;
        
        // If you have trump, lead low trump
        if (trumpCards.length > 0) {
          return trumpCards.reduce((lowest, card) => 
            card.value < lowest.value ? card : lowest
          );
        }
        
        // Otherwise lead low non-trump
        return playableCards.reduce((lowest, card) => 
          card.value < lowest.value ? card : lowest
        );
      }
      
      // 30% of time, make a mistake (play random or highest)
      if (Math.random() > 0.5) {
        return playableCards.reduce((highest, card) => 
          card.value > highest.value ? card : highest
        );
      }
      return playableCards[Math.floor(Math.random() * playableCards.length)];
    }
    
    // EASY: Often plays poorly
    // 60% random, 40% highest (often wastes high cards)
    if (Math.random() > 0.4) {
      return playableCards[Math.floor(Math.random() * playableCards.length)];
    }
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
    if (trumpSuit && card.suit === trumpSuit && highestCardInTrick.card.suit !== trumpSuit) {
      return true;
    }
    if (trumpSuit && card.suit === trumpSuit && highestCardInTrick.card.suit === trumpSuit) {
      return card.value > highestCardInTrick.card.value;
    }
    if (card.suit === leadSuit && highestCardInTrick.card.suit === leadSuit) {
      return card.value > highestCardInTrick.card.value;
    }
    return false;
  });
  
  // Hard: Optimal play
  if (difficulty === 'hard') {
    if (winningCards.length > 0) {
      return winningCards.reduce((lowest, card) => 
        card.value < lowest.value ? card : lowest
      );
    }
    return playableCards.reduce((lowest, card) => 
      card.value < lowest.value ? card : lowest
    );
  }
  
  // Medium: Usually correct, occasional mistakes
  if (difficulty === 'medium') {
    if (winningCards.length > 0 && Math.random() > 0.2) {
      return winningCards.reduce((lowest, card) => 
        card.value < lowest.value ? card : lowest
      );
    }
    return playableCards.reduce((lowest, card) => 
      card.value < lowest.value ? card : lowest
    );
  }
  
  // Easy: Poor strategy (often wastes high cards or doesn't try to win)
  if (winningCards.length > 0 && Math.random() > 0.6) {
    // Sometimes wins, but uses random winning card instead of lowest
    return winningCards[Math.floor(Math.random() * winningCards.length)];
  }
  return playableCards[Math.floor(Math.random() * playableCards.length)];
}
