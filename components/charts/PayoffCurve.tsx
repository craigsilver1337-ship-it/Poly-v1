'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import { PayoffPoint } from '@/types';
import { formatUSD } from '@/lib/formatters';

interface PayoffCurveProps {
  data: PayoffPoint[];
  breakEvenProbability?: number;
  currentProbability?: number;
}

export function PayoffCurve({ data, breakEvenProbability, currentProbability }: PayoffCurveProps) {
  const chartData = useMemo(() => {
    return data.map((point) => ({
      ...point,
      probabilityPercent: Math.round(point.probability * 100),
      positive: point.payoff > 0 ? point.payoff : 0,
      negative: point.payoff < 0 ? point.payoff : 0,
    }));
  }, [data]);

  const { minPayoff, maxPayoff } = useMemo(() => {
    if (data.length === 0) return { minPayoff: -100, maxPayoff: 100 };
    const payoffs = data.map((d) => d.payoff);
    const min = Math.min(...payoffs);
    const max = Math.max(...payoffs);
    const padding = Math.max(Math.abs(min), Math.abs(max)) * 0.1;
    return {
      minPayoff: min - padding,
      maxPayoff: max + padding,
    };
  }, [data]);

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <h3 className="text-sm font-medium text-text-primary mb-4">Payoff vs Probability</h3>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="payoffPositive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="payoffNegative" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#ea580c" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ea580c" stopOpacity={0} />
              </linearGradient>
            </defs>
            
            <XAxis
              dataKey="probabilityPercent"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#a1a1aa', fontSize: 10 }}
              tickFormatter={(v) => `${v}%`}
            />
            
            <YAxis
              domain={[minPayoff, maxPayoff]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#a1a1aa', fontSize: 10 }}
              tickFormatter={(v) => formatUSD(v)}
              width={50}
            />
            
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const data = payload[0].payload;
                const isProfit = data.payoff >= 0;
                return (
                  <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-xl">
                    <p className="text-xs text-text-secondary">
                      At {data.probabilityPercent}% probability
                    </p>
                    <p className={`text-sm font-medium ${isProfit ? 'text-success' : 'text-bearish'}`}>
                      {isProfit ? '+' : ''}{formatUSD(data.payoff)}
                    </p>
                    <p className={`text-xs ${isProfit ? 'text-success' : 'text-bearish'}`}>
                      {isProfit ? '+' : ''}{data.percentReturn.toFixed(1)}% return
                    </p>
                  </div>
                );
              }}
            />
            
            {/* Zero line */}
            <ReferenceLine y={0} stroke="#27272a" strokeDasharray="3 3" />
            
            {/* Break-even line */}
            {breakEvenProbability !== undefined && (
              <ReferenceLine
                x={Math.round(breakEvenProbability * 100)}
                stroke="#eab308"
                strokeDasharray="3 3"
                label={{
                  value: 'B/E',
                  position: 'top',
                  fill: '#eab308',
                  fontSize: 10,
                }}
              />
            )}
            
            {/* Current probability line */}
            {currentProbability !== undefined && (
              <ReferenceLine
                x={Math.round(currentProbability * 100)}
                stroke="#2563eb"
                strokeWidth={2}
                label={{
                  value: 'Current',
                  position: 'top',
                  fill: '#2563eb',
                  fontSize: 10,
                }}
              />
            )}
            
            {/* Positive area */}
            <Area
              type="monotone"
              dataKey="positive"
              fill="url(#payoffPositive)"
              stroke="none"
            />
            
            {/* Negative area */}
            <Area
              type="monotone"
              dataKey="negative"
              fill="url(#payoffNegative)"
              stroke="none"
            />
            
            {/* Payoff line */}
            <Line
              type="monotone"
              dataKey="payoff"
              stroke="#fafafa"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#fafafa' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-text-secondary">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-success rounded-full" />
          <span>Profit Zone</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-bearish rounded-full" />
          <span>Loss Zone</span>
        </div>
        {breakEvenProbability !== undefined && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-warning" />
            <span>Break-even</span>
          </div>
        )}
      </div>
    </div>
  );
}
