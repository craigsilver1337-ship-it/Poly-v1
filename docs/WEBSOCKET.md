# Polymarket WebSocket Integration

This document describes the WebSocket integration for real-time price and orderbook updates from Polymarket.

## WebSocket Endpoint

```
wss://ws-subscriptions-clob.polymarket.com
```

## Features

- **Real-time price updates** for markets
- **Live orderbook updates** (bids/asks)
- **Automatic reconnection** with exponential backoff
- **Subscription management** - subscribe/unsubscribe to tokens
- **Connection status** tracking

## Usage

### Basic Setup

The WebSocket client automatically connects when you use any of the hooks. You can also manually connect:

```typescript
import { connectWebSocket } from '@/lib/polymarket/websocket';

// Connect early in app lifecycle (e.g., in _app.tsx or layout)
await connectWebSocket();
```

### Using Live Price Hook

```typescript
import { useMarketLivePrice } from '@/hooks/useLivePrices';
import { Market } from '@/types';

function MarketCard({ market }: { market: Market }) {
  const { price, isLive, isConnected } = useMarketLivePrice(market);
  
  return (
    <div>
      <p>Price: {price?.toFixed(3)}</p>
      {isLive && <span className="text-green-500">🔴 Live</span>}
    </div>
  );
}
```

### Using Live Price Indicator Component

```typescript
import { LivePriceIndicator } from '@/components/realtime';

function MarketCard({ market }: { market: Market }) {
  return (
    <div>
      <LivePriceIndicator market={market} />
    </div>
  );
}
```

### Check WebSocket Status

```typescript
import { useWebSocketStatus } from '@/hooks/useWebSocket';

function StatusBar() {
  const { isConnected } = useWebSocketStatus();
  
  return (
    <div>
      {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
    </div>
  );
}
```

## How It Works

1. **Client connects** to `wss://ws-subscriptions-clob.polymarket.com`
2. **Subscribe to tokens** by sending `{ type: 'subscribe', channel: 'price', token_id: '...' }`
3. **Receive updates** via WebSocket messages
4. **Hooks update** React components automatically
5. **Auto-reconnect** on connection loss

## Message Format

### Subscribe to Price Updates
```json
{
  "type": "subscribe",
  "channel": "price",
  "token_id": "0x1234..."
}
```

### Subscribe to Orderbook Updates
```json
{
  "type": "subscribe",
  "channel": "orderbook",
  "token_id": "0x1234..."
}
```

### Price Update Message (Received)
```json
{
  "type": "price",
  "data": {
    "token_id": "0x1234...",
    "price": "0.65",
    "side": "buy"
  }
}
```

### Orderbook Update Message (Received)
```json
{
  "type": "orderbook",
  "data": {
    "token_id": "0x1234...",
    "bids": [{"price": "0.64", "size": "1000"}],
    "asks": [{"price": "0.66", "size": "500"}]
  }
}
```

## Token ID

The `token_id` is the CLOB token ID from the market outcome. You can find it in:
- `market.outcomes[0].id` - for YES outcome
- `market.outcomes[1].id` - for NO outcome

**Note:** Not all markets have valid CLOB token IDs. Check if the token ID exists before subscribing.

## Reconnection

The WebSocket client automatically:
- Reconnects on connection loss
- Uses exponential backoff (1s, 2s, 4s, ... up to 30s)
- Resubscribes to all active subscriptions after reconnect
- Max 5 reconnection attempts

## Performance Considerations

- **Multiple subscriptions** are managed efficiently
- **Unsubscribe** when components unmount to free resources
- **Heartbeat** ping every 30 seconds to keep connection alive
- **Batching** updates to prevent UI overload

## Integration with Existing Code

The WebSocket integration is **additive** - it doesn't break existing REST API calls:

1. **Initial load**: Uses REST API (as before)
2. **Live updates**: WebSocket provides real-time updates
3. **Fallback**: If WebSocket fails, REST API still works

## Future Enhancements

Potential improvements:
- [ ] Trade feed subscriptions
- [ ] User-specific channels (authenticated)
- [ ] Volume spike detection
- [ ] Large trade notifications
- [ ] Price alert subscriptions

## Troubleshooting

### WebSocket not connecting
- Check browser console for errors
- Verify the WebSocket URL is correct
- Check network/firewall settings

### No price updates
- Verify token ID is valid (not containing '-')
- Check subscription messages in console
- Ensure WebSocket is connected (`useWebSocketStatus`)

### High CPU usage
- Reduce number of active subscriptions
- Unsubscribe from markets when not visible
- Check for memory leaks in components

