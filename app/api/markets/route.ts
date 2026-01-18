import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchMarkets, clearCache } from '@/lib/polymarket/client';

const searchParamsSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  sortBy: z.enum(['volume', 'recent', 'volatility', 'change']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
  refresh: z.coerce.boolean().optional(),
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params = searchParamsSchema.parse({
      query: searchParams.get('query') || undefined,
      category: searchParams.get('category') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
      refresh: searchParams.get('refresh') || undefined,
    });

    // Clear cache if refresh requested
    if (params.refresh) {
      clearCache();
      console.log('[API] Cache cleared for refresh');
    }

    console.log('[API] Fetching markets with params:', {
      query: params.query,
      category: params.category,
      sortBy: params.sortBy,
      limit: params.limit,
    });

    const result = await fetchMarkets({
      query: params.query,
      category: params.category,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      limit: params.limit || 50,
      offset: params.offset || 0,
    });

    console.log(`[API] Returning ${result.markets.length} markets (total: ${result.total})`);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('[API] Markets error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch markets from Polymarket',
        message: errorMessage,
        source: 'Polymarket Gamma API',
        docs: 'https://docs.polymarket.com/quickstart/fetching-data'
      },
      { status: 502 }
    );
  }
}
