'use client';

import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { Position } from '@/types';
import { Button, Input } from '@/components/ui';
import { formatPrice } from '@/lib/formatters';

interface PositionCardProps {
  position: Position;
  onRemove: () => void;
  onUpdateStake: (stake: number) => void;
  onToggleSide: () => void;
}

export function PositionCard({
  position,
  onRemove,
  onUpdateStake,
  onToggleSide,
}: PositionCardProps) {
  const { market, side, stake, entryPrice } = position;
  const isYes = side === 'YES';

  return (
    <div className="bg-background border border-border rounded-lg p-3">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm text-text-primary line-clamp-2 flex-1 pr-2">
          {market.question}
        </h4>
        <button
          onClick={onRemove}
          className="text-text-secondary hover:text-bearish transition-colors p-1"
        >
          <X size={14} />
        </button>
      </div>

      {/* Side toggle and price */}
      <div className="flex items-center gap-2 mb-3">
        <Button
          variant={isYes ? 'bullish' : 'secondary'}
          size="sm"
          onClick={onToggleSide}
          className="flex-1"
        >
          <TrendingUp size={14} className="mr-1" />
          YES @ {formatPrice(market.outcomes[0]?.price || 0.5)}
        </Button>
        <Button
          variant={!isYes ? 'bearish' : 'secondary'}
          size="sm"
          onClick={onToggleSide}
          className="flex-1"
        >
          <TrendingDown size={14} className="mr-1" />
          NO @ {formatPrice(market.outcomes[1]?.price || 0.5)}
        </Button>
      </div>

      {/* Stake input */}
      <div>
        <label className="text-xs text-text-secondary mb-1 block">Stake (USD)</label>
        <Input
          type="number"
          value={stake}
          onChange={(e) => onUpdateStake(Math.max(0, parseFloat(e.target.value) || 0))}
          min={0}
          step={10}
          className="text-sm"
        />
      </div>

      {/* Position summary */}
      <div className="mt-2 pt-2 border-t border-border flex justify-between text-xs">
        <span className="text-text-secondary">Entry Price</span>
        <span className={`font-medium ${isYes ? 'text-bullish' : 'text-bearish'}`}>
          {formatPrice(entryPrice)}
        </span>
      </div>
    </div>
  );
}
