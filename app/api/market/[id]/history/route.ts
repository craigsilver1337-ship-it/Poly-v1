import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchMarketHistory } from '@/lib/polymarket/client';
import { TimeRange } from '@/types';

const querySchema = z.object({
  range: z.enum(['1H', '24H', '7D', '30D', 'ALL']).default('24H'),
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    
    if (!id) {
      return NextResponse.json(
        { error: 'Market ID is required' },
        { status: 400 }
      );
    }

    const query = querySchema.parse({
      range: searchParams.get('range') || '24H',
    });

    const history = await fetchMarketHistory(
      decodeURIComponent(id),
      query.range as TimeRange
    );

    return NextResponse.json(
      { history },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('Market history API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { 
        error: 'Failed to fetch price history from Polymarket',
        message: errorMessage,
        history: [], // Return empty array so UI can handle gracefully
        source: 'Polymarket Gamma API',
        docs: 'https://docs.polymarket.com/developers/CLOB/timeseries'
      },
      { status: 200 } // Return 200 with empty data so UI doesn't break
    );
  }
}
