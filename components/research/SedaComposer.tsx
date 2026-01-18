'use client';

import { useState, useCallback, useEffect } from 'react';
import { Copy, Check, FileText, Sparkles, Save } from 'lucide-react';
import { GeminiBrief, ScannerResult, StrategyAnalysis, SedaPost, Market } from '@/types';
import { Button, Card, Input } from '@/components/ui';
import { copyToClipboard, generateId } from '@/lib/utils';
import { formatUSD } from '@/lib/formatters';
import { useToast } from '@/components/ui';

interface SedaComposerProps {
  market: Market;
  brief?: GeminiBrief | null;
  scannerResult?: ScannerResult | null;
  strategyAnalysis?: StrategyAnalysis | null;
  onSave?: (post: SedaPost) => void;
}

export function SedaComposer({
  market,
  brief,
  scannerResult,
  strategyAnalysis,
  onSave,
}: SedaComposerProps) {
  const [title, setTitle] = useState('');
  const [thesis, setThesis] = useState('');
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  // Auto-generate title from market question
  useEffect(() => {
    if (!title) {
      setTitle(`Analysis: ${market.question.slice(0, 60)}`);
    }
  }, [market, title]);

  // Generate TL;DR
  const tldr = brief
    ? brief.baseCase.slice(0, 150) + (brief.baseCase.length > 150 ? '...' : '')
    : `Current price: ${((market.outcomes[0]?.price || 0.5) * 100).toFixed(1)}% YES`;

  // Generate evidence checklist
  const evidenceChecklist = brief?.resolutionChecklist || [
    'Monitor official announcements',
    'Track key stakeholder statements',
    'Watch for policy changes',
  ];

  // Generate scanner summary
  const scannerSummary = scannerResult
    ? scannerResult.flags.length > 0
      ? `Found ${scannerResult.flags.length} potential inefficiency/ies: ${scannerResult.flags
          .slice(0, 2)
          .map((f) => f.title)
          .join(', ')}`
      : 'No significant inefficiencies detected in related markets.'
    : 'Scanner not run.';

  // Generate strategy takeaway
  const strategyTakeaway = strategyAnalysis
    ? `Expected return: ${strategyAnalysis.expectedReturn.toFixed(1)}%. Max profit: ${formatUSD(
        strategyAnalysis.maxProfit
      )}. Max loss: ${formatUSD(strategyAnalysis.maxLoss)}. Break-even at ${(
        strategyAnalysis.breakEvenProbability * 100
      ).toFixed(1)}%.`
    : 'No strategy analyzed.';

  // Generate debate prompts
  const debatePrompts = brief?.debatePrompts || [
    `Is ${((market.outcomes[0]?.price || 0.5) * 100).toFixed(0)}% a fair price?`,
    'What risks are being underpriced?',
    'How might resolution timing affect outcomes?',
  ];

  // Generate formatted content
  const generateFormattedContent = useCallback(() => {
    return `# ${title}

**TL;DR:** ${tldr}

## Thesis
${thesis || brief?.baseCase || 'Enter your thesis above.'}

## Evidence Checklist
${evidenceChecklist.map((item) => `- ${item}`).join('\n')}

## Scanner Analysis
${scannerSummary}

## Strategy Payoff
${strategyTakeaway}

## Debate Prompts
${debatePrompts.map((prompt, i) => `${i + 1}. ${prompt}`).join('\n')}

---
*Analysis generated with PulseForge*
#nexhacks`;
  }, [title, tldr, thesis, brief, evidenceChecklist, scannerSummary, strategyTakeaway, debatePrompts]);

  const handleCopy = async () => {
    const content = generateFormattedContent();
    const success = await copyToClipboard(content);
    if (success) {
      setCopied(true);
      showToast('success', 'Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } else {
      showToast('error', 'Failed to copy');
    }
  };

  const handleSave = () => {
    if (!onSave) return;

    const post: SedaPost = {
      id: generateId(),
      marketId: market.id,
      title,
      tldr,
      thesis: thesis || brief?.baseCase || '',
      evidenceChecklist,
      scannerFlagsSummary: scannerSummary,
      strategyTakeaway,
      debatePrompts,
      tagString: 'nexhacks',
      createdAt: Date.now(),
      formattedContent: generateFormattedContent(),
    };

    onSave(post);
    showToast('success', 'Saved to Research');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FileText size={20} className="text-bullish" />
        <h3 className="text-lg font-semibold text-text-primary">Seda Post Composer</h3>
      </div>

      {/* Title input */}
      <div>
        <label className="text-sm text-text-secondary block mb-2">Post Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a compelling title..."
        />
      </div>

      {/* Thesis input */}
      <div>
        <label className="text-sm text-text-secondary block mb-2">Your Thesis</label>
        <textarea
          value={thesis}
          onChange={(e) => setThesis(e.target.value)}
          placeholder={brief?.baseCase || 'Enter your thesis...'}
          className="w-full bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-bullish/50 focus:border-bullish transition-colors px-4 py-3 min-h-[100px] resize-y"
        />
      </div>

      {/* Preview */}
      <Card padding="sm" className="bg-background">
        <h4 className="text-sm font-medium text-text-primary mb-2">Preview</h4>
        <pre className="text-xs text-text-secondary whitespace-pre-wrap font-mono max-h-[300px] overflow-y-auto">
          {generateFormattedContent()}
        </pre>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          variant="primary"
          onClick={handleCopy}
          className="flex-1"
        >
          {copied ? (
            <>
              <Check size={16} className="mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy size={16} className="mr-2" />
              Copy to Clipboard
            </>
          )}
        </Button>

        {onSave && (
          <Button
            variant="secondary"
            onClick={handleSave}
          >
            <Save size={16} className="mr-2" />
            Save Draft
          </Button>
        )}
      </div>

      {/* Tag reminder */}
      <p className="text-xs text-text-secondary text-center">
        Don&apos;t forget the <span className="font-mono text-bullish">#nexhacks</span> tag for the hackathon!
      </p>
    </div>
  );
}
