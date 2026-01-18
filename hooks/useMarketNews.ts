'use client';

import { useState, useEffect, useCallback } from 'react';
import { NewsArticle } from '@/lib/news/client';

interface UseMarketNewsReturn {
  articles: NewsArticle[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch news for a specific market
 */
export function useMarketNews(marketId: string | null): UseMarketNewsReturn {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    if (!marketId) {
      setArticles([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/market/${encodeURIComponent(marketId)}/news`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch news');
      }

      const data = await response.json();
      setArticles(data.news || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useMarketNews] Error:', errorMessage);
      setError(errorMessage);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [marketId]);

  // Fetch news when market ID changes
  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return {
    articles,
    loading,
    error,
    refetch: fetchNews,
  };
}

