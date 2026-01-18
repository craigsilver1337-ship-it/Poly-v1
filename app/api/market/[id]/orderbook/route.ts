import { NextRequest, NextResponse } from 'next/server';
import { fetchOrderbook, fetchMarketDetail } from '@/lib/polymarket/client';

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

    // First get the market to get token IDs
    const market = await fetchMarketDetail(decodeURIComponent(id));
    
    if (!market) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      );
    }

    // Get the token ID from the first outcome (YES)
    const tokenId = market.outcomes[0]?.id;
    
    if (!tokenId) {
      return NextResponse.json(
        { error: 'No token ID available for this market' },
        { status: 400 }
      );
    }

    const orderbook = await fetchOrderbook(tokenId);

    return NextResponse.json(
      { 
        orderbook,
        market: {
          id: market.id,
          question: market.question,
        }
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
        },
      }
    );
  } catch (error) {
    console.error('Orderbook API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch orderbook from Polymarket',
        message: errorMessage,
        orderbook: null,
        source: 'Polymarket CLOB API',
        docs: 'https://docs.polymarket.com/quickstart/fetching-data#get-orderbook-depth'
      },
      { status: 200 } // Return 200 so UI doesn't break
    );
  }
}
