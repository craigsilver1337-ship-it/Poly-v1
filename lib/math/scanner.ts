/**
 * Inefficiency Scanner Logic
 * Detects constraint violations and arbitrage opportunities in market clusters
 */

import {
  Market,
  MarketCluster,
  ScannerFlag,
  ScannerResult,
  SuggestedTrade,
  ScannerConfig,
  DEFAULT_SCANNER_CONFIG,
  SeverityLevel,
} from '@/types';

/**
 * Generate unique ID for scanner flags
 */
function generateFlagId(): string {
  return `flag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate severity level based on score
 */
function getSeverityLevel(score: number): SeverityLevel {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Check if mutually exclusive outcomes sum to approximately 1
 * 
 * For markets marked as mutually exclusive (only one can be true),
 * the sum of YES probabilities should equal 1.
 * 
 * Example: "Bitcoin above $100k" and "Bitcoin below $100k" should sum to 1
 */
export function checkSumToOne(
  markets: Market[],
  threshold: number = 0.05
): ScannerFlag | null {
  if (markets.length < 2) return null;
  
  // Get YES price for each market
  const probabilities = markets.map(m => m.outcomes[0]?.price || 0.5);
  const sum = probabilities.reduce((a, b) => a + b, 0);
  
  const deviation = Math.abs(sum - 1);
  
  if (deviation > threshold) {
    const severityScore = Math.min(100, Math.round(deviation * 500)); // 0.2 deviation = 100 score
    const isOverpriced = sum > 1;
    
    // Suggest selling overpriced outcomes or buying underpriced
    const suggestedTrades: SuggestedTrade[] = markets.map((m, i) => {
      const avgPrice = 1 / markets.length;
      const currentPrice = probabilities[i];
      const isOverpriced = currentPrice > avgPrice * 1.1;
      
      return {
        marketId: m.id,
        marketQuestion: m.question,
        side: isOverpriced ? 'NO' : 'YES',
        suggestedStake: Math.abs(currentPrice - avgPrice),
        reason: isOverpriced
          ? `Price ${(currentPrice * 100).toFixed(1)}% appears high relative to peers`
          : `Price ${(currentPrice * 100).toFixed(1)}% appears low relative to peers`,
      };
    });
    
    return {
      id: generateFlagId(),
      ruleType: 'sum_to_one',
      severity: getSeverityLevel(severityScore),
      severityScore,
      title: isOverpriced
        ? 'Mutually Exclusive Outcomes Overpriced'
        : 'Mutually Exclusive Outcomes Underpriced',
      explanation: `These markets represent mutually exclusive outcomes but their probabilities sum to ${(sum * 100).toFixed(1)}% instead of 100%. This ${deviation > 0.1 ? 'significant' : 'minor'} ${isOverpriced ? 'overpricing' : 'underpricing'} suggests potential inefficiency.`,
      affectedMarkets: markets,
      suggestedTrades,
      potentialProfit: deviation * 100, // Rough estimate
      confidence: Math.min(95, 70 + severityScore / 5),
      detectedAt: Date.now(),
    };
  }
  
  return null;
}

/**
 * Check threshold consistency
 * 
 * For threshold markets (e.g., "Bitcoin > $100k" vs "Bitcoin > $80k"),
 * higher threshold should have lower probability.
 * 
 * P(X > 100k) <= P(X > 80k) always
 */
export function checkThresholdConsistency(
  markets: Market[],
  thresholds: { marketId: string; value: number }[],
  margin: number = 0.02
): ScannerFlag | null {
  if (thresholds.length < 2) return null;
  
  // Sort thresholds by value (ascending)
  const sorted = [...thresholds].sort((a, b) => a.value - b.value);
  
  const violations: { higher: typeof sorted[0]; lower: typeof sorted[0]; deviation: number }[] = [];
  
  for (let i = 0; i < sorted.length - 1; i++) {
    const lower = sorted[i];
    const higher = sorted[i + 1];
    
    const lowerMarket = markets.find(m => m.id === lower.marketId);
    const higherMarket = markets.find(m => m.id === higher.marketId);
    
    if (!lowerMarket || !higherMarket) continue;
    
    const lowerProb = lowerMarket.outcomes[0]?.price || 0.5;
    const higherProb = higherMarket.outcomes[0]?.price || 0.5;
    
    // Higher threshold should have LOWER or EQUAL probability
    if (higherProb > lowerProb + margin) {
      violations.push({
        higher: { ...higher, marketId: higherMarket.id },
        lower: { ...lower, marketId: lowerMarket.id },
        deviation: higherProb - lowerProb,
      });
    }
  }
  
  if (violations.length === 0) return null;
  
  const maxDeviation = Math.max(...violations.map(v => v.deviation));
  const severityScore = Math.min(100, Math.round(maxDeviation * 300));
  
  const affectedMarkets = violations.flatMap(v => {
    const markets_affected: Market[] = [];
    const lm = markets.find(m => m.id === v.lower.marketId);
    const hm = markets.find(m => m.id === v.higher.marketId);
    if (lm) markets_affected.push(lm);
    if (hm) markets_affected.push(hm);
    return markets_affected;
  });
  
  const suggestedTrades: SuggestedTrade[] = violations.flatMap(v => {
    const lowerMarket = markets.find(m => m.id === v.lower.marketId);
    const higherMarket = markets.find(m => m.id === v.higher.marketId);
    
    const trades: SuggestedTrade[] = [];
    if (higherMarket) {
      trades.push({
        marketId: higherMarket.id,
        marketQuestion: higherMarket.question,
        side: 'NO',
        suggestedStake: 1,
        reason: `Higher threshold has higher probability than it should`,
      });
    }
    if (lowerMarket) {
      trades.push({
        marketId: lowerMarket.id,
        marketQuestion: lowerMarket.question,
        side: 'YES',
        suggestedStake: 1,
        reason: `Lower threshold may be underpriced relative to higher`,
      });
    }
    return trades;
  });
  
  return {
    id: generateFlagId(),
    ruleType: 'threshold_consistency',
    severity: getSeverityLevel(severityScore),
    severityScore,
    title: 'Threshold Inconsistency Detected',
    explanation: `Found ${violations.length} case(s) where a higher threshold has higher probability than a lower threshold. This violates logical consistency - for example, P(X > 100) should never exceed P(X > 80).`,
    affectedMarkets: Array.from(new Set(affectedMarkets)),
    suggestedTrades,
    potentialProfit: maxDeviation * 50,
    confidence: 85,
    detectedAt: Date.now(),
  };
}

/**
 * Find arbitrage bundle opportunities
 * 
 * Look for combinations where buying all outcomes costs less than
 * guaranteed payout, or vice versa.
 */
export function checkArbitrageBundles(
  markets: Market[],
  minProfit: number = 0.01
): ScannerFlag | null {
  // For a single market: if YES + NO prices < 1, buy both for guaranteed profit
  // For multiple markets: look for covered positions
  
  for (const market of markets) {
    const yesPrice = market.outcomes[0]?.price || 0.5;
    const noPrice = market.outcomes[1]?.price || 0.5;
    
    const totalCost = yesPrice + noPrice;
    const guaranteedPayout = 1; // One outcome always pays 1
    
    const profitMargin = (guaranteedPayout - totalCost) / totalCost;
    
    if (profitMargin > minProfit) {
      const severityScore = Math.min(100, Math.round(profitMargin * 500));
      
      return {
        id: generateFlagId(),
        ruleType: 'arbitrage_bundle',
        severity: getSeverityLevel(severityScore),
        severityScore,
        title: 'Risk-Free Arbitrage Opportunity',
        explanation: `Buying both YES (${(yesPrice * 100).toFixed(1)}¢) and NO (${(noPrice * 100).toFixed(1)}¢) costs ${(totalCost * 100).toFixed(1)}¢ but guarantees $1 payout. This ${(profitMargin * 100).toFixed(1)}% return is effectively risk-free.`,
        affectedMarkets: [market],
        suggestedTrades: [
          {
            marketId: market.id,
            marketQuestion: market.question,
            side: 'YES',
            suggestedStake: 1,
            reason: 'Part of arbitrage bundle',
          },
          {
            marketId: market.id,
            marketQuestion: market.question,
            side: 'NO',
            suggestedStake: 1,
            reason: 'Part of arbitrage bundle',
          },
        ],
        potentialProfit: profitMargin * 100,
        confidence: 95,
        detectedAt: Date.now(),
      };
    }
    
    // Check for overpriced bundle (total > 1)
    if (totalCost > 1 + minProfit) {
      const profitMargin = (totalCost - 1) / 1;
      const severityScore = Math.min(100, Math.round(profitMargin * 500));
      
      return {
        id: generateFlagId(),
        ruleType: 'arbitrage_bundle',
        severity: getSeverityLevel(severityScore),
        severityScore,
        title: 'Overpriced Outcomes Detected',
        explanation: `YES (${(yesPrice * 100).toFixed(1)}¢) + NO (${(noPrice * 100).toFixed(1)}¢) = ${(totalCost * 100).toFixed(1)}¢, exceeding $1. If you could sell both, you'd profit ${((totalCost - 1) * 100).toFixed(1)}¢ per share.`,
        affectedMarkets: [market],
        suggestedTrades: [
          {
            marketId: market.id,
            marketQuestion: market.question,
            side: totalCost > 1 && yesPrice > noPrice ? 'NO' : 'YES',
            suggestedStake: 1,
            reason: 'The less expensive side may be underpriced',
          },
        ],
        potentialProfit: profitMargin * 50,
        confidence: 75,
        detectedAt: Date.now(),
      };
    }
  }
  
  return null;
}

/**
 * Run all scanner checks on a market cluster
 */
export function scanCluster(
  cluster: MarketCluster,
  config: ScannerConfig = DEFAULT_SCANNER_CONFIG
): ScannerResult {
  const startTime = Date.now();
  const flags: ScannerFlag[] = [];
  let checksPerformed = 0;
  
  const { markets, clusterType, thresholdConfig } = cluster;
  
  // Sum-to-one check (for mutual_exclusive clusters)
  if (
    config.enabledRules.includes('sum_to_one') &&
    (clusterType === 'mutual_exclusive' || clusterType === 'custom')
  ) {
    checksPerformed++;
    const flag = checkSumToOne(markets, config.sumToOneThreshold);
    if (flag) flags.push(flag);
  }
  
  // Threshold consistency check
  if (
    config.enabledRules.includes('threshold_consistency') &&
    clusterType === 'threshold' &&
    thresholdConfig
  ) {
    checksPerformed++;
    const thresholds = thresholdConfig.thresholds.map(t => ({
      marketId: t.marketId,
      value: t.value,
    }));
    const flag = checkThresholdConsistency(markets, thresholds, config.thresholdMargin);
    if (flag) flags.push(flag);
  }
  
  // Arbitrage bundle check
  if (config.enabledRules.includes('arbitrage_bundle')) {
    checksPerformed++;
    const flag = checkArbitrageBundles(markets, config.minArbitrageProfit);
    if (flag) flags.push(flag);
  }
  
  // Sort flags by severity (highest first)
  flags.sort((a, b) => b.severityScore - a.severityScore);
  
  return {
    cluster,
    flags,
    scannedAt: Date.now(),
    scanDuration: Date.now() - startTime,
    checksPerformed,
  };
}

/**
 * Auto-detect cluster type based on market questions
 */
export function detectClusterType(
  markets: Market[]
): 'mutual_exclusive' | 'threshold' | 'correlated' | 'custom' {
  if (markets.length < 2) return 'custom';
  
  // Check for threshold patterns (numbers in questions)
  const numberPattern = /\$?\d+[,.]?\d*[kKmMbB]?/g;
  const numbersFound = markets.map(m => {
    const matches = m.question.match(numberPattern);
    return matches ? matches.map(n => parseFloat(n.replace(/[$,kKmMbB]/g, ''))) : [];
  });
  
  const hasNumbers = numbersFound.every(n => n.length > 0);
  if (hasNumbers) {
    // Check if they share a common subject
    const firstWords = markets.map(m => m.question.split(' ').slice(0, 3).join(' '));
    const commonStart = firstWords.every(w => w === firstWords[0]);
    if (commonStart) return 'threshold';
  }
  
  // Check for exclusive patterns
  const categories = markets.map(m => m.category);
  const allSameCategory = categories.every(c => c === categories[0]);
  
  if (allSameCategory && markets.length <= 5) {
    return 'mutual_exclusive';
  }
  
  return 'correlated';
}

/**
 * Extract thresholds from market questions
 */
export function extractThresholds(
  markets: Market[]
): { marketId: string; operator: '>' | '<'; value: number }[] {
  const pattern = /(above|below|over|under|greater than|less than|exceed|exceeds|>|<)\s*\$?(\d+[,.]?\d*[kKmMbB]?)/i;
  
  return markets
    .map(m => {
      const match = m.question.match(pattern);
      if (!match) return null;
      
      const operator = ['above', 'over', 'greater than', 'exceed', 'exceeds', '>'].includes(match[1].toLowerCase())
        ? '>' as const
        : '<' as const;
      
      let value = parseFloat(match[2].replace(/,/g, ''));
      const suffix = match[2].slice(-1).toLowerCase();
      if (suffix === 'k') value *= 1000;
      if (suffix === 'm') value *= 1000000;
      if (suffix === 'b') value *= 1000000000;
      
      return { marketId: m.id, operator, value };
    })
    .filter((t): t is NonNullable<typeof t> => t !== null);
}
