import { describe, it, expect } from 'vitest';
import {
  calculatePositionPayoff,
  calculatePositionResolutionPayoff,
  applyTimeDiscount,
  calculateOpportunityCost,
  generatePayoffCurve,
  generatePayoffSurface,
} from '@/lib/math/payoff';
import { Position, Market } from '@/types';

// Mock market data
const mockMarket: Market = {
  id: 'test-market',
  question: 'Test Market',
  slug: 'test-market',
  category: 'crypto',
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  volume: 100000,
  liquidity: 50000,
  outcomes: [
    { id: 'yes', name: 'Yes', price: 0.6, priceChange24h: 0.02 },
    { id: 'no', name: 'No', price: 0.4, priceChange24h: -0.02 },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  active: true,
  closed: false,
  resolved: false,
};

describe('Payoff Calculations', () => {
  describe('calculatePositionPayoff', () => {
    it('should calculate YES position payoff at final probability 1 (YES wins)', () => {
      const position: Position = {
        id: 'pos1',
        market: mockMarket,
        side: 'YES',
        stake: 100,
        entryPrice: 0.6,
        addedAt: Date.now(),
      };

      // At probability 1, YES wins: payoff = stake * (1/entryPrice - 1)
      const payoff = calculatePositionPayoff(position, 1);
      expect(payoff).toBeCloseTo(66.67, 1); // 100 * (1/0.6 - 1) = 66.67
    });

    it('should calculate YES position payoff at final probability 0 (NO wins)', () => {
      const position: Position = {
        id: 'pos1',
        market: mockMarket,
        side: 'YES',
        stake: 100,
        entryPrice: 0.6,
        addedAt: Date.now(),
      };

      // At probability 0, NO wins: payoff = -stake
      const payoff = calculatePositionPayoff(position, 0);
      expect(payoff).toBeCloseTo(-100, 1);
    });

    it('should calculate NO position payoff at final probability 0 (NO wins)', () => {
      const position: Position = {
        id: 'pos1',
        market: mockMarket,
        side: 'NO',
        stake: 100,
        entryPrice: 0.6, // NO position uses the NO price (1 - YES price = 0.4, but we use 0.6 as entry)
        addedAt: Date.now(),
      };

      // At probability 0, NO wins: payoff = stake * (1/noPrice - 1) where noPrice = 1 - entryPrice for NO side
      // For a NO position with entryPrice 0.6 (which means buying NO at 0.4):
      // noPrice = 0.4, payoff = 100 * (1/0.4 - 1) = 150
      // But calculatePositionPayoff uses entryPrice directly as the NO price
      // So with entryPrice 0.6: noPrice = 1 - 0.6 = 0.4, payoff = 100 * (1/0.4 - 1) = 150
      const payoff = calculatePositionPayoff(position, 0);
      // The formula in code: noPrice = 1 - entryPrice, so 1 - 0.6 = 0.4, payoff = 100 * (1/0.4 - 1) = 150
      expect(payoff).toBeCloseTo(150, 1);
    });

    it('should calculate payoff at intermediate probability', () => {
      const position: Position = {
        id: 'pos1',
        market: mockMarket,
        side: 'YES',
        stake: 100,
        entryPrice: 0.5,
        addedAt: Date.now(),
      };

      // At probability 0.5, expected payoff is 0
      const payoff = calculatePositionPayoff(position, 0.5);
      expect(payoff).toBeCloseTo(0, 1);
    });
  });

  describe('calculatePositionResolutionPayoff', () => {
    it('should calculate YES position winning payoff', () => {
      const position: Position = {
        id: 'pos1',
        market: mockMarket,
        side: 'YES',
        stake: 100,
        entryPrice: 0.4,
        addedAt: Date.now(),
      };

      const payoff = calculatePositionResolutionPayoff(position, 'YES');
      expect(payoff).toBeCloseTo(150, 1); // 100 * (1/0.4 - 1) = 150
    });

    it('should calculate YES position losing payoff', () => {
      const position: Position = {
        id: 'pos1',
        market: mockMarket,
        side: 'YES',
        stake: 100,
        entryPrice: 0.4,
        addedAt: Date.now(),
      };

      const payoff = calculatePositionResolutionPayoff(position, 'NO');
      expect(payoff).toBeCloseTo(-100, 1);
    });
  });

  describe('applyTimeDiscount', () => {
    it('should discount payoff based on time', () => {
      const payoff = 100;
      const daysToResolution = 365; // 1 year
      const annualRate = 0.10; // 10%

      const discounted = applyTimeDiscount(payoff, daysToResolution, annualRate);
      expect(discounted).toBeCloseTo(90.91, 1); // 100 / (1 + 0.10 * 1)
    });

    it('should not discount for immediate resolution', () => {
      const payoff = 100;
      const daysToResolution = 0;
      const annualRate = 0.10;

      const discounted = applyTimeDiscount(payoff, daysToResolution, annualRate);
      expect(discounted).toBeCloseTo(100, 1);
    });
  });

  describe('calculateOpportunityCost', () => {
    it('should calculate opportunity cost correctly', () => {
      const stake = 1000;
      const daysToResolution = 365;
      const annualRate = 0.10;

      const cost = calculateOpportunityCost(stake, daysToResolution, annualRate);
      expect(cost).toBeCloseTo(100, 1); // 1000 * 0.10 * 1
    });
  });

  describe('generatePayoffCurve', () => {
    it('should generate payoff curve with correct number of points', () => {
      const position: Position = {
        id: 'pos1',
        market: mockMarket,
        side: 'YES',
        stake: 100,
        entryPrice: 0.5,
        addedAt: Date.now(),
      };

      const curve = generatePayoffCurve([position], 10);
      expect(curve).toHaveLength(11); // 0 to 10 inclusive
    });

    it('should have payoff = 0 at break-even probability for fair-priced position', () => {
      const position: Position = {
        id: 'pos1',
        market: mockMarket,
        side: 'YES',
        stake: 100,
        entryPrice: 0.5,
        addedAt: Date.now(),
      };

      const curve = generatePayoffCurve([position], 100);
      const midpoint = curve.find((p) => p.probability === 0.5);
      expect(midpoint?.payoff).toBeCloseTo(0, 1);
    });
  });

  describe('generatePayoffSurface', () => {
    it('should generate payoff surface with correct dimensions', () => {
      const position: Position = {
        id: 'pos1',
        market: mockMarket,
        side: 'YES',
        stake: 100,
        entryPrice: 0.5,
        addedAt: Date.now(),
      };

      const surface = generatePayoffSurface([position], 0.10, 5, 5, 180);
      
      // Should have (probSteps + 1) * (timeSteps + 1) points
      expect(surface.points).toHaveLength(36); // 6 * 6
    });

    it('should have higher payoff with lower discount rate', () => {
      const position: Position = {
        id: 'pos1',
        market: mockMarket,
        side: 'YES',
        stake: 100,
        entryPrice: 0.4,
        addedAt: Date.now(),
      };

      const surfaceLowRate = generatePayoffSurface([position], 0.05, 5, 5, 180);
      const surfaceHighRate = generatePayoffSurface([position], 0.20, 5, 5, 180);

      expect(surfaceLowRate.timeWeightedEV).toBeGreaterThan(surfaceHighRate.timeWeightedEV);
    });
  });
});
