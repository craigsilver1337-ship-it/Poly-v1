import { describe, it, expect } from 'vitest';
import {
  checkSumToOne,
  checkThresholdConsistency,
  checkArbitrageBundles,
  scanCluster,
  detectClusterType,
  extractThresholds,
} from '@/lib/math/scanner';
import { Market, MarketCluster, DEFAULT_SCANNER_CONFIG } from '@/types';

// Helper to create mock markets
function createMockMarket(
  id: string,
  question: string,
  yesPrice: number,
  category = 'crypto'
): Market {
  return {
    id,
    question,
    slug: id,
    category,
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    volume: 100000,
    liquidity: 50000,
    outcomes: [
      { id: `${id}-yes`, name: 'Yes', price: yesPrice, priceChange24h: 0 },
      { id: `${id}-no`, name: 'No', price: 1 - yesPrice, priceChange24h: 0 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    active: true,
    closed: false,
    resolved: false,
  };
}

describe('Scanner Logic', () => {
  describe('checkSumToOne', () => {
    it('should not flag markets that sum to 1', () => {
      const markets = [
        createMockMarket('m1', 'Outcome A', 0.3),
        createMockMarket('m2', 'Outcome B', 0.3),
        createMockMarket('m3', 'Outcome C', 0.4),
      ];

      const flag = checkSumToOne(markets, 0.05);
      expect(flag).toBeNull();
    });

    it('should flag markets that sum significantly above 1', () => {
      const markets = [
        createMockMarket('m1', 'Outcome A', 0.4),
        createMockMarket('m2', 'Outcome B', 0.4),
        createMockMarket('m3', 'Outcome C', 0.4),
      ];

      const flag = checkSumToOne(markets, 0.05);
      expect(flag).not.toBeNull();
      expect(flag?.ruleType).toBe('sum_to_one');
      expect(flag?.title).toContain('Overpriced');
    });

    it('should flag markets that sum significantly below 1', () => {
      const markets = [
        createMockMarket('m1', 'Outcome A', 0.2),
        createMockMarket('m2', 'Outcome B', 0.2),
        createMockMarket('m3', 'Outcome C', 0.2),
      ];

      const flag = checkSumToOne(markets, 0.05);
      expect(flag).not.toBeNull();
      expect(flag?.ruleType).toBe('sum_to_one');
      expect(flag?.title).toContain('Underpriced');
    });

    it('should require at least 2 markets', () => {
      const markets = [createMockMarket('m1', 'Single', 0.5)];
      const flag = checkSumToOne(markets, 0.05);
      expect(flag).toBeNull();
    });
  });

  describe('checkThresholdConsistency', () => {
    it('should not flag consistent thresholds', () => {
      const markets = [
        createMockMarket('m1', 'Bitcoin above $50k', 0.8),
        createMockMarket('m2', 'Bitcoin above $100k', 0.4),
        createMockMarket('m3', 'Bitcoin above $150k', 0.1),
      ];

      const thresholds = [
        { marketId: 'm1', value: 50000 },
        { marketId: 'm2', value: 100000 },
        { marketId: 'm3', value: 150000 },
      ];

      const flag = checkThresholdConsistency(markets, thresholds, 0.02);
      expect(flag).toBeNull();
    });

    it('should flag inconsistent thresholds', () => {
      const markets = [
        createMockMarket('m1', 'Bitcoin above $50k', 0.4),
        createMockMarket('m2', 'Bitcoin above $100k', 0.6), // Higher threshold but higher price!
      ];

      const thresholds = [
        { marketId: 'm1', value: 50000 },
        { marketId: 'm2', value: 100000 },
      ];

      const flag = checkThresholdConsistency(markets, thresholds, 0.02);
      expect(flag).not.toBeNull();
      expect(flag?.ruleType).toBe('threshold_consistency');
    });
  });

  describe('checkArbitrageBundles', () => {
    it('should not flag correctly priced markets', () => {
      const markets = [createMockMarket('m1', 'Fair market', 0.5)];
      const flag = checkArbitrageBundles(markets, 0.01);
      expect(flag).toBeNull();
    });

    it('should flag underpriced bundles (sum < 1)', () => {
      const market = createMockMarket('m1', 'Underpriced', 0.45);
      // Manually adjust NO price to create arbitrage
      market.outcomes[1].price = 0.45; // YES + NO = 0.90

      const flag = checkArbitrageBundles([market], 0.01);
      expect(flag).not.toBeNull();
      expect(flag?.ruleType).toBe('arbitrage_bundle');
      expect(flag?.title).toContain('Risk-Free');
    });

    it('should flag overpriced bundles (sum > 1)', () => {
      const market = createMockMarket('m1', 'Overpriced', 0.55);
      // Manually adjust NO price to create overpricing
      market.outcomes[1].price = 0.55; // YES + NO = 1.10

      const flag = checkArbitrageBundles([market], 0.01);
      expect(flag).not.toBeNull();
      expect(flag?.ruleType).toBe('arbitrage_bundle');
      expect(flag?.title).toContain('Overpriced');
    });
  });

  describe('scanCluster', () => {
    it('should run all enabled checks', () => {
      const markets = [
        createMockMarket('m1', 'Outcome A', 0.5),
        createMockMarket('m2', 'Outcome B', 0.5),
      ];

      const cluster: MarketCluster = {
        id: 'test-cluster',
        name: 'Test Cluster',
        markets,
        clusterType: 'mutual_exclusive',
        createdAt: Date.now(),
      };

      const result = scanCluster(cluster, DEFAULT_SCANNER_CONFIG);
      
      expect(result.cluster).toBe(cluster);
      expect(result.checksPerformed).toBeGreaterThan(0);
      expect(result.scannedAt).toBeDefined();
      expect(result.scanDuration).toBeGreaterThanOrEqual(0);
    });

    it('should respect disabled rules', () => {
      const markets = [
        createMockMarket('m1', 'Outcome A', 0.4),
        createMockMarket('m2', 'Outcome B', 0.4),
        createMockMarket('m3', 'Outcome C', 0.4),
      ];

      const cluster: MarketCluster = {
        id: 'test-cluster',
        name: 'Test Cluster',
        markets,
        clusterType: 'mutual_exclusive',
        createdAt: Date.now(),
      };

      // Disable sum_to_one check
      const result = scanCluster(cluster, {
        ...DEFAULT_SCANNER_CONFIG,
        enabledRules: [],
      });

      expect(result.flags).toHaveLength(0);
    });
  });

  describe('detectClusterType', () => {
    it('should detect threshold type for numeric markets', () => {
      const markets = [
        createMockMarket('m1', 'Will Bitcoin be above $50,000?', 0.8),
        createMockMarket('m2', 'Will Bitcoin be above $100,000?', 0.4),
      ];

      const type = detectClusterType(markets);
      expect(type).toBe('threshold');
    });

    it('should return custom for single market', () => {
      const markets = [createMockMarket('m1', 'Single market', 0.5)];
      const type = detectClusterType(markets);
      expect(type).toBe('custom');
    });
  });

  describe('extractThresholds', () => {
    it('should extract thresholds from market questions', () => {
      const markets = [
        createMockMarket('m1', 'Will Bitcoin be above $50,000?', 0.8),
        createMockMarket('m2', 'Will ETH exceed $5,000?', 0.6),
      ];

      const thresholds = extractThresholds(markets);
      
      expect(thresholds).toHaveLength(2);
      expect(thresholds[0].value).toBe(50000);
      expect(thresholds[0].operator).toBe('>');
      expect(thresholds[1].value).toBe(5000);
    });

    it('should handle markets without thresholds', () => {
      const markets = [
        createMockMarket('m1', 'Will it rain tomorrow?', 0.5),
      ];

      const thresholds = extractThresholds(markets);
      expect(thresholds).toHaveLength(0);
    });
  });
});
