/**
 * Simple in-memory cache with TTL for Polymarket API responses
 * Reduces API calls and improves performance
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxSize = 500;

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    // Clean up expired entries if cache is getting large
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }
    
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    console.log('[Cache] Cleared all entries');
  }

  clearPattern(pattern: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`[Cache] Cleared ${keysToDelete.length} entries matching "${pattern}"`);
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    // If still too large, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt);
      const toRemove = entries.slice(0, Math.floor(this.maxSize / 4));
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  size(): number {
    return this.cache.size;
  }
}

// Global cache instance
export const apiCache = new SimpleCache();

// Cache TTL values (in milliseconds)
// Short TTLs for real-time data
export const CACHE_TTL = {
  MARKETS_LIST: 30 * 1000,      // 30 seconds - refresh frequently
  MARKET_DETAIL: 15 * 1000,     // 15 seconds
  PRICE_HISTORY: 60 * 1000,     // 1 minute
  ORDERBOOK: 5 * 1000,          // 5 seconds - very fresh
  CURRENT_PRICE: 5 * 1000,      // 5 seconds
  TAGS: 10 * 60 * 1000,         // 10 minutes - stable
};

// Helper to generate cache keys
export function cacheKey(...parts: (string | number | undefined)[]): string {
  return parts.filter(p => p !== undefined).join(':');
}
