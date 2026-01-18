/**
 * Polymarket WebSocket Client
 * Real-time price and orderbook updates via WebSocket
 * 
 * WebSocket URL: wss://ws-subscriptions-clob.polymarket.com
 */

export interface PriceUpdate {
  token_id: string;
  price: string;
  side?: 'buy' | 'sell';
  timestamp?: number;
}

export interface OrderbookUpdate {
  token_id: string;
  bids: { price: string; size: string }[];
  asks: { price: string; size: string }[];
}

export interface TradeUpdate {
  token_id: string;
  price: string;
  size: string;
  side: 'buy' | 'sell';
  timestamp: number;
}

export type WebSocketMessage = 
  | { type: 'price'; data: PriceUpdate }
  | { type: 'orderbook'; data: OrderbookUpdate }
  | { type: 'trade'; data: TradeUpdate }
  | { type: 'subscription_success'; channel: string; token_id: string }
  | { type: 'error'; message: string };

type SubscriptionCallback = (message: WebSocketMessage) => void;

const WS_URL = 'wss://ws-subscriptions-clob.polymarket.com';

class PolymarketWebSocketClient {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<SubscriptionCallback>> = new Map();
  private subscriptions: Set<string> = new Set(); // Track subscribed token_ids
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private shouldReconnect = true;

  /**
   * Connect to WebSocket
   */
  connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (this.isConnecting) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(WS_URL);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected to Polymarket');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;

          // Resubscribe to all previous subscriptions
          this.resubscribeAll();

          // Start heartbeat/ping
          this.startHeartbeat();

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          this.isConnecting = false;
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('[WebSocket] Connection closed', event.code, event.reason);
          this.isConnecting = false;
          this.stopHeartbeat();

          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Subscribe to price updates for a token
   */
  subscribePrice(tokenId: string, callback: SubscriptionCallback): () => void {
    const key = `price:${tokenId}`;
    
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);

    // Subscribe if not already subscribed
    if (!this.subscriptions.has(tokenId)) {
      this.sendSubscription('price', tokenId);
      this.subscriptions.add(tokenId);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(key);
          this.unsubscribe('price', tokenId);
        }
      }
    };
  }

  /**
   * Subscribe to orderbook updates for a token
   */
  subscribeOrderbook(tokenId: string, callback: SubscriptionCallback): () => void {
    const key = `orderbook:${tokenId}`;
    
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);

    if (!this.subscriptions.has(tokenId)) {
      this.sendSubscription('orderbook', tokenId);
      this.subscriptions.add(tokenId);
    }

    return () => {
      const callbacks = this.subscribers.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(key);
          this.unsubscribe('orderbook', tokenId);
        }
      }
    };
  }

  /**
   * Send subscription message
   */
  private sendSubscription(channel: 'price' | 'orderbook', tokenId: string) {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      // Queue subscription for when connection opens
      this.connect().then(() => {
        this.sendSubscription(channel, tokenId);
      });
      return;
    }

    const message = {
      type: 'subscribe',
      channel,
      token_id: tokenId,
    };

    this.ws.send(JSON.stringify(message));
    console.log(`[WebSocket] Subscribed to ${channel}:${tokenId}`);
  }

  /**
   * Unsubscribe from updates
   */
  private unsubscribe(channel: 'price' | 'orderbook', tokenId: string) {
    if (this.ws?.readyState !== WebSocket.OPEN) return;

    const message = {
      type: 'unsubscribe',
      channel,
      token_id: tokenId,
    };

    this.ws.send(JSON.stringify(message));
    this.subscriptions.delete(tokenId);
    console.log(`[WebSocket] Unsubscribed from ${channel}:${tokenId}`);
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(rawMessage: any) {
    // Handle different message types based on Polymarket WebSocket format
    // Adjust based on actual message structure from Polymarket

    if (rawMessage.type === 'price' || rawMessage.data?.type === 'price') {
      const priceData = rawMessage.data || rawMessage;
      const tokenId = priceData.token_id;
      const key = `price:${tokenId}`;
      
      this.notifySubscribers(key, {
        type: 'price',
        data: {
          token_id: tokenId,
          price: priceData.price,
          side: priceData.side,
          timestamp: Date.now(),
        },
      });
    } else if (rawMessage.type === 'orderbook' || rawMessage.data?.type === 'orderbook') {
      const orderbookData = rawMessage.data || rawMessage;
      const tokenId = orderbookData.token_id;
      const key = `orderbook:${tokenId}`;
      
      this.notifySubscribers(key, {
        type: 'orderbook',
        data: {
          token_id: tokenId,
          bids: orderbookData.bids || [],
          asks: orderbookData.asks || [],
        },
      });
    } else if (rawMessage.type === 'trade' || rawMessage.data?.type === 'trade') {
      const tradeData = rawMessage.data || rawMessage;
      const tokenId = tradeData.token_id;
      // Notify all subscribers for trades
      this.subscribers.forEach((callbacks, key) => {
        if (key.includes(tokenId)) {
          this.notifySubscribers(key, {
            type: 'trade',
            data: tradeData,
          });
        }
      });
    } else if (rawMessage.type === 'subscription_success') {
      console.log('[WebSocket] Subscription confirmed:', rawMessage.channel, rawMessage.token_id);
    } else if (rawMessage.type === 'error') {
      console.error('[WebSocket] Error message:', rawMessage.message);
    }
  }

  /**
   * Notify all subscribers for a key
   */
  private notifySubscribers(key: string, message: WebSocketMessage) {
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(message);
        } catch (error) {
          console.error('[WebSocket] Callback error:', error);
        }
      });
    }
  }

  /**
   * Resubscribe to all active subscriptions after reconnect
   */
  private resubscribeAll() {
    const tokenIds = Array.from(this.subscriptions);
    tokenIds.forEach((tokenId) => {
      // Check which channels need resubscription
      const priceKey = `price:${tokenId}`;
      const orderbookKey = `orderbook:${tokenId}`;

      if (this.subscribers.has(priceKey)) {
        this.sendSubscription('price', tokenId);
      }
      if (this.subscribers.has(orderbookKey)) {
        this.sendSubscription('orderbook', tokenId);
      }
    });
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect().catch(() => {
          // Reconnection will be retried by scheduleReconnect
        });
      }
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // Send ping if server requires it
        // Adjust based on Polymarket's heartbeat requirements
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    this.shouldReconnect = false;
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.subscribers.clear();
    this.subscriptions.clear();
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
let wsClient: PolymarketWebSocketClient | null = null;

/**
 * Get or create WebSocket client instance
 */
export function getWebSocketClient(): PolymarketWebSocketClient {
  if (!wsClient) {
    wsClient = new PolymarketWebSocketClient();
  }
  return wsClient;
}

/**
 * Connect to WebSocket (call this early in app lifecycle)
 */
export async function connectWebSocket(): Promise<void> {
  const client = getWebSocketClient();
  await client.connect();
}

/**
 * Disconnect WebSocket
 */
export function disconnectWebSocket(): void {
  if (wsClient) {
    wsClient.disconnect();
    wsClient = null;
  }
}

