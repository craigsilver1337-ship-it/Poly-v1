'use client';

import { useMemo, useState } from 'react';
import { PayoffSurfacePoint } from '@/types';
import { formatUSD } from '@/lib/formatters';
import { motion } from 'framer-motion';

interface PayoffHeatmapProps {
  data: PayoffSurfacePoint[];
  minPayoff: number;
  maxPayoff: number;
  probabilitySteps?: number;
  timeSteps?: number;
}

export function PayoffHeatmap({
  data,
  minPayoff,
  maxPayoff,
  probabilitySteps = 20,
  timeSteps = 10,
}: PayoffHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<PayoffSurfacePoint | null>(null);

  // Create a 2D grid from the data
  const grid = useMemo(() => {
    const result: (PayoffSurfacePoint | null)[][] = [];
    
    for (let t = 0; t <= timeSteps; t++) {
      const row: (PayoffSurfacePoint | null)[] = [];
      for (let p = 0; p <= probabilitySteps; p++) {
        const point = data.find(
          (d) =>
            Math.round(d.probability * probabilitySteps) === p &&
            Math.round((d.daysToResolution / 180) * timeSteps) === t
        );
        row.push(point || null);
      }
      result.push(row);
    }
    
    return result;
  }, [data, probabilitySteps, timeSteps]);

  // Color interpolation
  const getColor = (payoff: number): string => {
    const range = maxPayoff - minPayoff;
    if (range === 0) return 'rgb(39, 39, 42)'; // border color
    
    const normalized = (payoff - minPayoff) / range;
    
    if (payoff >= 0) {
      // Green gradient for profit
      const intensity = payoff / Math.max(maxPayoff, 1);
      return `rgba(34, 197, 94, ${0.1 + intensity * 0.6})`;
    } else {
      // Red gradient for loss
      const intensity = Math.abs(payoff) / Math.max(Math.abs(minPayoff), 1);
      return `rgba(234, 88, 12, ${0.1 + intensity * 0.6})`;
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <h3 className="text-sm font-medium text-text-primary mb-2">
        Payoff Surface (Probability × Time)
      </h3>
      <p className="text-xs text-text-secondary mb-4">
        Shows how payoff changes with probability and time-to-resolution
      </p>

      <div className="relative">
        {/* Axis labels */}
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-text-secondary whitespace-nowrap">
          Days to Resolution →
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6 text-xs text-text-secondary">
          Probability →
        </div>

        {/* Heatmap grid */}
        <div className="ml-6 mb-6">
          <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${probabilitySteps + 1}, 1fr)` }}>
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <motion.div
                  key={`${rowIndex}-${colIndex}`}
                  className="aspect-square rounded-sm cursor-pointer transition-all"
                  style={{
                    backgroundColor: cell ? getColor(cell.payoff) : '#18181b',
                    minWidth: '12px',
                    minHeight: '12px',
                  }}
                  whileHover={{ scale: 1.2, zIndex: 10 }}
                  onMouseEnter={() => cell && setHoveredCell(cell)}
                  onMouseLeave={() => setHoveredCell(null)}
                />
              ))
            )}
          </div>

          {/* Axis tick labels */}
          <div className="flex justify-between mt-1 text-[10px] text-text-secondary">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-text-secondary">
          <span>180d</span>
          <span>90d</span>
          <span>0d</span>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-background rounded-lg border border-border"
        >
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-text-secondary">Probability</p>
              <p className="font-medium text-text-primary">
                {(hoveredCell.probability * 100).toFixed(0)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">Days to Resolution</p>
              <p className="font-medium text-text-primary">
                {Math.round(hoveredCell.daysToResolution)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">Discounted Payoff</p>
              <p className={`font-medium ${hoveredCell.payoff >= 0 ? 'text-success' : 'text-bearish'}`}>
                {hoveredCell.payoff >= 0 ? '+' : ''}{formatUSD(hoveredCell.payoff)}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Color legend */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-16 h-3 rounded bg-gradient-to-r from-bearish/60 via-background to-success/60" />
          <div className="flex justify-between text-[10px] text-text-secondary w-24">
            <span>{formatUSD(minPayoff)}</span>
            <span>{formatUSD(maxPayoff)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
