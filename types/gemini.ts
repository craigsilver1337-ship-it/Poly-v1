/**
 * Gemini API Types for AI-Powered Market Briefs
 */

import { Market, PricePoint } from './market';
import { ScannerFlag } from './scanner';

// Input payload for Gemini
export interface GeminiBriefRequest {
  market: Market;
  priceHistory: PricePoint[];
  scannerFlags?: ScannerFlag[];
  userThesis?: string;
  userBias?: 'bullish' | 'bearish' | 'neutral';
}

// Structured output schema from Gemini
export interface GeminiBrief {
  id: string;
  marketId: string;
  generatedAt: number;
  
  // Resolution checklist
  resolutionChecklist: string[];
  
  // Key variables affecting outcome
  keyVariables: KeyVariable[];
  
  // Cases
  baseCase: string;
  bullCase: string;
  bearCase: string;
  
  // What would change the analysis
  whatWouldChangeMyMind: string[];
  
  // Debate prompts for discussion
  debatePrompts: string[];
  
  // Confidence assessment
  confidence: number; // 0-100
  confidenceJustification: string;
  
  // Suggested sources (not auto-fetched)
  sourcesToConsult: SourceSuggestion[];
  
  // Processing metadata
  processingTime: number;
  modelVersion: string;
}

export interface KeyVariable {
  name: string;
  currentState: string;
  directionOfImpact: 'bullish' | 'bearish' | 'neutral';
  importance: 'high' | 'medium' | 'low';
}

export interface SourceSuggestion {
  type: 'news' | 'official' | 'data' | 'social';
  description: string;
  searchQuery?: string;
}

// Error states for Gemini
export interface GeminiError {
  code: 'RATE_LIMITED' | 'INVALID_REQUEST' | 'API_ERROR' | 'TIMEOUT' | 'MISSING_KEY';
  message: string;
  retryAfter?: number; // Seconds until retry
}

export type GeminiResponse =
  | { success: true; brief: GeminiBrief }
  | { success: false; error: GeminiError };

// Saved research drafts
export interface ResearchDraft {
  id: string;
  marketId: string;
  marketQuestion: string;
  brief?: GeminiBrief;
  notes: string;
  createdAt: number;
  updatedAt: number;
}
