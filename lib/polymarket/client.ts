/**
 * Polymarket API Client
 * Fetches real-time data from Polymarket Gamma API and CLOB API
 * Based on: https://docs.polymarket.com/quickstart/fetching-data
 */

import {
  Market,
  MarketOutcome,
  MarketSearchParams,
  MarketSearchResponse,
  PricePoint,
  TimeRange,
} from '@/types';
import { apiCache, CACHE_TTL, cacheKey } from './cache';

// Polymarket API endpoints
const GAMMA_API_URL = process.env.POLYMARKET_GAMMA_URL || 'https://gamma-api.polymarket.com';
const CLOB_API_URL = process.env.POLYMARKET_CLOB_URL || 'https://clob.polymarket.com';
const REQUEST_TIMEOUT = 15000; // 15 seconds

// Raw Gamma API response types
interface GammaMarketRaw {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  resolutionSource?: string;
  endDate: string;
  startDate?: string;
  liquidity: string | number;
  volume: string | number;
  volume24hr?: number;
  active: boolean;
  closed: boolean;
  marketMakerAddress?: string;
  createdAt: string;
  updatedAt: string;
  new?: boolean;
  featured?: boolean;
  restricted?: boolean;
  outcomes: string; // JSON string like "[\"Yes\", \"No\"]"
  outcomePrices: string; // JSON string like "[\"0.65\", \"0.35\"]"
  clobTokenIds?: string; // JSON string with token IDs
  category?: string;
  description?: string;
  image?: string;
  icon?: string;
  oneDayPriceChange?: number;
  oneHourPriceChange?: number;
  oneWeekPriceChange?: number;
  bestBid?: number;
  bestAsk?: number;
  lastTradePrice?: number;
}

interface GammaEventRaw {
  id: string;
  slug: string;
  title: string;
  description?: string;
  active: boolean;
  closed: boolean;
  liquidity: string | number;
  volume: string | number;
  volume24hr?: number;
  markets?: GammaMarketRaw[];
  image?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  tags?: Array<{ id: string; label: string; slug: string }>;
}

/**
 * Fetch with timeout and error handling
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Transform Gamma API market response to our Market type
 */
function transformGammaMarket(gamma: GammaMarketRaw, eventTitle?: string, eventTags?: Array<{ label: string }>): Market {
  let outcomes: MarketOutcome[] = [];
  let clobTokenIds: string[] = [];

  try {
    // Parse outcomes and prices from JSON strings
    const outcomeNames = JSON.parse(gamma.outcomes || '["Yes", "No"]') as string[];
    const outcomePrices = JSON.parse(gamma.outcomePrices || '[0.5, 0.5]') as string[];
    
    // Parse CLOB token IDs
    if (gamma.clobTokenIds) {
      clobTokenIds = JSON.parse(gamma.clobTokenIds) as string[];
    }

    const priceChange24h = gamma.oneDayPriceChange || 0;

    outcomes = outcomeNames.map((name, i) => ({
      id: clobTokenIds[i] || `${gamma.id}-${i}`,
      name,
      price: parseFloat(outcomePrices[i]) || 0.5,
      priceChange24h: i === 0 ? priceChange24h : -priceChange24h,
    }));
  } catch {
    outcomes = [
      { id: `${gamma.id}-0`, name: 'Yes', price: 0.5, priceChange24h: 0 },
      { id: `${gamma.id}-1`, name: 'No', price: 0.5, priceChange24h: 0 },
    ];
  }

  // Determine category from tags or question content
  let category = gamma.category || 'other';
  const questionLower = gamma.question.toLowerCase();
  const titleLower = (eventTitle || '').toLowerCase();
  
  // Use event tags if available
  if (eventTags && eventTags.length > 0) {
    category = eventTags[0].label.toLowerCase();
  }
  
  // Fallback to keyword matching
  if (category === 'other') {
    if (questionLower.includes('bitcoin') || questionLower.includes('crypto') || 
        questionLower.includes('eth') || questionLower.includes('btc') ||
        titleLower.includes('bitcoin') || titleLower.includes('crypto')) {
      category = 'crypto';
    } else if (questionLower.includes('trump') || questionLower.includes('election') ||
               questionLower.includes('president') || questionLower.includes('congress') ||
               questionLower.includes('senate') || questionLower.includes('governor') ||
               questionLower.includes('macron') || questionLower.includes('starmer')) {
      category = 'politics';
    } else if (questionLower.includes('nba') || questionLower.includes('nfl') ||
               questionLower.includes('mlb') || questionLower.includes('soccer') ||
               questionLower.includes('super bowl') || questionLower.includes('championship')) {
      category = 'sports';
    } else if (questionLower.includes('gdp') || questionLower.includes('inflation') ||
               questionLower.includes('fed') || questionLower.includes('interest rate') ||
               questionLower.includes('recession') || questionLower.includes('doge') ||
               questionLower.includes('budget') || questionLower.includes('spending')) {
      category = 'economy';
    } else if (questionLower.includes('war') || questionLower.includes('ukraine') ||
               questionLower.includes('russia') || questionLower.includes('nato') ||
               questionLower.includes('china') || questionLower.includes('military')) {
      category = 'world';
    }
  }

  return {
    id: gamma.id || gamma.conditionId,
    question: gamma.question,
    slug: gamma.slug,
    category,
    endDate: gamma.endDate,
    volume: typeof gamma.volume === 'string' ? parseFloat(gamma.volume) : (gamma.volume || 0),
    liquidity: typeof gamma.liquidity === 'string' ? parseFloat(gamma.liquidity) : (gamma.liquidity || 0),
    outcomes,
    createdAt: gamma.createdAt,
    updatedAt: gamma.updatedAt,
    active: gamma.active,
    closed: gamma.closed,
    resolved: gamma.closed && !gamma.active,
    imageUrl: gamma.image || gamma.icon,
    description: gamma.description,
    tags: eventTags?.map(t => t.label) || [],
  };
}

/**
 * Fetch active events and extract markets from Gamma API
 * Uses /events endpoint for more diverse results
 * Docs: https://docs.polymarket.com/quickstart/fetching-data#fetch-active-events
 */
export async function fetchMarkets(params: MarketSearchParams = {}): Promise<MarketSearchResponse> {
  const { query, category, sortBy = 'volume', sortOrder = 'desc', limit = 50, offset = 0 } = params;

  // Check cache first
  const key = cacheKey('markets', query, category, sortBy, sortOrder, limit, offset);
  const cached = apiCache.get<MarketSearchResponse>(key);
  if (cached) return cached;

  try {
    // Fetch from events endpoint for diverse results
    const eventsParams = new URLSearchParams();
    eventsParams.set('active', 'true');
    eventsParams.set('closed', 'false');
    eventsParams.set('limit', '100'); // Fetch more events to get diverse markets
    
    // Search query
    if (query && query.trim()) {
      eventsParams.set('title_contains', query.trim());
    }

    const eventsUrl = `${GAMMA_API_URL}/events?${eventsParams.toString()}`;
    console.log('[Polymarket] Fetching events:', eventsUrl);
    
    const eventsResponse = await fetchWithTimeout(eventsUrl);
    
    if (!eventsResponse.ok) {
      throw new Error(`Gamma API returned ${eventsResponse.status}`);
    }

    const eventsData = await eventsResponse.json();
    const events: GammaEventRaw[] = Array.isArray(eventsData) ? eventsData : (eventsData.data || []);
    
    console.log(`[Polymarket] Received ${events.length} events`);

    // Extract markets from events
    let allMarkets: Market[] = [];
    
    for (const event of events) {
      if (event.markets && event.markets.length > 0) {
        // For events with multiple markets, just take the main one (first) to avoid duplication
        const primaryMarket = event.markets[0];
        const market = transformGammaMarket(primaryMarket, event.title, event.tags);
        
        // If event has multiple outcomes (like "How many people..."), use event-level volume
        if (event.markets.length > 1) {
          market.volume = typeof event.volume === 'string' ? parseFloat(event.volume) : (event.volume || market.volume);
          market.liquidity = typeof event.liquidity === 'string' ? parseFloat(event.liquidity) : (event.liquidity || market.liquidity);
        }
        
        allMarkets.push(market);
      }
    }

    // Also fetch from markets endpoint for additional markets
    const marketsParams = new URLSearchParams();
    marketsParams.set('active', 'true');
    marketsParams.set('closed', 'false');
    marketsParams.set('limit', '100');
    
    if (query && query.trim()) {
      marketsParams.set('_q', query.trim());
    }

    const marketsUrl = `${GAMMA_API_URL}/markets?${marketsParams.toString()}`;
    console.log('[Polymarket] Fetching markets:', marketsUrl);
    
    const marketsResponse = await fetchWithTimeout(marketsUrl);
    
    if (marketsResponse.ok) {
      const marketsData = await marketsResponse.json();
      const rawMarkets: GammaMarketRaw[] = Array.isArray(marketsData) ? marketsData : (marketsData.data || []);
      
      console.log(`[Polymarket] Received ${rawMarkets.length} additional markets`);
      
      // Add markets not already in our list
      const existingIds = new Set(allMarkets.map(m => m.id));
      for (const raw of rawMarkets) {
        if (!existingIds.has(raw.id)) {
          allMarkets.push(transformGammaMarket(raw));
          existingIds.add(raw.id);
        }
      }
    }

    // Filter by category if specified
    if (category && category !== 'all') {
      const categoryLower = category.toLowerCase();
      allMarkets = allMarkets.filter(m => m.category === categoryLower);
    }

    // Sort markets
    if (sortBy === 'volume') {
      allMarkets.sort((a, b) => sortOrder === 'desc' ? b.volume - a.volume : a.volume - b.volume);
    } else if (sortBy === 'recent') {
      allMarkets.sort((a, b) => {
        const dateA = new Date(a.updatedAt || 0).getTime();
        const dateB = new Date(b.updatedAt || 0).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
    } else if (sortBy === 'change') {
      allMarkets.sort((a, b) => {
        const changeA = Math.abs(a.outcomes[0]?.priceChange24h || 0);
        const changeB = Math.abs(b.outcomes[0]?.priceChange24h || 0);
        return sortOrder === 'desc' ? changeB - changeA : changeA - changeB;
      });
    }

    // Apply pagination
    const paginatedMarkets = allMarkets.slice(offset, offset + limit);

    const result: MarketSearchResponse = {
      markets: paginatedMarkets,
      total: allMarkets.length,
      hasMore: offset + limit < allMarkets.length,
    };

    // Cache the result
    apiCache.set(key, result, CACHE_TTL.MARKETS_LIST);
    return result;
  } catch (error) {
    console.error('[Polymarket] Fetch error:', error);
    throw error;
  }
}

/**
 * Fetch single market detail from Gamma API
 * Endpoint: GET https://gamma-api.polymarket.com/markets/{id}
 */
export async function fetchMarketDetail(id: string): Promise<Market | null> {
  const key = cacheKey('market', id);
  const cached = apiCache.get<Market>(key);
  if (cached) return cached;

  try {
    // Try fetching by ID first
    let url = `${GAMMA_API_URL}/markets/${encodeURIComponent(id)}`;
    console.log('[Polymarket] Fetching market detail:', url);
    
    let response = await fetchWithTimeout(url);

    // If 404, try by slug
    if (response.status === 404) {
      url = `${GAMMA_API_URL}/markets?slug=${encodeURIComponent(id)}`;
      console.log('[Polymarket] Trying by slug:', url);
      response = await fetchWithTimeout(url);
      
      if (response.ok) {
        const data = await response.json();
        const markets = Array.isArray(data) ? data : [data];
        if (markets.length > 0) {
          const market = transformGammaMarket(markets[0]);
          apiCache.set(key, market, CACHE_TTL.MARKET_DETAIL);
          return market;
        }
      }
      return null;
    }

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const gamma: GammaMarketRaw = await response.json();
    const market = transformGammaMarket(gamma);
    
    apiCache.set(key, market, CACHE_TTL.MARKET_DETAIL);
    return market;
  } catch (error) {
    console.error('[Polymarket] Market detail error:', error);
    throw error;
  }
}

/**
 * Fetch all markets for an event (for grouped markets like "How many...")
 */
export async function fetchEventMarkets(eventSlug: string): Promise<Market[]> {
  const key = cacheKey('eventMarkets', eventSlug);
  const cached = apiCache.get<Market[]>(key);
  if (cached) return cached;

  try {
    const url = `${GAMMA_API_URL}/events?slug=${encodeURIComponent(eventSlug)}`;
    console.log('[Polymarket] Fetching event markets:', url);
    
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const events = Array.isArray(data) ? data : [data];
    
    if (events.length === 0 || !events[0].markets) {
      return [];
    }

    const event = events[0];
    const markets = event.markets.map((m: GammaMarketRaw) => 
      transformGammaMarket(m, event.title, event.tags)
    );
    
    apiCache.set(key, markets, CACHE_TTL.MARKET_DETAIL);
    return markets;
  } catch (error) {
    console.error('[Polymarket] Event markets error:', error);
    return [];
  }
}

/**
 * Fetch price history for a market from Gamma API
 */
export async function fetchMarketHistory(
  marketId: string,
  range: TimeRange
): Promise<PricePoint[]> {
  const key = cacheKey('history', marketId, range);
  const cached = apiCache.get<PricePoint[]>(key);
  if (cached) return cached;

  try {
    // Calculate time range
    const now = Date.now();
    const rangeConfig: Record<TimeRange, { fidelity: number; startTime: number }> = {
      '1H': { fidelity: 1, startTime: now - 60 * 60 * 1000 },
      '24H': { fidelity: 15, startTime: now - 24 * 60 * 60 * 1000 },
      '7D': { fidelity: 60, startTime: now - 7 * 24 * 60 * 60 * 1000 },
      '30D': { fidelity: 360, startTime: now - 30 * 24 * 60 * 60 * 1000 },
      ALL: { fidelity: 1440, startTime: now - 365 * 24 * 60 * 60 * 1000 },
    };

    const config = rangeConfig[range];
    
    // Use CLOB timeseries endpoint
    const searchParams = new URLSearchParams({
      market: marketId,
      fidelity: config.fidelity.toString(),
      startTs: Math.floor(config.startTime / 1000).toString(),
      endTs: Math.floor(now / 1000).toString(),
    });

    const url = `${GAMMA_API_URL}/prices?${searchParams.toString()}`;
    console.log('[Polymarket] Fetching price history:', url);
    
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      console.error('[Polymarket] Price history returned:', response.status);
      return [];
    }

    const data = await response.json();
    
    // Handle different response formats
    let rawPoints: Array<{ t: number | string; p: number | string }> = [];
    
    if (data.history) {
      rawPoints = data.history;
    } else if (data.prices) {
      rawPoints = data.prices;
    } else if (Array.isArray(data)) {
      rawPoints = data;
    }

    const history: PricePoint[] = rawPoints.map((p) => ({
      timestamp: typeof p.t === 'number' ? p.t * 1000 : Date.parse(String(p.t)),
      price: typeof p.p === 'number' ? p.p : parseFloat(String(p.p)),
    })).filter(p => !isNaN(p.timestamp) && !isNaN(p.price));

    // Sort by timestamp ascending
    history.sort((a, b) => a.timestamp - b.timestamp);

    console.log(`[Polymarket] Received ${history.length} price points`);
    
    if (history.length > 0) {
      apiCache.set(key, history, CACHE_TTL.PRICE_HISTORY);
    }
    
    return history;
  } catch (error) {
    console.error('[Polymarket] Price history error:', error);
    return [];
  }
}

/**
 * Fetch current price from CLOB API
 * Endpoint: GET https://clob.polymarket.com/price?token_id=...&side=buy
 */
export async function fetchCurrentPrice(tokenId: string, side: 'buy' | 'sell' = 'buy'): Promise<number | null> {
  try {
    const url = `${CLOB_API_URL}/price?token_id=${encodeURIComponent(tokenId)}&side=${side}`;
    console.log('[Polymarket] Fetching current price:', url);
    
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      throw new Error(`CLOB API returned ${response.status}`);
    }
    
    const data = await response.json();
    return parseFloat(data.price) || null;
  } catch (error) {
    console.error('[Polymarket] Price fetch error:', error);
    return null;
  }
}

/**
 * Fetch orderbook from CLOB API
 * Endpoint: GET https://clob.polymarket.com/book?token_id=...
 */
export async function fetchOrderbook(tokenId: string): Promise<{
  bids: { price: string; size: string }[];
  asks: { price: string; size: string }[];
} | null> {
  try {
    const url = `${CLOB_API_URL}/book?token_id=${encodeURIComponent(tokenId)}`;
    console.log('[Polymarket] Fetching orderbook:', url);
    
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      throw new Error(`CLOB API returned ${response.status}`);
    }
    
    const data = await response.json();
    return {
      bids: data.bids || [],
      asks: data.asks || [],
    };
  } catch (error) {
    console.error('[Polymarket] Orderbook fetch error:', error);
    return null;
  }
}

/**
 * Fetch all available tags/categories from Gamma API
 * Endpoint: GET https://gamma-api.polymarket.com/tags
 */
export async function fetchTags(): Promise<{ id: string; label: string; slug: string }[]> {
  const key = 'tags';
  const cached = apiCache.get<{ id: string; label: string; slug: string }[]>(key);
  if (cached) return cached;

  try {
    const url = `${GAMMA_API_URL}/tags?limit=100`;
    console.log('[Polymarket] Fetching tags:', url);
    
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    const tags = (Array.isArray(data) ? data : data.data || []).map((t: { id: string | number; label: string; slug: string }) => ({
      id: String(t.id) || '',
      label: t.label || '',
      slug: t.slug || '',
    }));
    
    apiCache.set(key, tags, CACHE_TTL.MARKETS_LIST * 10);
    return tags;
  } catch (error) {
    console.error('[Polymarket] Tags fetch error:', error);
    return [];
  }
}

/**
 * Clear all caches (useful for manual refresh)
 */
export function clearCache(): void {
  apiCache.clear();
}

/**
 * Get data mode status - always "live" since we use real API
 */
export function getDataMode(): 'live' {
  return 'live';
}
