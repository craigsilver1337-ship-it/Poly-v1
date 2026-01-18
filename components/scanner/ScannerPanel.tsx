'use client';

import { useState } from 'react';
import { Scan, CheckCircle, Clock } from 'lucide-react';
import { ScannerResult, ScannerFlag as ScannerFlagType, Market } from '@/types';
import { Card, Badge } from '@/components/ui';
import { ScannerFlag } from './ScannerFlag';
import { motion, AnimatePresence } from 'framer-motion';

interface ScannerPanelProps {
  result: ScannerResult | null;
  loading?: boolean;
  onAddFlagToStrategy?: (flag: ScannerFlagType) => void;
}

export function ScannerPanel({ result, loading, onAddFlagToStrategy }: ScannerPanelProps) {
  if (loading) {
    return (
      <Card padding="lg" className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="inline-block"
        >
          <Scan size={32} className="text-bullish" />
        </motion.div>
        <p className="text-text-secondary mt-3">Scanning for inefficiencies...</p>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card padding="lg" className="text-center">
        <Scan size={32} className="mx-auto text-text-secondary mb-3" />
        <h3 className="text-text-primary font-medium mb-2">Scanner Results</h3>
        <p className="text-sm text-text-secondary">
          Build a market cluster and scan to detect constraint violations and arbitrage opportunities.
        </p>
      </Card>
    );
  }

  const { cluster, flags, scannedAt, scanDuration, checksPerformed } = result;
  const hasFlags = flags.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            {cluster.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="default" size="sm">
              {cluster.markets.length} markets
            </Badge>
            <Badge variant="default" size="sm">
              {checksPerformed} checks
            </Badge>
            <span className="text-xs text-text-secondary flex items-center gap-1">
              <Clock size={10} />
              {scanDuration}ms
            </span>
          </div>
        </div>
        {hasFlags ? (
          <Badge variant={flags[0].severity === 'high' ? 'error' : 'warning'}>
            {flags.length} flag{flags.length !== 1 ? 's' : ''}
          </Badge>
        ) : (
          <Badge variant="success">
            <CheckCircle size={12} className="mr-1" />
            Clean
          </Badge>
        )}
      </div>

      {/* Flags list */}
      <AnimatePresence>
        {hasFlags ? (
          <div className="space-y-3">
            {flags.map((flag) => (
              <ScannerFlag
                key={flag.id}
                flag={flag}
                onAddToStrategy={onAddFlagToStrategy}
              />
            ))}
          </div>
        ) : (
          <Card padding="lg" className="text-center bg-success/5 border-success/20">
            <CheckCircle size={32} className="mx-auto text-success mb-3" />
            <h4 className="text-text-primary font-medium mb-2">No Issues Found</h4>
            <p className="text-sm text-text-secondary">
              This market cluster appears to be correctly priced with no detectable inefficiencies.
            </p>
          </Card>
        )}
      </AnimatePresence>

      {/* Summary */}
      {hasFlags && (
        <Card padding="sm" className="bg-background">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-text-secondary">High Severity</p>
              <p className="text-lg font-bold text-bearish">
                {flags.filter((f) => f.severity === 'high').length}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">Medium Severity</p>
              <p className="text-lg font-bold text-warning">
                {flags.filter((f) => f.severity === 'medium').length}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">Low Severity</p>
              <p className="text-lg font-bold text-bullish">
                {flags.filter((f) => f.severity === 'low').length}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
