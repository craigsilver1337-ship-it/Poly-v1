'use client';

import { StrategyAnalysis } from '@/types';
import { PayoffCurve } from '@/components/charts/PayoffCurve';
import { PayoffHeatmap } from '@/components/charts/PayoffHeatmap';
import { Slider, Card } from '@/components/ui';
import { formatUSD } from '@/lib/formatters';
import { TrendingUp, TrendingDown, Target, Clock, DollarSign } from 'lucide-react';

interface PayoffSurfaceProps {
  analysis: StrategyAnalysis;
  discountRate: number;
  onDiscountRateChange: (rate: number) => void;
  currentProbability?: number;
}

export function PayoffSurface({
  analysis,
  discountRate,
  onDiscountRateChange,
  currentProbability,
}: PayoffSurfaceProps) {
  const {
    totalStake,
    expectedPayoff,
    expectedReturn,
    maxProfit,
    maxLoss,
    breakEvenProbability,
    payoffCurve,
    payoffSurface,
  } = analysis;

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card padding="sm" className="text-center">
          <DollarSign size={16} className="mx-auto mb-1 text-text-secondary" />
          <p className="text-xs text-text-secondary">Total Stake</p>
          <p className="text-lg font-bold text-text-primary">{formatUSD(totalStake)}</p>
        </Card>
        
        <Card padding="sm" className="text-center">
          <Target size={16} className="mx-auto mb-1 text-text-secondary" />
          <p className="text-xs text-text-secondary">Expected Return</p>
          <p className={`text-lg font-bold ${expectedReturn >= 0 ? 'text-success' : 'text-bearish'}`}>
            {expectedReturn >= 0 ? '+' : ''}{expectedReturn.toFixed(1)}%
          </p>
        </Card>
        
        <Card padding="sm" className="text-center">
          <TrendingUp size={16} className="mx-auto mb-1 text-success" />
          <p className="text-xs text-text-secondary">Max Profit</p>
          <p className="text-lg font-bold text-success">+{formatUSD(maxProfit)}</p>
        </Card>
        
        <Card padding="sm" className="text-center">
          <TrendingDown size={16} className="mx-auto mb-1 text-bearish" />
          <p className="text-xs text-text-secondary">Max Loss</p>
          <p className="text-lg font-bold text-bearish">{formatUSD(maxLoss)}</p>
        </Card>
      </div>

      {/* Discount rate slider */}
      <Card padding="sm">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={16} className="text-text-secondary" />
          <span className="text-sm font-medium text-text-primary">Time-Value Discount Rate</span>
        </div>
        <Slider
          value={discountRate * 100}
          onChange={(e) => onDiscountRateChange(parseFloat(e.target.value) / 100)}
          min={0}
          max={30}
          step={1}
          formatValue={(v) => `${v}% APR`}
        />
        <p className="text-xs text-text-secondary mt-2">
          Higher rates discount future payoffs more heavily, penalizing longer time-to-resolution.
        </p>
      </Card>

      {/* Time-weighted EV */}
      <Card padding="sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-secondary">Time-Weighted Expected Value</p>
            <p className="text-xs text-text-secondary">
              Accounts for opportunity cost of locked capital
            </p>
          </div>
          <div className="text-right">
            <p className={`text-xl font-bold ${payoffSurface.timeWeightedEV >= 0 ? 'text-success' : 'text-bearish'}`}>
              {payoffSurface.timeWeightedEV >= 0 ? '+' : ''}{formatUSD(payoffSurface.timeWeightedEV)}
            </p>
            <p className="text-xs text-text-secondary">
              vs {formatUSD(payoffSurface.expectedValue)} undiscounted
            </p>
          </div>
        </div>
      </Card>

      {/* Payoff curve */}
      <PayoffCurve
        data={payoffCurve}
        breakEvenProbability={breakEvenProbability}
        currentProbability={currentProbability}
      />

      {/* Payoff heatmap (WOW feature!) */}
      <PayoffHeatmap
        data={payoffSurface.points}
        minPayoff={payoffSurface.minPayoff}
        maxPayoff={payoffSurface.maxPayoff}
      />

      {/* Break-even info */}
      <Card padding="sm">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Break-Even Probability</span>
          <span className="text-sm font-medium text-warning">
            {(breakEvenProbability * 100).toFixed(1)}%
          </span>
        </div>
        <p className="text-xs text-text-secondary mt-1">
          The market needs to move to this probability for you to break even.
        </p>
      </Card>
    </div>
  );
}
