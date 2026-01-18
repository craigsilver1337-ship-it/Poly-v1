'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, TrendingUp, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useState } from 'react';
import { ScannerFlag as ScannerFlagType } from '@/types';
import { Button, Badge } from '@/components/ui';
import { formatUSD, truncate } from '@/lib/formatters';

interface ScannerFlagProps {
  flag: ScannerFlagType;
  onAddToStrategy?: (flag: ScannerFlagType) => void;
}

export function ScannerFlag({ flag, onAddToStrategy }: ScannerFlagProps) {
  const [expanded, setExpanded] = useState(false);

  const severityIcons = {
    high: <AlertTriangle size={16} className="text-bearish" />,
    medium: <AlertCircle size={16} className="text-warning" />,
    low: <Info size={16} className="text-bullish" />,
  };

  const severityColors = {
    high: 'border-bearish/30 bg-bearish/5',
    medium: 'border-warning/30 bg-warning/5',
    low: 'border-bullish/30 bg-bullish/5',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-lg ${severityColors[flag.severity]}`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 text-left"
      >
        <div className="mt-0.5">{severityIcons[flag.severity]}</div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-text-primary">{flag.title}</h4>
            <Badge
              variant={flag.severity === 'high' ? 'error' : flag.severity === 'medium' ? 'warning' : 'default'}
              size="sm"
            >
              {flag.severityScore}
            </Badge>
          </div>
          <p className="text-xs text-text-secondary line-clamp-2">{flag.explanation}</p>
        </div>

        {expanded ? (
          <ChevronUp size={16} className="text-text-secondary flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-text-secondary flex-shrink-0" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="px-4 pb-4 border-t border-border/50"
        >
          {/* Affected markets */}
          <div className="mt-4">
            <h5 className="text-xs font-medium text-text-secondary uppercase mb-2">
              Affected Markets
            </h5>
            <div className="space-y-2">
              {flag.affectedMarkets.map((market) => (
                <div
                  key={market.id}
                  className="flex items-center justify-between bg-background/50 rounded-lg p-2"
                >
                  <span className="text-xs text-text-primary">
                    {truncate(market.question, 50)}
                  </span>
                  <span className="text-xs font-mono text-bullish">
                    {((market.outcomes[0]?.price || 0.5) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested trades */}
          <div className="mt-4">
            <h5 className="text-xs font-medium text-text-secondary uppercase mb-2">
              Suggested Trades (Demo)
            </h5>
            <div className="space-y-2">
              {flag.suggestedTrades.map((trade, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-background/50 rounded-lg p-2"
                >
                  <TrendingUp
                    size={14}
                    className={trade.side === 'YES' ? 'text-bullish' : 'text-bearish'}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-primary">
                      {trade.side} on {truncate(trade.marketQuestion, 40)}
                    </p>
                    <p className="text-xs text-text-secondary">{trade.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Potential profit */}
          {flag.potentialProfit !== undefined && (
            <div className="mt-4 flex items-center justify-between py-2 border-t border-border/50">
              <span className="text-xs text-text-secondary">Potential Profit</span>
              <span className="text-sm font-medium text-success">
                ~{formatUSD(flag.potentialProfit)}
              </span>
            </div>
          )}

          {/* Add to strategy button */}
          {onAddToStrategy && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onAddToStrategy(flag)}
              className="w-full mt-4"
            >
              <Plus size={14} className="mr-1" />
              Add Hedge Bundle to Strategy
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
