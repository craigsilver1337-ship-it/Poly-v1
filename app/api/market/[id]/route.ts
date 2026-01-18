import { NextRequest, NextResponse } from 'next/server';
import { fetchMarketDetail } from '@/lib/polymarket/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Market ID is required' },
        { status: 400 }
      );
    }

    const market = await fetchMarketDetail(decodeURIComponent(id));

    if (!market) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(market, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Market detail API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch market from Polymarket',
        message: errorMessage,
        source: 'Polymarket Gamma API',
        docs: 'https://docs.polymarket.com/quickstart/fetching-data#get-market-details'
      },
      { status: 502 }
    );
  }
}
