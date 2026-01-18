/**
 * Strategy Types for Multi-Market Position Building
 */

import { Market } from './market';

export interface Position {
  id: string;
  market: Market;
  side: 'YES' | 'NO';
  stake: number; // USD amount
  entryPrice: number; // Price at entry (0-1)
  addedAt: number; // Timestamp
}

export interface Strategy {
  id: string;
  name: string;
  positions: Position[];
  createdAt: number;
  updatedAt: number;
  discountRate: number; // APR for time-value discounting (default 10%)
}

// Payoff calculation result for a single probability point
export interface PayoffPoint {
  probability: number; // 0-1 probability shift
  payoff: number; // USD payoff at this probability
  percentReturn: number; // Percentage return
}

// Payoff surface for 3D-like visualization (prob x time)
export interface PayoffSurfacePoint {
  probability: number; // X-axis: probability (0-1)
  daysToResolution: number; // Y-axis: days until resolution
  payoff: number; // Z-value: discounted payoff
  percentReturn: number;
}

export interface PayoffSurface {
  points: PayoffSurfacePoint[];
  minPayoff: number;
  maxPayoff: number;
  expectedValue: number; // Probability-weighted EV
  timeWeightedEV: number; // EV discounted for time
}

// Outcome scenario for strategy evaluation
export interface OutcomeScenario {
  id: string;
  outcomes: Record<string, 'YES' | 'NO'>; // marketId -> outcome
  probability: number; // Probability of this scenario
  payoff: number;
}

export interface StrategyAnalysis {
  totalStake: number;
  expectedPayoff: number;
  expectedReturn: number;
  maxProfit: number;
  maxLoss: number;
  breakEvenProbability: number;
  scenarios: OutcomeScenario[];
  payoffCurve: PayoffPoint[];
  payoffSurface: PayoffSurface;
}

// Cluster for grouping related markets
export interface MarketCluster {
  id: string;
  name: string;
  markets: Market[];
  clusterType: 'mutual_exclusive' | 'threshold' | 'correlated' | 'custom';
  thresholdConfig?: ThresholdConfig; // For threshold-type clusters
  createdAt: number;
}

export interface ThresholdConfig {
  variable: string; // e.g., "Bitcoin Price"
  thresholds: ThresholdMarket[];
}

export interface ThresholdMarket {
  marketId: string;
  operator: '>' | '<' | '>=' | '<=';
  value: number;
}
