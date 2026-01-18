/**
 * Payoff Calculation Engine
 * Computes strategy payoffs across probability and time dimensions
 */

import { Position, Strategy, PayoffPoint, PayoffSurface, PayoffSurfacePoint, OutcomeScenario, StrategyAnalysis } from '@/types';

/**
 * Calculate payoff for a single position given final probability
 * 
 * If you buy YES at price P for stake S:
 * - If YES wins: payoff = S * (1/P - 1) = S * (1-P)/P
 * - If NO wins: payoff = -S
 * 
 * The "final probability" here represents the resolution price (1 for YES, 0 for NO)
 * For intermediate probabilities, we interpolate (useful for exit before resolution)
 */
export function calculatePositionPayoff(
  position: Position,
  finalProbability: number
): number {
  const { side, stake, entryPrice } = position;
  
  if (side === 'YES') {
    // Expected value based on probability
    // At resolution: YES=1 gives (1/entryPrice - 1) * stake, YES=0 gives -stake
    const yesPayoff = stake * (1 / entryPrice - 1);
    const noPayoff = -stake;
    return yesPayoff * finalProbability + noPayoff * (1 - finalProbability);
  } else {
    // NO position
    const noPrice = 1 - entryPrice;
    const noPayoff = stake * (1 / noPrice - 1);
    const yesPayoff = -stake;
    return noPayoff * (1 - finalProbability) + yesPayoff * finalProbability;
  }
}

/**
 * Calculate payoff for a single position at resolution (binary outcome)
 */
export function calculatePositionResolutionPayoff(
  position: Position,
  outcome: 'YES' | 'NO'
): number {
  const { side, stake, entryPrice } = position;
  
  if (side === 'YES') {
    if (outcome === 'YES') {
      return stake * (1 / entryPrice - 1); // Win: get 1/entryPrice per unit, minus cost
    } else {
      return -stake; // Lose: lose entire stake
    }
  } else {
    const noPrice = 1 - entryPrice;
    if (outcome === 'NO') {
      return stake * (1 / noPrice - 1);
    } else {
      return -stake;
    }
  }
}

/**
 * Apply time-value discount to payoff
 * Uses simple APR-based discounting
 * 
 * @param payoff - The undiscounted payoff
 * @param daysToResolution - Days until market resolves
 * @param annualRate - Annual discount rate (e.g., 0.10 for 10%)
 */
export function applyTimeDiscount(
  payoff: number,
  daysToResolution: number,
  annualRate: number = 0.10
): number {
  // Simple discounting: PV = FV / (1 + r * t)
  const years = daysToResolution / 365;
  const discountFactor = 1 + annualRate * years;
  return payoff / discountFactor;
}

/**
 * Calculate opportunity cost for locked capital
 * 
 * @param stake - Amount of capital locked
 * @param daysToResolution - Days until resolution
 * @param annualRate - Annual opportunity cost rate
 */
export function calculateOpportunityCost(
  stake: number,
  daysToResolution: number,
  annualRate: number = 0.10
): number {
  const years = daysToResolution / 365;
  return stake * annualRate * years;
}

/**
 * Generate payoff curve across probability range
 */
export function generatePayoffCurve(
  positions: Position[],
  steps: number = 50
): PayoffPoint[] {
  const points: PayoffPoint[] = [];
  const totalStake = positions.reduce((sum, p) => sum + p.stake, 0);
  
  for (let i = 0; i <= steps; i++) {
    const probability = i / steps;
    let totalPayoff = 0;
    
    for (const position of positions) {
      totalPayoff += calculatePositionPayoff(position, probability);
    }
    
    points.push({
      probability,
      payoff: totalPayoff,
      percentReturn: totalStake > 0 ? (totalPayoff / totalStake) * 100 : 0,
    });
  }
  
  return points;
}

/**
 * Generate payoff surface (probability x time)
 */
export function generatePayoffSurface(
  positions: Position[],
  discountRate: number = 0.10,
  probabilitySteps: number = 20,
  timeSteps: number = 10,
  maxDays: number = 180
): PayoffSurface {
  const points: PayoffSurfacePoint[] = [];
  const totalStake = positions.reduce((sum, p) => sum + p.stake, 0);
  let minPayoff = Infinity;
  let maxPayoff = -Infinity;
  
  for (let pStep = 0; pStep <= probabilitySteps; pStep++) {
    const probability = pStep / probabilitySteps;
    
    for (let tStep = 0; tStep <= timeSteps; tStep++) {
      const daysToResolution = (tStep / timeSteps) * maxDays;
      
      let undiscountedPayoff = 0;
      for (const position of positions) {
        undiscountedPayoff += calculatePositionPayoff(position, probability);
      }
      
      // Apply time discount
      const payoff = applyTimeDiscount(undiscountedPayoff, daysToResolution, discountRate);
      
      minPayoff = Math.min(minPayoff, payoff);
      maxPayoff = Math.max(maxPayoff, payoff);
      
      points.push({
        probability,
        daysToResolution,
        payoff,
        percentReturn: totalStake > 0 ? (payoff / totalStake) * 100 : 0,
      });
    }
  }
  
  // Calculate expected value (assuming uniform probability distribution)
  const evPoints = points.filter(p => p.daysToResolution === 0);
  const expectedValue = evPoints.reduce((sum, p) => sum + p.payoff, 0) / evPoints.length;
  
  // Time-weighted EV (average across all time points)
  const timeWeightedEV = points.reduce((sum, p) => sum + p.payoff, 0) / points.length;
  
  return {
    points,
    minPayoff,
    maxPayoff,
    expectedValue,
    timeWeightedEV,
  };
}

/**
 * Generate all possible outcome scenarios for a strategy
 */
export function generateOutcomeScenarios(
  positions: Position[]
): OutcomeScenario[] {
  const markets = Array.from(new Set(positions.map(p => p.market.id)));
  const numMarkets = markets.length;
  const numScenarios = Math.pow(2, numMarkets);
  
  const scenarios: OutcomeScenario[] = [];
  
  for (let i = 0; i < numScenarios; i++) {
    const outcomes: Record<string, 'YES' | 'NO'> = {};
    
    for (let j = 0; j < numMarkets; j++) {
      outcomes[markets[j]] = (i & (1 << j)) ? 'YES' : 'NO';
    }
    
    // Calculate payoff for this scenario
    let payoff = 0;
    for (const position of positions) {
      const outcome = outcomes[position.market.id];
      payoff += calculatePositionResolutionPayoff(position, outcome);
    }
    
    // Calculate probability of this scenario
    // Using current market prices as probability estimates
    let probability = 1;
    for (const position of positions) {
      const marketProb = position.market.outcomes[0]?.price || 0.5;
      const outcome = outcomes[position.market.id];
      probability *= outcome === 'YES' ? marketProb : (1 - marketProb);
    }
    
    scenarios.push({
      id: `scenario-${i}`,
      outcomes,
      probability,
      payoff,
    });
  }
  
  return scenarios;
}

/**
 * Calculate comprehensive strategy analysis
 */
export function analyzeStrategy(strategy: Strategy): StrategyAnalysis {
  const { positions, discountRate } = strategy;
  
  if (positions.length === 0) {
    return {
      totalStake: 0,
      expectedPayoff: 0,
      expectedReturn: 0,
      maxProfit: 0,
      maxLoss: 0,
      breakEvenProbability: 0.5,
      scenarios: [],
      payoffCurve: [],
      payoffSurface: {
        points: [],
        minPayoff: 0,
        maxPayoff: 0,
        expectedValue: 0,
        timeWeightedEV: 0,
      },
    };
  }
  
  const totalStake = positions.reduce((sum, p) => sum + p.stake, 0);
  const scenarios = generateOutcomeScenarios(positions);
  const payoffCurve = generatePayoffCurve(positions);
  const payoffSurface = generatePayoffSurface(positions, discountRate);
  
  // Expected payoff based on scenario probabilities
  const expectedPayoff = scenarios.reduce(
    (sum, s) => sum + s.payoff * s.probability,
    0
  );
  
  const expectedReturn = totalStake > 0 ? (expectedPayoff / totalStake) * 100 : 0;
  
  const payoffs = scenarios.map(s => s.payoff);
  const maxProfit = Math.max(...payoffs);
  const maxLoss = Math.min(...payoffs);
  
  // Find break-even probability (where payoff crosses 0)
  let breakEvenProbability = 0.5;
  for (let i = 1; i < payoffCurve.length; i++) {
    const prev = payoffCurve[i - 1];
    const curr = payoffCurve[i];
    if ((prev.payoff <= 0 && curr.payoff >= 0) || (prev.payoff >= 0 && curr.payoff <= 0)) {
      // Linear interpolation to find exact break-even
      const t = Math.abs(prev.payoff) / (Math.abs(prev.payoff) + Math.abs(curr.payoff));
      breakEvenProbability = prev.probability + t * (curr.probability - prev.probability);
      break;
    }
  }
  
  return {
    totalStake,
    expectedPayoff,
    expectedReturn,
    maxProfit,
    maxLoss,
    breakEvenProbability,
    scenarios,
    payoffCurve,
    payoffSurface,
  };
}
