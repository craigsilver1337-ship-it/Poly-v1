import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { scanCluster } from '@/lib/math/scanner';
import { MarketCluster, ScannerConfig, DEFAULT_SCANNER_CONFIG } from '@/types';

const marketSchema = z.object({
  id: z.string(),
  question: z.string(),
  category: z.string(),
  endDate: z.string(),
  volume: z.number().optional(),
  liquidity: z.number().optional(),
  outcomes: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    priceChange24h: z.number(),
  })),
  slug: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  active: z.boolean().optional(),
  closed: z.boolean().optional(),
  resolved: z.boolean().optional(),
});

const requestSchema = z.object({
  cluster: z.object({
    id: z.string(),
    name: z.string(),
    markets: z.array(marketSchema),
    clusterType: z.enum(['mutual_exclusive', 'threshold', 'correlated', 'custom']),
    thresholdConfig: z.object({
      variable: z.string(),
      thresholds: z.array(z.object({
        marketId: z.string(),
        operator: z.enum(['>', '<', '>=', '<=']),
        value: z.number(),
      })),
    }).optional(),
    createdAt: z.number(),
  }),
  config: z.object({
    sumToOneThreshold: z.number().optional(),
    thresholdMargin: z.number().optional(),
    minArbitrageProfit: z.number().optional(),
    enabledRules: z.array(z.enum(['sum_to_one', 'threshold_consistency', 'arbitrage_bundle'])).optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = requestSchema.parse(body);

    const config: ScannerConfig = {
      ...DEFAULT_SCANNER_CONFIG,
      ...parsed.config,
    };

    const result = scanCluster(parsed.cluster as MarketCluster, config);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Scanner API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to scan cluster' },
      { status: 500 }
    );
  }
}
