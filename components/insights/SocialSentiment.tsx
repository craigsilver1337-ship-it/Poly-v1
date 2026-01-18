'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  RefreshCw,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { Market } from '@/types';

interface SocialSentimentProps {
  market: Market;
  className?: string;
}

interface SentimentAnalysis {
  overall: number;
  summary: string;
  keyPoints: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

export function SocialSentiment({ market, className = '' }: SocialSentimentProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SentimentAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSentiment = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const resp = await fetch('/api/social-sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId: market.id,
          marketQuestion: market.question,
          marketSlug: market.slug,
          conditionId: market.conditionId,
        }),
      });

      if (!resp.ok) {
        const details = await resp.json().catch(() => null);
        const message =
          resp.status === 501
            ? 'Gemini API not configured. Add GEMINI_API_KEY to .env.local and restart the dev server.'
            : details?.message || details?.error || 'Failed to analyze sentiment';
        throw new Error(message);
      }

      const analysis = await resp.json();
      
      if (!analysis.success) {
        throw new Error(analysis.error || 'Analysis failed');
      }

      setData({
        overall: analysis.overall || 0,
        summary: analysis.summary || '',
        keyPoints: analysis.keyPoints || [],
        sentiment: analysis.sentiment || 'neutral',
        confidence: analysis.confidence || 0,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [market]);

  useEffect(() => {
    setData(null);
    setError(null);
  }, [market.id]);

  useEffect(() => {
    void loadSentiment();
  }, [loadSentiment]);

  const sentimentColor = (score: number) => {
    if (score > 30) return 'text-bullish';
    if (score > 10) return 'text-emerald-400';
    if (score < -30) return 'text-bearish';
    if (score < -10) return 'text-rose-400';
    return 'text-text-secondary';
  };

  const sentimentBg = (score: number) => {
    if (score > 30) return 'bg-bullish/10';
    if (score > 10) return 'bg-emerald-500/10';
    if (score < -30) return 'bg-bearish/10';
    if (score < -10) return 'bg-rose-500/10';
    return 'bg-surface-elevated';
  };

  const trend = useMemo(() => {
    if (!data) return 'neutral';
    if (data.overall > 15) return 'bullish';
    if (data.overall < -15) return 'bearish';
    return 'neutral';
  }, [data]);

  const trendIcon = useMemo(() => {
    if (trend === 'bullish') return <TrendingUp size={16} className="text-bullish" />;
    if (trend === 'bearish') return <TrendingDown size={16} className="text-bearish" />;
    return <Minus size={16} className="text-text-secondary" />;
  }, [trend]);

  return (
    <Card padding="md" className={className}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
          <MessageCircle size={16} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-text-primary">Social Sentiment</h3>
          <p className="text-xs text-text-secondary">AI-powered analysis via Gemini</p>
        </div>
        {(data || error) && (
          <Button variant="ghost" size="sm" onClick={loadSentiment} disabled={loading}>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </Button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="animate-spin text-text-secondary mb-2" />
          <p className="text-sm text-text-secondary">Analyzing sentiment with Gemini AI...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-bearish/10 border border-bearish/30 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-bearish flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-bearish font-medium">Sentiment analysis failed</p>
              <p className="text-xs text-text-secondary mt-1">{error}</p>
              <Button variant="secondary" size="sm" onClick={loadSentiment} className="mt-3">
                <RefreshCw size={12} className="mr-1" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      ) : data ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* Overall Sentiment */}
          <div className={`rounded-xl p-4 ${sentimentBg(data.overall)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Overall Sentiment</span>
              <div className="flex items-center gap-2">
                {trendIcon}
                <Badge variant="secondary" className={`${sentimentColor(data.overall)} bg-background/50`}>
                  {trend.charAt(0).toUpperCase() + trend.slice(1)}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className={`text-4xl font-bold ${sentimentColor(data.overall)}`}>
                {data.overall > 0 ? '+' : ''}{data.overall}
              </span>
              <div className="flex-1">
                <div className="h-3 bg-background/50 rounded-full overflow-hidden relative">
                  <div className="absolute left-1/2 top-0 h-full w-0.5 bg-white/30" />
                  <motion.div
                    initial={{ width: '50%' }}
                    animate={{ width: `${50 + data.overall / 2}%` }}
                    className={`h-full ${data.overall >= 0 ? 'bg-bullish' : 'bg-bearish'}`}
                    style={{ marginLeft: data.overall < 0 ? `${50 + data.overall / 2}%` : '0' }}
                  />
                </div>
                <div className="flex justify-between text-xs text-text-secondary mt-1">
                  <span>Bearish</span>
                  <span>Neutral</span>
                  <span>Bullish</span>
                </div>
              </div>
            </div>

            {/* Confidence */}
            <div className="flex items-center gap-2 mt-3 text-sm">
              <span className="text-text-secondary">AI Confidence:</span>
              <span className="text-text-primary">{data.confidence}%</span>
            </div>
          </div>

          {/* Summary */}
          {data.summary && (
            <div className="p-3 bg-surface-elevated rounded-lg">
              <p className="text-sm text-text-primary">{data.summary}</p>
            </div>
          )}

          {/* Key Points */}
          {data.keyPoints.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-text-primary">Key Insights</p>
              {data.keyPoints.map((point, idx) => (
                <div key={idx} className="bg-surface-elevated rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Sparkles size={12} className="text-bullish flex-shrink-0 mt-1" />
                    <p className="text-sm text-text-primary">{point}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="p-3 bg-surface rounded-lg border border-border">
            <div className="flex items-start gap-2">
              <Sparkles size={12} className="text-bullish flex-shrink-0 mt-0.5" />
              <p className="text-xs text-text-secondary">
                Analysis powered by Google Gemini AI based on market context and pricing data.
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <Button
          variant="primary"
          onClick={loadSentiment}
          className="w-full"
        >
          <Sparkles size={14} className="mr-2" />
          Analyze Social Sentiment
        </Button>
      )}
    </Card>
  );
}
