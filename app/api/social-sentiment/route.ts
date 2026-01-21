import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Market } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const AI_MODEL = 'google/gemini-2.0-flash-001';

const requestSchema = z.object({
  marketId: z.string(),
  marketQuestion: z.string(),
  marketSlug: z.string().optional(),
  conditionId: z.string().optional(),
});

/**
 * Call OpenRouter API
 */
async function callOpenRouter(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://polypulse.app',
      'X-Title': 'PolyPulse',
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Fetch Polymarket comments for a market
 */
async function fetchPolymarketComments(market: {
  id: string;
  slug?: string;
  conditionId?: string;
}): Promise<string[]> {
  // TODO: Replace with actual Polymarket comments API call when available
  return [];
}

/**
 * Analyze sentiment using AI
 */
async function analyzeSentiment(
  market: Market,
  comments: string[]
): Promise<{
  overall: number;
  summary: string;
  keyPoints: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
}> {
  const yesPrice = market.outcomes[0]?.price || 0.5;
  const pricePercent = (yesPrice * 100).toFixed(1);

  let prompt = `You are analyzing sentiment for a prediction market on Polymarket.

MARKET: "${market.question}"
Current YES Price: ${pricePercent}%
Category: ${market.category}
${market.description ? `Description: ${market.description}` : ''}

`;

  if (comments.length > 0) {
    prompt += `\nCOMMENTS FROM TRADERS:\n${comments.slice(0, 20).map((c, i) => `${i + 1}. ${c}`).join('\n')}\n`;
  } else {
    prompt += `\nNo specific comments available, but analyze sentiment based on:\n`;
    prompt += `- Current market price (${pricePercent}% suggests ${yesPrice > 0.5 ? 'bullish' : yesPrice < 0.5 ? 'bearish' : 'neutral'} sentiment)\n`;
    prompt += `- Market category and question context\n`;
    prompt += `- General prediction market dynamics\n`;
  }

  prompt += `\nAnalyze the overall sentiment and provide a JSON response:
{
  "overall": <number -100 to 100, where 100 is very bullish, -100 is very bearish, 0 is neutral>,
  "summary": "<2-3 sentence summary of trader sentiment>",
  "keyPoints": ["<point 1>", "<point 2>", "<point 3>"],
  "sentiment": "<positive|negative|neutral>",
  "confidence": <0-100, how confident you are in this assessment>
}`;

  try {
    const text = await callOpenRouter(prompt);

    // Extract JSON from response
    let jsonText = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }
    
    // Try to find JSON object
    const jsonObjectMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      jsonText = jsonObjectMatch[0];
    }

    const parsed = JSON.parse(jsonText.trim());

    return {
      overall: Math.max(-100, Math.min(100, Number(parsed.overall) || 0)),
      summary: String(parsed.summary || 'Sentiment analysis not available'),
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      sentiment: ['positive', 'negative', 'neutral'].includes(parsed.sentiment)
        ? parsed.sentiment
        : (Number(parsed.overall) > 20 ? 'positive' : Number(parsed.overall) < -20 ? 'negative' : 'neutral'),
      confidence: Math.max(0, Math.min(100, Number(parsed.confidence) || 50)),
    };
  } catch (error) {
    console.error('[Social Sentiment] AI analysis error:', error);
    throw new Error('Failed to analyze sentiment with AI');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = requestSchema.parse(body);

    // Fetch comments (currently returns empty array, but structure is ready for real API)
    const comments = await fetchPolymarketComments({
      id: parsed.marketId,
      slug: parsed.marketSlug,
      conditionId: parsed.conditionId,
    });

    // Build minimal market object for analysis
    const marketForAnalysis: Market = {
      id: parsed.marketId,
      question: parsed.marketQuestion,
      slug: parsed.marketSlug || '',
      category: 'other',
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      volume: 0,
      liquidity: 0,
      outcomes: [{ id: '', name: 'Yes', price: 0.5, priceChange24h: 0 }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      active: true,
      closed: false,
      resolved: false,
    };

    // Analyze sentiment
    const analysis = await analyzeSentiment(marketForAnalysis, comments);

    return NextResponse.json({
      success: true,
      overall: analysis.overall,
      summary: analysis.summary,
      keyPoints: analysis.keyPoints,
      sentiment: analysis.sentiment,
      confidence: analysis.confidence,
      source: 'openrouter-ai',
      commentsCount: comments.length,
    });
  } catch (error) {
    console.error('[Social Sentiment API] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('GEMINI_API_KEY')) {
      return NextResponse.json(
        { success: false, error: 'API key not configured' },
        { status: 501 }
      );
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to analyze sentiment' },
      { status: 500 }
    );
  }
}
