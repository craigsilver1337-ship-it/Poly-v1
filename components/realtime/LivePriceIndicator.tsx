'use client';

import { motion } from 'framer-motion';
import { Radio, Wifi, WifiOff } from 'lucide-react';
import { useMarketLivePrice } from '@/hooks/useLivePrices';
import { Market } from '@/types';

interface LivePriceIndicatorProps {
  market: Market;
  className?: string;
}

/**
 * Component to show live price with connection indicator
 */
export function LivePriceIndicator({ market, className = '' }: LivePriceIndicatorProps) {
  const { price, isLive, isConnected } = useMarketLivePrice(market);
  const basePrice = market.outcomes[0]?.price ?? 0;

  // Determine if price changed (for animation)
  const hasChanged = price !== null && Math.abs(price - basePrice) > 0.001;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-semibold">{price ? price.toFixed(3) : basePrice.toFixed(3)}</span>
      
      {isLive && (
        <motion.div
          initial={{ scale: 1 }}
          animate={hasChanged ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-1"
        >
          <Radio
            size={12}
            className={isConnected ? 'text-green-500' : 'text-gray-500'}
            fill={isConnected ? 'currentColor' : 'none'}
          />
          <span className="text-xs text-green-500">Live</span>
        </motion.div>
      )}

      {!isConnected && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <WifiOff size={12} />
          <span>Offline</span>
        </div>
      )}
    </div>
  );
}

