'use client';

import Link from 'next/link';
import { Market } from '@/types';
import { FuturisticMarketCard } from './FuturisticMarketCard';
import { MarketCardSkeleton } from '@/components/ui';
import { formatCompactNumber, formatRelativeDate } from '@/lib/formatters';

interface MarketGridProps {
  markets: Market[];
  loading?: boolean;
  onAddToCluster?: (market: Market) => void;
  onResearch?: (market: Market) => void;
  showAddButtons?: boolean;
  selectedMarketIds?: Set<string>; // Track selected markets for cluster
  sparklineData?: Record<string, number[]>;
}

export function MarketGrid({
  markets,
  loading = false,
  onAddToCluster,
  onResearch,
  showAddButtons = false,
  selectedMarketIds = new Set(),
  sparklineData = {},
}: MarketGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <MarketCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">No markets found</p>
        <p className="text-sm text-text-secondary mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {markets.map((market, index) => {
        const yesOutcome = market.outcomes[0];
        const yesPrice = yesOutcome?.price || 0;
        const priceChange = yesOutcome?.priceChange24h || 0;

        // Prepare props matching the user's interface
        const outcomeYesPercent = parseFloat((yesPrice * 100).toFixed(1));
        const priceChange24h = parseFloat((priceChange * 100).toFixed(1));
        const volumeStr = `$${formatCompactNumber(market.volume)}`;
        const endDateStr = formatRelativeDate(market.endDate).replace(/^In /, 'Ends in ');
        const isLive = market.active && !market.closed;

        // Map sparkline data (number[]) to Recharts data ({ value: number }[])
        const historyData = (sparklineData[market.id] || []).map(val => ({ value: val }));

        // Shared card component
        const card = (
          <FuturisticMarketCard
            id={market.id}
            title={market.question}
            image={market.imageUrl || '/placeholder-market.jpg'}
            outcomeYesPercent={outcomeYesPercent}
            priceChange24h={priceChange24h}
            volume={volumeStr}
            endDate={endDateStr}
            isLive={isLive}
            PriceHistory={historyData}
            onResearch={() => onResearch?.(market)}
            isInCluster={selectedMarketIds.has(market.id)}
          />
        );

        return (
          <div key={market.id}>
            {onAddToCluster ? (
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddToCluster(market);
                }}
              >
                {card}
              </div>
            ) : (
              <Link href={`/market/${encodeURIComponent(market.id)}`}>
                {card}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
