'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { GeminiBrief as GeminiBriefType, GeminiError, Market } from '@/types';
import { Button, Card, Badge, BriefSkeleton } from '@/components/ui';

interface GeminiBriefProps {
  brief: GeminiBriefType | null;
  error: GeminiError | null;
  loading?: boolean;
  market: Market;
  onGenerate: () => void;
  onRetry?: () => void;
}

export function GeminiBrief({
  brief,
  error,
  loading,
  market,
  onGenerate,
  onRetry,
}: GeminiBriefProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    checklist: true,
    variables: true,
    cases: true,
    debate: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return (
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles size={20} className="text-bullish" />
          </motion.div>
          <span className="text-text-primary font-medium">Generating AI Brief...</span>
        </div>
        <BriefSkeleton />
      </Card>
    );
  }

  if (error) {
    return (
      <Card padding="lg" className="text-center">
        <AlertCircle size={32} className="mx-auto text-bearish mb-3" />
        <h3 className="text-text-primary font-medium mb-2">Generation Failed</h3>
        <p className="text-sm text-text-secondary mb-4">{error.message}</p>
        {onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            <RefreshCw size={14} className="mr-2" />
            Try Again
          </Button>
        )}
      </Card>
    );
  }

  if (!brief) {
    return (
      <Card padding="lg" className="text-center">
        <Sparkles size={32} className="mx-auto text-text-secondary mb-3" />
        <h3 className="text-text-primary font-medium mb-2">AI Market Brief</h3>
        <p className="text-sm text-text-secondary mb-4">
          Generate an evidence-backed analysis powered by Gemini AI.
        </p>
        <Button variant="primary" onClick={onGenerate}>
          <Sparkles size={14} className="mr-2" />
          Generate Brief
        </Button>
      </Card>
    );
  }

  const impactIcons = {
    bullish: <TrendingUp size={12} className="text-success" />,
    bearish: <TrendingDown size={12} className="text-bearish" />,
    neutral: <Minus size={12} className="text-text-secondary" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-bullish" />
          <h3 className="text-lg font-semibold text-text-primary">AI Brief</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="bullish">
            {brief.confidence}% confidence
          </Badge>
          <Button variant="ghost" size="sm" onClick={onGenerate}>
            <RefreshCw size={14} />
          </Button>
        </div>
      </div>

      {/* Resolution Checklist */}
      <Card padding="sm">
        <button
          onClick={() => toggleSection('checklist')}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-success" />
            <h4 className="text-sm font-medium text-text-primary">Resolution Checklist</h4>
          </div>
        </button>
        {expandedSections.checklist && (
          <ul className="mt-3 space-y-2">
            {brief.resolutionChecklist.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-bullish mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Key Variables */}
      <Card padding="sm">
        <button
          onClick={() => toggleSection('variables')}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-bullish" />
            <h4 className="text-sm font-medium text-text-primary">Key Variables</h4>
          </div>
        </button>
        {expandedSections.variables && (
          <div className="mt-3 space-y-2">
            {brief.keyVariables.map((variable, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-background rounded-lg p-2"
              >
                <div>
                  <p className="text-sm text-text-primary">{variable.name}</p>
                  <p className="text-xs text-text-secondary">{variable.currentState}</p>
                </div>
                <div className="flex items-center gap-2">
                  {impactIcons[variable.directionOfImpact]}
                  <Badge
                    variant={
                      variable.importance === 'high'
                        ? 'error'
                        : variable.importance === 'medium'
                        ? 'warning'
                        : 'default'
                    }
                    size="sm"
                  >
                    {variable.importance}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Cases */}
      <Card padding="sm">
        <button
          onClick={() => toggleSection('cases')}
          className="w-full flex items-center justify-between text-left"
        >
          <h4 className="text-sm font-medium text-text-primary">Scenario Analysis</h4>
        </button>
        {expandedSections.cases && (
          <div className="mt-3 space-y-3">
            <div>
              <p className="text-xs text-text-secondary uppercase mb-1">Base Case</p>
              <p className="text-sm text-text-primary">{brief.baseCase}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-success/5 border border-success/20 rounded-lg p-2">
                <p className="text-xs text-success uppercase mb-1">Bull Case</p>
                <p className="text-xs text-text-secondary">{brief.bullCase}</p>
              </div>
              <div className="bg-bearish/5 border border-bearish/20 rounded-lg p-2">
                <p className="text-xs text-bearish uppercase mb-1">Bear Case</p>
                <p className="text-xs text-text-secondary">{brief.bearCase}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* What Would Change My Mind */}
      <Card padding="sm">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle size={16} className="text-warning" />
          <h4 className="text-sm font-medium text-text-primary">What Would Change My Mind</h4>
        </div>
        <ul className="space-y-1">
          {brief.whatWouldChangeMyMind.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
              <span className="text-warning">→</span>
              {item}
            </li>
          ))}
        </ul>
      </Card>

      {/* Debate Prompts */}
      <Card padding="sm">
        <button
          onClick={() => toggleSection('debate')}
          className="w-full flex items-center justify-between text-left"
        >
          <h4 className="text-sm font-medium text-text-primary">Debate Prompts</h4>
        </button>
        {expandedSections.debate && (
          <ol className="mt-3 space-y-2">
            {brief.debatePrompts.map((prompt, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-bullish font-mono">{i + 1}.</span>
                {prompt}
              </li>
            ))}
          </ol>
        )}
      </Card>

      {/* Sources to Consult */}
      {brief.sourcesToConsult.length > 0 && (
        <Card padding="sm">
          <h4 className="text-sm font-medium text-text-primary mb-2">Suggested Sources</h4>
          <div className="space-y-2">
            {brief.sourcesToConsult.map((source, i) => (
              <div key={i} className="flex items-center justify-between bg-background rounded-lg p-2">
                <div>
                  <p className="text-xs text-text-primary">{source.description}</p>
                  <p className="text-xs text-text-secondary">Type: {source.type}</p>
                </div>
                {source.searchQuery && (
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(source.searchQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-bullish hover:text-bullish-hover"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Confidence justification */}
      <p className="text-xs text-text-secondary italic">
        Confidence justification: {brief.confidenceJustification}
      </p>
    </motion.div>
  );
}
