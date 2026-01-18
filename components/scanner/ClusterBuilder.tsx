'use client';

import { useState } from 'react';
import { X, Plus, Scan, Settings2 } from 'lucide-react';
import { Market, MarketCluster, ScannerConfig, DEFAULT_SCANNER_CONFIG } from '@/types';
import { Button, Card, Modal, Input, Badge } from '@/components/ui';
import { detectClusterType, extractThresholds } from '@/lib/math/scanner';
import { generateId } from '@/lib/utils';
import { truncate } from '@/lib/formatters';

interface ClusterBuilderProps {
  markets: Market[];
  onScan: (cluster: MarketCluster, config: ScannerConfig) => void;
  onRemoveMarket: (marketId: string) => void;
  onClear: () => void;
}

export function ClusterBuilder({
  markets,
  onScan,
  onRemoveMarket,
  onClear,
}: ClusterBuilderProps) {
  const [clusterName, setClusterName] = useState('My Cluster');
  const [clusterType, setClusterType] = useState<MarketCluster['clusterType']>('custom');
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<ScannerConfig>(DEFAULT_SCANNER_CONFIG);

  // Auto-detect cluster type when markets change
  const detectedType = markets.length >= 2 ? detectClusterType(markets) : 'custom';
  const thresholds = extractThresholds(markets);

  const handleScan = () => {
    const cluster: MarketCluster = {
      id: generateId(),
      name: clusterName,
      markets,
      clusterType: clusterType === 'custom' ? detectedType : clusterType,
      thresholdConfig: thresholds.length > 0 ? {
        variable: 'Auto-detected',
        thresholds: thresholds.map(t => ({
          marketId: t.marketId,
          operator: t.operator,
          value: t.value,
        })),
      } : undefined,
      createdAt: Date.now(),
    };

    onScan(cluster, config);
  };

  if (markets.length === 0) {
    return (
      <Card padding="lg" className="text-center">
        <Plus size={32} className="mx-auto text-text-secondary mb-3" />
        <h3 className="text-text-primary font-medium mb-2">Build a Market Cluster</h3>
        <p className="text-sm text-text-secondary">
          Add related markets to scan for inefficiencies, constraint violations, and arbitrage opportunities.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-text-primary">Market Cluster</h3>
          <Badge variant="default">{markets.length} markets</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowConfig(true)}>
            <Settings2 size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear
          </Button>
        </div>
      </div>

      {/* Cluster name */}
      <Input
        value={clusterName}
        onChange={(e) => setClusterName(e.target.value)}
        placeholder="Cluster name..."
        className="text-sm"
      />

      {/* Detected type info */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-text-secondary">Detected type:</span>
        <Badge variant={detectedType === 'threshold' ? 'bullish' : detectedType === 'mutual_exclusive' ? 'warning' : 'default'}>
          {detectedType.replace('_', ' ')}
        </Badge>
      </div>

      {/* Market list */}
      <div className="space-y-2">
        {markets.map((market) => (
          <div
            key={market.id}
            className="flex items-center justify-between bg-background rounded-lg p-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary truncate">{market.question}</p>
              <p className="text-xs text-text-secondary">
                Yes: {((market.outcomes[0]?.price || 0.5) * 100).toFixed(1)}%
              </p>
            </div>
            <button
              onClick={() => onRemoveMarket(market.id)}
              className="text-text-secondary hover:text-bearish transition-colors p-1 ml-2"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Threshold info (if detected) */}
      {thresholds.length > 0 && (
        <Card padding="sm" className="bg-bullish/5 border-bullish/20">
          <p className="text-xs text-bullish mb-1">Thresholds Detected</p>
          <div className="space-y-1">
            {thresholds.map((t, i) => (
              <p key={i} className="text-xs text-text-secondary">
                {t.operator} {t.value.toLocaleString()}
              </p>
            ))}
          </div>
        </Card>
      )}

      {/* Scan button */}
      <Button
        variant="primary"
        onClick={handleScan}
        disabled={markets.length < 2}
        className="w-full"
      >
        <Scan size={16} className="mr-2" />
        Scan for Inefficiencies
      </Button>

      {/* Config modal */}
      <Modal
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        title="Scanner Configuration"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-text-secondary block mb-2">
              Sum-to-One Threshold
            </label>
            <Input
              type="number"
              value={config.sumToOneThreshold * 100}
              onChange={(e) =>
                setConfig({ ...config, sumToOneThreshold: parseFloat(e.target.value) / 100 })
              }
              step={1}
              min={1}
              max={20}
            />
            <p className="text-xs text-text-secondary mt-1">
              Flag when deviation exceeds this percentage
            </p>
          </div>

          <div>
            <label className="text-sm text-text-secondary block mb-2">
              Minimum Arbitrage Profit
            </label>
            <Input
              type="number"
              value={config.minArbitrageProfit * 100}
              onChange={(e) =>
                setConfig({ ...config, minArbitrageProfit: parseFloat(e.target.value) / 100 })
              }
              step={0.5}
              min={0.5}
              max={10}
            />
            <p className="text-xs text-text-secondary mt-1">
              Only flag arbitrage above this profit margin
            </p>
          </div>

          <div>
            <label className="text-sm text-text-secondary block mb-2">
              Enabled Checks
            </label>
            <div className="space-y-2">
              {['sum_to_one', 'threshold_consistency', 'arbitrage_bundle'].map((rule) => (
                <label key={rule} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enabledRules.includes(rule as any)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setConfig({
                          ...config,
                          enabledRules: [...config.enabledRules, rule as any],
                        });
                      } else {
                        setConfig({
                          ...config,
                          enabledRules: config.enabledRules.filter((r) => r !== rule),
                        });
                      }
                    }}
                    className="rounded border-border bg-background text-bullish focus:ring-bullish"
                  />
                  <span className="text-sm text-text-primary">
                    {rule.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <Button variant="primary" onClick={() => setShowConfig(false)} className="w-full">
            Save Configuration
          </Button>
        </div>
      </Modal>
    </div>
  );
}
