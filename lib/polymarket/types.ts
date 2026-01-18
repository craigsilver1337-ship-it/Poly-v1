/**
 * Polymarket API Response Types
 * Based on: https://docs.polymarket.com/quickstart/fetching-data
 */

// Gamma API Market Response
export interface GammaMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  resolutionSource?: string;
  endDate: string;
  liquidity: number;
  volume: number;
  volume24hr?: number;
  active: boolean;
  closed: boolean;
  marketMakerAddress?: string;
  createdAt: string;
  updatedAt: string;
  new?: boolean;
  featured?: boolean;
  restricted?: boolean;
  // Outcomes and prices are JSON strings: "[\"Yes\", \"No\"]" and "[\"0.65\", \"0.35\"]"
  outcomes: string;
  outcomePrices: string;
  // CLOB token IDs for trading
  clobTokenIds?: string;
  clob_token_ids?: string;
  category?: string;
  description?: string;
  tags?: (string | { id: string; label: string; slug: string })[];
  image?: string;
}

// Gamma API Event Response (contains markets)
export interface GammaEvent {
  id: string;
  slug: string;
  title: string;
  active: boolean;
  closed: boolean;
  tags?: { id: string; label: string; slug: string }[];
  markets: GammaMarket[];
}

// Gamma API Price History Point
export interface GammaPricePoint {
  t: number; // Unix timestamp (seconds)
  p: number; // Price (0-1)
}

// CLOB API Price Response
export interface ClobPriceResponse {
  price: string;
}

// CLOB API Orderbook Response
export interface ClobOrderbookResponse {
  market: string;
  asset_id: string;
  bids: ClobOrderbookLevel[];
  asks: ClobOrderbookLevel[];
}

export interface ClobOrderbookLevel {
  price: string;
  size: string;
}

// Gamma API Events Response
export interface GammaEventsResponse {
  data?: GammaEvent[];
  events?: GammaEvent[];
}

// Gamma API Markets Response
export interface GammaMarketsResponse {
  data?: GammaMarket[];
  markets?: GammaMarket[];
  count?: number;
}

// Gamma API Tag
export interface GammaTag {
  id: string;
  label: string;
  slug: string;
}
