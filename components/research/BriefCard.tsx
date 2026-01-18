'use client';

import { ResearchDraft } from '@/types';
import { Card, Badge, Button } from '@/components/ui';
import { Clock, Trash2, ExternalLink } from 'lucide-react';
import { formatRelativeDate, truncate } from '@/lib/formatters';
import Link from 'next/link';

interface BriefCardProps {
  draft: ResearchDraft;
  onDelete?: (id: string) => void;
}

export function BriefCard({ draft, onDelete }: BriefCardProps) {

  return (
    <Card variant="interactive" padding="md">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <Link href={`/market/${encodeURIComponent(draft.marketId)}`}>
            <h4 className="text-text-primary font-medium text-sm hover:text-bullish transition-colors line-clamp-2">
              {draft.marketQuestion}
            </h4>
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <Clock size={12} className="text-text-secondary" />
            <span className="text-xs text-text-secondary">
              {formatRelativeDate(new Date(draft.updatedAt))}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {draft.brief && <Badge variant="success" size="sm">Brief</Badge>}
        </div>
      </div>

      {/* Notes */}
      {draft.notes && (
        <p className="text-xs text-text-secondary italic mb-3">
          Notes: {truncate(draft.notes, 80)}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link href={`/market/${encodeURIComponent(draft.marketId)}`} className="flex-1">
          <Button variant="ghost" size="sm" className="w-full">
            <ExternalLink size={12} className="mr-1" />
            View Market
          </Button>
        </Link>
        
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(draft.id)}
            className="text-bearish hover:text-bearish-hover"
          >
            <Trash2 size={12} />
          </Button>
        )}
      </div>
    </Card>
  );
}
