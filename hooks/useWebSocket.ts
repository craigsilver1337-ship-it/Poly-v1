'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getWebSocketClient, PriceUpdate, OrderbookUpdate, TradeUpdate, WebSocketMessage } from '@/lib/polymarket/websocket';

interface UsePriceSubscriptionReturn {
  price: number | null;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
}

interface UseOrderbookSubscriptionReturn {
  bids: { price: string; size: string }[];
  asks: { price: string; size: string }[];
  loading: boolean;
  error: string | null;
  isConnected: boolean;
}

/**
 * Hook to subscribe to live price updates for a token
 */
export function useLivePrice(tokenId: string | undefined | null): UsePriceSubscriptionReturn {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const callbackRef = useRef<(message: WebSocketMessage) => void>();

  useEffect(() => {
    if (!tokenId) {
      setPrice(null);
      setLoading(false);
      return;
    }

    const client = getWebSocketClient();
    setIsConnected(client.isConnected());

    // Connect if not already connected
    if (!client.isConnected()) {
      client.connect().then(() => {
        setIsConnected(true);
      }).catch((err) => {
        setError('Failed to connect to WebSocket');
        console.error('[useLivePrice] Connection error:', err);
      });
    }

    // Create callback for price updates
    const callback = (message: WebSocketMessage) => {
      if (message.type === 'price') {
        const priceValue = parseFloat(message.data.price);
        if (!isNaN(priceValue) && priceValue >= 0 && priceValue <= 1) {
          setPrice(priceValue);
          setLoading(false);
          setError(null);
        }
      }
    };

    callbackRef.current = callback;

    // Subscribe to price updates
    const unsubscribe = client.subscribePrice(tokenId, callback);

    return () => {
      unsubscribe();
    };
  }, [tokenId]);

  // Update connection status
  useEffect(() => {
    const checkConnection = setInterval(() => {
      const client = getWebSocketClient();
      setIsConnected(client.isConnected());
    }, 1000);

    return () => clearInterval(checkConnection);
  }, []);

  return { price, loading, error, isConnected };
}

/**
 * Hook to subscribe to orderbook updates for a token
 */
export function useLiveOrderbook(tokenId: string | undefined | null): UseOrderbookSubscriptionReturn {
  const [bids, setBids] = useState<{ price: string; size: string }[]>([]);
  const [asks, setAsks] = useState<{ price: string; size: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!tokenId) {
      setBids([]);
      setAsks([]);
      setLoading(false);
      return;
    }

    const client = getWebSocketClient();
    setIsConnected(client.isConnected());

    // Connect if not already connected
    if (!client.isConnected()) {
      client.connect().then(() => {
        setIsConnected(true);
      }).catch((err) => {
        setError('Failed to connect to WebSocket');
        console.error('[useLiveOrderbook] Connection error:', err);
      });
    }

    // Create callback for orderbook updates
    const callback = (message: WebSocketMessage) => {
      if (message.type === 'orderbook') {
        setBids(message.data.bids || []);
        setAsks(message.data.asks || []);
        setLoading(false);
        setError(null);
      }
    };

    // Subscribe to orderbook updates
    const unsubscribe = client.subscribeOrderbook(tokenId, callback);

    return () => {
      unsubscribe();
    };
  }, [tokenId]);

  // Update connection status
  useEffect(() => {
    const checkConnection = setInterval(() => {
      const client = getWebSocketClient();
      setIsConnected(client.isConnected());
    }, 1000);

    return () => clearInterval(checkConnection);
  }, []);

  return { bids, asks, loading, error, isConnected };
}

/**
 * Hook to get WebSocket connection status
 */
export function useWebSocketStatus() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const client = getWebSocketClient();
    setIsConnected(client.isConnected());

    // Auto-connect on mount
    if (!client.isConnected()) {
      client.connect().then(() => {
        setIsConnected(true);
      }).catch(() => {
        setIsConnected(false);
      });
    }

    const checkConnection = setInterval(() => {
      setIsConnected(client.isConnected());
    }, 1000);

    return () => clearInterval(checkConnection);
  }, []);

  return { isConnected };
}

