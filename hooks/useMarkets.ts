'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Market, MarketSearchParams, MarketSearchResponse } from '@/types';

interface UseMarketsOptions extends MarketSearchParams {
  enabled?: boolean;
}

interface UseMarketsReturn {
  markets: Market[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  refetch: (forceRefresh?: boolean, useRandomOffset?: boolean) => void;
  loadMore: () => void;
  isLive: boolean;
}

export function useMarkets(options: UseMarketsOptions = {}): UseMarketsReturn {
  const {
    query,
    category,
    sortBy = 'volume',
    sortOrder = 'desc',
    limit = 50,
    all = false,
    enabled = true,
  } = options;

  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLive, setIsLive] = useState(true);
  const fetchIdRef = useRef(0);

  // Store current offset in ref for loadMore
  const offsetRef = useRef(0);
  offsetRef.current = offset;

  const fetchMarkets = useCallback(async (
    currentQuery: string | undefined,
    currentCategory: string | undefined,
    currentSortBy: string,
    currentSortOrder: string,
    currentLimit: number,
    resetOffset: boolean,
    forceRefresh: boolean,
    customOffset?: number
  ) => {
    if (!enabled) return;

    const fetchId = ++fetchIdRef.current;

    try {
      setLoading(true);
      setError(null);

      const currentOffset = customOffset !== undefined ? customOffset : (resetOffset ? 0 : offsetRef.current);
      const params = new URLSearchParams();
      if (currentQuery) params.set('query', currentQuery);
      if (currentCategory && currentCategory !== 'all') params.set('category', currentCategory);
      params.set('sortBy', currentSortBy);
      params.set('sortOrder', currentSortOrder);
      params.set('limit', currentLimit.toString());
      params.set('offset', currentOffset.toString());

      // Opt-in to fetch all markets when no query is active
      if (all && !currentQuery && (!currentCategory || currentCategory === 'all')) {
        params.set('all', 'true');
      }

      // Force cache refresh
      if (forceRefresh) {
        params.set('refresh', 'true');
      }

      console.log('[useMarkets] Fetching:', `/api/markets?${params.toString()}`);

      let response: Response;
      try {
        // Create timeout manually for better browser compatibility
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

        try {
          response = await fetch(`/api/markets?${params.toString()}`, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          throw fetchErr;
        }
      } catch (fetchError) {
        // Handle network errors (CORS, connection refused, timeout, etc.)
        if (fetchError instanceof TypeError) {
          if (fetchError.message.includes('fetch') || fetchError.message.includes('network')) {
            throw new Error('Network error: Unable to reach API server. Check your internet connection and ensure the dev server is running on port 3000.');
          }
          throw new Error(`Network error: ${fetchError.message}`);
        }
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Request timeout: The API took longer than 60 seconds to respond. The Polymarket API may be slow or unavailable.');
        }
        throw new Error(fetchError instanceof Error ? fetchError.message : 'Network request failed. Please check your connection.');
      }

      // Check if this is still the latest request
      if (fetchId !== fetchIdRef.current) {
        console.log('[useMarkets] Request superseded, ignoring');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || errorData.error || `API returned ${response.status} ${response.statusText}`;
        throw new Error(errorMsg);
      }

      const data: MarketSearchResponse = await response.json();

      console.log(`[useMarkets] Received ${data.markets?.length || 0} markets (total: ${data.total})`);

      // Check if we got data
      if (!data.markets || data.markets.length === 0) {
        if (resetOffset) {
          setMarkets([]);
          setTotal(0);
          setHasMore(false);
        }
        setIsLive(true);
        return;
      }

      // If customOffset is provided, always replace markets (for random refresh)
      if (resetOffset || customOffset !== undefined) {
        setMarkets(data.markets);
        setOffset(customOffset !== undefined ? customOffset + data.markets.length : data.markets.length);
      } else {
        setMarkets(prev => [...prev, ...data.markets]);
        setOffset(prev => prev + data.markets.length);
      }

      setTotal(data.total);
      setHasMore(data.hasMore);
      setIsLive(true);
    } catch (err) {
      if (fetchId !== fetchIdRef.current) return;

      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useMarkets] Error:', errorMessage);
      setError(`Failed to fetch from Polymarket: ${errorMessage}`);
      setIsLive(false);
    } finally {
      if (fetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [enabled]);

  // Initial fetch and refetch on param changes
  useEffect(() => {
    fetchMarkets(query, category, sortBy, sortOrder, limit, true, false);
  }, [fetchMarkets, query, category, sortBy, sortOrder, limit]);

  const refetch = useCallback((forceRefresh = false, useRandomOffset = false) => {
    if (useRandomOffset && total > 0) {
      // Generate a random offset to fetch new markets from a different position
      const maxOffset = Math.max(0, total - limit);
      const randomOffset = Math.floor(Math.random() * (maxOffset + 1));

      // Fetch with random offset (customOffset will cause markets to be replaced)
      fetchMarkets(query, category, sortBy, sortOrder, limit, false, forceRefresh, randomOffset);
    } else {
      fetchMarkets(query, category, sortBy, sortOrder, limit, true, forceRefresh);
    }
  }, [fetchMarkets, query, category, sortBy, sortOrder, limit, total]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchMarkets(query, category, sortBy, sortOrder, limit, false, false);
    }
  }, [fetchMarkets, query, category, sortBy, sortOrder, limit, loading, hasMore]);

  return {
    markets,
    loading,
    error,
    hasMore,
    total,
    refetch,
    loadMore,
    isLive,
  };
}
