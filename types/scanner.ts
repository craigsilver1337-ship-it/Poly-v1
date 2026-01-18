/**
 * Scanner Types for Inefficiency Detection
 */

import { Market } from './market';
import { MarketCluster } from './strategy';

export type ScannerRuleType =
  | 'sum_to_one' // Mutually exclusive outcomes should sum to 1
  | 'threshold_consistency' // P(X>60) <= P(X>50)
  | 'arbitrage_bundle'; // Contradictory probabilities suggesting hedge

export type SeverityLevel = 'high' | 'medium' | 'low';

export interface ScannerFlag {
  id: string;
  ruleType: ScannerRuleType;
  severity: SeverityLevel;
  severityScore: number; // 0-100
  title: string;
  explanation: string;
  affectedMarkets: Market[];
  suggestedTrades: SuggestedTrade[];
  potentialProfit?: number; // Estimated arbitrage profit if applicable
  confidence: number; // 0-100 confidence in the flag
  detectedAt: number;
}

export interface SuggestedTrade {
  marketId: string;
  marketQuestion: string;
  side: 'YES' | 'NO';
  suggestedStake: number; // Relative stake (e.g., 1.0 = unit stake)
  reason: string;
}

export interface ScannerResult {
  cluster: MarketCluster;
  flags: ScannerFlag[];
  scannedAt: number;
  scanDuration: number; // ms
  checksPerformed: number;
}

export interface SumToOneCheck {
  markets: Market[];
  expectedSum: number; // Usually 1.0
  actualSum: number;
  deviation: number;
}

export interface ThresholdCheck {
  higherThreshold: { marketId: string; value: number; probability: number };
  lowerThreshold: { marketId: string; value: number; probability: number };
  isConsistent: boolean;
  deviation: number;
}

export interface ArbitrageBundleCheck {
  markets: Market[];
  impliedProbabilities: number[];
  bundleCost: number;
  guaranteedPayout: number;
  profitMargin: number; // (payout - cost) / cost
}

// Scanner configuration
export interface ScannerConfig {
  sumToOneThreshold: number; // Deviation threshold for sum-to-one (default 0.05)
  thresholdMargin: number; // Margin for threshold consistency (default 0.02)
  minArbitrageProfit: number; // Minimum profit margin for arbitrage (default 0.01)
  enabledRules: ScannerRuleType[];
}

export const DEFAULT_SCANNER_CONFIG: ScannerConfig = {
  sumToOneThreshold: 0.05,
  thresholdMargin: 0.02,
  minArbitrageProfit: 0.01,
  enabledRules: ['sum_to_one', 'threshold_consistency', 'arbitrage_bundle'],
};
