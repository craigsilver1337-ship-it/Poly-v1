'use client';

import { AlertTriangle, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-background/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Disclaimer */}
          <div className="flex items-start gap-2 text-xs text-text-secondary">
            <AlertTriangle size={14} className="text-warning flex-shrink-0 mt-0.5" />
            <p>
              <strong className="text-text-primary">Demo research tool. Not financial advice.</strong>
              {' '}This is an experimental analysis platform. All predictions are based on market data
              and AI analysis which may be inaccurate. Do not make financial decisions based solely
              on this tool.
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4 text-xs text-text-secondary flex-shrink-0">
            <a
              href="https://polymarket.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-text-primary transition-colors"
            >
              Polymarket
              <ExternalLink size={12} />
            </a>
            <span className="text-border">•</span>
            <span>Built for NexHacks</span>
            <span className="text-border">•</span>
            <span className="font-mono text-bullish">#nexhacks</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
