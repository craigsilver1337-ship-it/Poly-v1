'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLivePrice } from './useWebSocket';
import { Market } from '@/types';

/**
 * Hook to subscribe to live prices for multiple markets
 * Useful for the markets list page
 */
export function useLivePrices(markets: Market[]) {
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});

  // Extract token IDs from markets
  const tokenMap = new Map<string, string>(); // marketId -> tokenId
  markets.forEach((market) => {
    const tokenId = market.outcomes[0]?.id;
    if (tokenId && !tokenId.includes('-')) {
      tokenMap.set(market.id, tokenId);
    }
  });

  // Update live prices when any price changes
  const updatePrice = useCallback((marketId: string, price: number | null) => {
    if (price !== null) {
      setLivePrices((prev) => ({
        ...prev,
        [marketId]: price,
      }));
    }
  }, []);

  return { livePrices, tokenMap };
}

/**
 * Hook to get live price for a single market
 * Returns the live price if available, otherwise falls back to market price
 */
export function useMarketLivePrice(market: Market | null) {
  const tokenId = market?.outcomes[0]?.id;
  const { price: livePrice, isConnected } = useLivePrice(tokenId);

  // Return live price if available, otherwise use market price
  const currentPrice = livePrice ?? market?.outcomes[0]?.price ?? null;

  return {
    price: currentPrice,
    isLive: isConnected && livePrice !== null,
    isConnected,
  };
}

