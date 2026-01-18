'use client';

import { useState, useEffect, useCallback } from 'react';
import { Market, PricePoint, TimeRange } from '@/types';

interface UseMarketDetailReturn {
  market: Market | null;
  priceHistory: PricePoint[];
  loading: boolean;
  historyLoading: boolean;
  error: string | null;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  refetch: () => void;
  isLive: boolean;
}

export function useMarketDetail(marketId: string | null): UseMarketDetailReturn {
  const [market, setMarket] = useState<Market | null>(null);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('24H');
  const [isLive, setIsLive] = useState(true);

  const fetchMarket = useCallback(async () => {
    if (!marketId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/market/${encodeURIComponent(marketId)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Market not found');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch market');
      }

      const data: Market = await response.json();
      setMarket(data);
      setIsLive(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useMarketDetail] Error:', errorMessage);
      setError(errorMessage);
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  }, [marketId]);

  const fetchHistory = useCallback(async (range: TimeRange) => {
    if (!marketId) return;

    try {
      setHistoryLoading(true);

      const response = await fetch(
        `/api/market/${encodeURIComponent(marketId)}/history?range=${range}`
      );
      
      if (!response.ok) {
        console.error('[useMarketDetail] History fetch failed:', response.status);
        setPriceHistory([]);
        return;
      }

      const data = await response.json();
      setPriceHistory(data.history || []);
    } catch (err) {
      console.error('[useMarketDetail] History error:', err);
      setPriceHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [marketId]);

  // Fetch market on mount or ID change
  useEffect(() => {
    fetchMarket();
  }, [fetchMarket]);

  // Fetch history when market loads or time range changes
  useEffect(() => {
    if (market) {
      fetchHistory(timeRange);
    }
  }, [market?.id, timeRange, fetchHistory]);

  const handleSetTimeRange = useCallback((range: TimeRange) => {
    setTimeRange(range);
  }, []);

  const refetch = useCallback(() => {
    fetchMarket();
    if (market) {
      fetchHistory(timeRange);
    }
  }, [fetchMarket, fetchHistory, market, timeRange]);

  return {
    market,
    priceHistory,
    loading,
    historyLoading,
    error,
    timeRange,
    setTimeRange: handleSetTimeRange,
    refetch,
    isLive,
  };
}
