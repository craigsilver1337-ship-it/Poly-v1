'use client';

import { motion } from 'framer-motion';
import { MARKET_CATEGORIES, MarketCategory } from '@/types';

interface CategoryPillsProps {
  selected: string;
  onSelect: (category: string) => void;
}

export function CategoryPills({ selected, onSelect }: CategoryPillsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {MARKET_CATEGORIES.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.id)}
          className={`
            relative px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
            transition-colors
            ${
              selected === category.id
                ? 'text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }
          `}
        >
          {selected === category.id && (
            <motion.div
              layoutId="categoryPill"
              className="absolute inset-0 bg-surface border border-border rounded-full"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative z-10">{category.label}</span>
        </button>
      ))}
    </div>
  );
}
