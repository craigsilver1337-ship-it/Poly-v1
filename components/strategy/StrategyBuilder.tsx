'use client';

import { useState, useMemo, useCallback } from 'react';
import { Plus, Trash2, Calculator, Save } from 'lucide-react';
import { Market, Position, Strategy, StrategyAnalysis } from '@/types';
import { Button, Card, Modal } from '@/components/ui';
import { PositionCard } from './PositionCard';
import { PayoffSurface } from './PayoffSurface';
import { analyzeStrategy } from '@/lib/math/payoff';
import { generateId } from '@/lib/utils';

interface StrategyBuilderProps {
  market: Market;
  onAddToResearch?: (analysis: StrategyAnalysis) => void;
}

export function StrategyBuilder({ market, onAddToResearch }: StrategyBuilderProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [discountRate, setDiscountRate] = useState(0.10);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Add current market as a position
  const addPosition = useCallback(() => {
    if (positions.length >= 5) return;
    if (positions.some(p => p.market.id === market.id)) return;

    const yesPrice = market.outcomes[0]?.price || 0.5;
    
    setPositions(prev => [
      ...prev,
      {
        id: generateId(),
        market,
        side: 'YES',
        stake: 100,
        entryPrice: yesPrice,
        addedAt: Date.now(),
      },
    ]);
  }, [market, positions]);

  const removePosition = useCallback((id: string) => {
    setPositions(prev => prev.filter(p => p.id !== id));
  }, []);

  const updatePositionStake = useCallback((id: string, stake: number) => {
    setPositions(prev =>
      prev.map(p => (p.id === id ? { ...p, stake } : p))
    );
  }, []);

  const togglePositionSide = useCallback((id: string) => {
    setPositions(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        const newSide = p.side === 'YES' ? 'NO' : 'YES';
        const newPrice = newSide === 'YES'
          ? p.market.outcomes[0]?.price || 0.5
          : p.market.outcomes[1]?.price || 0.5;
        return { ...p, side: newSide, entryPrice: newPrice };
      })
    );
  }, []);

  const clearAll = useCallback(() => {
    setPositions([]);
    setShowAnalysis(false);
  }, []);

  // Compute strategy analysis
  const strategy: Strategy = useMemo(() => ({
    id: 'current',
    name: 'Current Strategy',
    positions,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    discountRate,
  }), [positions, discountRate]);

  const analysis = useMemo(() => analyzeStrategy(strategy), [strategy]);

  const currentProbability = market.outcomes[0]?.price || 0.5;
  const hasCurrentMarket = positions.some(p => p.market.id === market.id);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">Strategy Builder</h3>
        {positions.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <Trash2 size={14} className="mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Add position button */}
      {!hasCurrentMarket && positions.length < 5 && (
        <Button
          variant="secondary"
          onClick={addPosition}
          className="w-full"
        >
          <Plus size={16} className="mr-2" />
          Add {market.question.slice(0, 40)}...
        </Button>
      )}

      {/* Position list */}
      {positions.length > 0 ? (
        <div className="space-y-3">
          {positions.map(position => (
            <PositionCard
              key={position.id}
              position={position}
              onRemove={() => removePosition(position.id)}
              onUpdateStake={(stake) => updatePositionStake(position.id, stake)}
              onToggleSide={() => togglePositionSide(position.id)}
            />
          ))}

          {/* Analyze button */}
          <Button
            variant="primary"
            onClick={() => setShowAnalysis(true)}
            className="w-full"
          >
            <Calculator size={16} className="mr-2" />
            Analyze Payoff Surface
          </Button>
        </div>
      ) : (
        <Card padding="lg" className="text-center">
          <p className="text-text-secondary mb-2">No positions yet</p>
          <p className="text-sm text-text-secondary">
            Add markets to build a multi-market strategy and analyze payoff surfaces.
          </p>
        </Card>
      )}

      {/* Analysis Modal */}
      <Modal
        isOpen={showAnalysis}
        onClose={() => setShowAnalysis(false)}
        title="Strategy Analysis"
        size="xl"
      >
        <PayoffSurface
          analysis={analysis}
          discountRate={discountRate}
          onDiscountRateChange={setDiscountRate}
          currentProbability={currentProbability}
        />

        {onAddToResearch && (
          <div className="mt-6 pt-4 border-t border-border">
            <Button
              variant="primary"
              onClick={() => {
                onAddToResearch(analysis);
                setShowAnalysis(false);
              }}
              className="w-full"
            >
              <Save size={16} className="mr-2" />
              Add to Research Brief
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
