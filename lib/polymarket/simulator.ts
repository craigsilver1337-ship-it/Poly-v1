/**
 * Deterministic Fallback Simulator for Polymarket Data
 * Uses seeded RNG to generate consistent demo data when API is unavailable
 */

import { Market, MarketOutcome, PricePoint, MarketSearchResponse, TimeRange } from '@/types';

// Seeded random number generator for deterministic results
class SeededRandom {
  private seed: number;

  constructor(seed: number = 12345) {
    this.seed = seed;
  }

  // Mulberry32 algorithm
  next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Random float in range
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  // Random integer in range (inclusive)
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  // Pick random element from array
  pick<T>(arr: T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }
}

// Simulated market data
const SIMULATED_MARKETS_DATA = [
  {
    question: 'Will Bitcoin reach $100,000 by end of 2026?',
    category: 'crypto',
    basePrice: 0.45,
    volatility: 0.15,
    volume: 2500000,
  },
  {
    question: 'Will the Fed cut rates in Q1 2026?',
    category: 'business',
    basePrice: 0.62,
    volatility: 0.08,
    volume: 1800000,
  },
  {
    question: 'Will Ethereum flip Bitcoin by market cap in 2026?',
    category: 'crypto',
    basePrice: 0.12,
    volatility: 0.2,
    volume: 950000,
  },
  {
    question: 'Will there be a major AI regulation bill passed in US by June 2026?',
    category: 'politics',
    basePrice: 0.38,
    volatility: 0.12,
    volume: 750000,
  },
  {
    question: 'Will SpaceX Starship complete orbital flight by March 2026?',
    category: 'science',
    basePrice: 0.72,
    volatility: 0.1,
    volume: 1200000,
  },
  {
    question: 'Will Taylor Swift announce new album in Q1 2026?',
    category: 'pop-culture',
    basePrice: 0.55,
    volatility: 0.18,
    volume: 680000,
  },
  {
    question: 'Will Bitcoin be above $80,000 on February 1, 2026?',
    category: 'crypto',
    basePrice: 0.58,
    volatility: 0.12,
    volume: 1100000,
  },
  {
    question: 'Will Bitcoin be above $70,000 on February 1, 2026?',
    category: 'crypto',
    basePrice: 0.72,
    volatility: 0.1,
    volume: 890000,
  },
  {
    question: 'Will Bitcoin be above $60,000 on February 1, 2026?',
    category: 'crypto',
    basePrice: 0.85,
    volatility: 0.06,
    volume: 650000,
  },
  {
    question: 'Will US GDP growth exceed 3% in 2026?',
    category: 'business',
    basePrice: 0.32,
    volatility: 0.09,
    volume: 520000,
  },
  {
    question: 'Will Apple release AR glasses in 2026?',
    category: 'business',
    basePrice: 0.28,
    volatility: 0.14,
    volume: 890000,
  },
  {
    question: 'Will there be a government shutdown in Q1 2026?',
    category: 'politics',
    basePrice: 0.35,
    volatility: 0.2,
    volume: 420000,
  },
  {
    question: 'Will Manchester City win Premier League 2025-26?',
    category: 'sports',
    basePrice: 0.42,
    volatility: 0.15,
    volume: 1500000,
  },
  {
    question: 'Will Lakers make NBA playoffs 2026?',
    category: 'sports',
    basePrice: 0.68,
    volatility: 0.12,
    volume: 780000,
  },
  {
    question: 'Will OpenAI release GPT-5 by June 2026?',
    category: 'science',
    basePrice: 0.48,
    volatility: 0.16,
    volume: 920000,
  },
];

function generateId(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

function generateSlug(question: string): string {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

export function generateSimulatedMarkets(seed: number = Date.now()): Market[] {
  const rng = new SeededRandom(seed);

  return SIMULATED_MARKETS_DATA.map((data, index) => {
    const id = generateId(data.question);
    const priceVariation = rng.range(-0.05, 0.05);
    const yesPrice = Math.max(0.01, Math.min(0.99, data.basePrice + priceVariation));
    const change24h = rng.range(-data.volatility, data.volatility);

    const outcomes: MarketOutcome[] = [
      {
        id: `${id}-yes`,
        name: 'Yes',
        price: yesPrice,
        priceChange24h: change24h,
      },
      {
        id: `${id}-no`,
        name: 'No',
        price: 1 - yesPrice,
        priceChange24h: -change24h,
      },
    ];

    const now = Date.now();
    const daysToEnd = rng.int(30, 180);
    const endDate = new Date(now + daysToEnd * 24 * 60 * 60 * 1000);

    return {
      id,
      question: data.question,
      slug: generateSlug(data.question),
      category: data.category,
      endDate: endDate.toISOString(),
      volume: data.volume + rng.int(-100000, 100000),
      liquidity: data.volume * rng.range(0.1, 0.3),
      outcomes,
      createdAt: new Date(now - rng.int(30, 365) * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - rng.int(0, 24) * 60 * 60 * 1000).toISOString(),
      active: true,
      closed: false,
      resolved: false,
      description: `Market for: ${data.question}`,
      tags: [data.category],
    };
  });
}

export function generateSimulatedHistory(
  marketId: string,
  basePrice: number,
  range: TimeRange
): PricePoint[] {
  const rng = new SeededRandom(parseInt(marketId.slice(0, 8), 16));
  const now = Date.now();

  const rangeConfigs: Record<TimeRange, { points: number; intervalMs: number }> = {
    '1H': { points: 60, intervalMs: 60000 }, // 1 min intervals
    '24H': { points: 96, intervalMs: 900000 }, // 15 min intervals
    '7D': { points: 168, intervalMs: 3600000 }, // 1 hour intervals
    '30D': { points: 120, intervalMs: 21600000 }, // 6 hour intervals
    ALL: { points: 180, intervalMs: 86400000 }, // 1 day intervals
  };

  const config = rangeConfigs[range];
  const points: PricePoint[] = [];
  let currentPrice = basePrice;

  for (let i = config.points - 1; i >= 0; i--) {
    const timestamp = now - i * config.intervalMs;
    const volatility = 0.02; // 2% max move per interval
    const change = rng.range(-volatility, volatility);
    currentPrice = Math.max(0.01, Math.min(0.99, currentPrice + change));

    points.push({
      timestamp,
      price: currentPrice,
      volume: rng.int(1000, 50000),
    });
  }

  return points;
}

export function searchSimulatedMarkets(
  markets: Market[],
  query?: string,
  category?: string,
  sortBy: string = 'volume',
  sortOrder: string = 'desc'
): MarketSearchResponse {
  let filtered = [...markets];

  if (query) {
    const lowerQuery = query.toLowerCase();
    filtered = filtered.filter(
      (m) =>
        m.question.toLowerCase().includes(lowerQuery) ||
        m.category.toLowerCase().includes(lowerQuery)
    );
  }

  if (category && category !== 'all') {
    filtered = filtered.filter((m) => m.category === category);
  }

  // Sort
  filtered.sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'volume':
        comparison = a.volume - b.volume;
        break;
      case 'recent':
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
      case 'volatility':
        comparison =
          Math.abs(a.outcomes[0]?.priceChange24h || 0) -
          Math.abs(b.outcomes[0]?.priceChange24h || 0);
        break;
      case 'change':
        comparison =
          (a.outcomes[0]?.priceChange24h || 0) - (b.outcomes[0]?.priceChange24h || 0);
        break;
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  return {
    markets: filtered,
    total: filtered.length,
    hasMore: false,
  };
}

export function getSimulatedMarketById(markets: Market[], id: string): Market | null {
  return markets.find((m) => m.id === id) || null;
}
