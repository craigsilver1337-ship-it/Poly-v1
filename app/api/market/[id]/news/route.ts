import { NextRequest, NextResponse } from 'next/server';
import { fetchMarketDetail } from '@/lib/polymarket/client';
import { searchNews } from '@/lib/news/client';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const marketId = decodeURIComponent(params.id);

    // Fetch market detail first
    const market = await fetchMarketDetail(marketId);

    if (!market) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      );
    }

    // Fetch news related to this market
    const newsResult = await searchNews(market);

    return NextResponse.json({
      market: {
        id: market.id,
        question: market.question,
        category: market.category,
      },
      news: newsResult.articles,
      searchQuery: newsResult.searchQuery,
      totalResults: newsResult.totalResults,
      fetchedAt: Date.now(),
    });
  } catch (error) {
    console.error('[API] Market news error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news', message: (error as Error).message },
      { status: 500 }
    );
  }
}

