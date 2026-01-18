import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchMarketDetail, fetchMarketHistory, getPolymarketUrl } from '@/lib/polymarket/client';
import { searchNews, formatNewsForPrompt, NewsArticle, NewsSearchResult } from '@/lib/news';
import { Market, PricePoint } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for AI processing

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const AI_MODEL = 'google/gemini-2.0-flash-001';

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
      'HTTP-Referer': 'https://pulseforge.app',
      'X-Title': 'PulseForge',
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000,
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

const requestSchema = z.object({
  marketId: z.string(),
  market: z.object({
    id: z.string(),
    question: z.string(),
    category: z.string(),
    outcomes: z.array(z.object({
      price: z.number(),
      name: z.string(),
    })),
    volume: z.number().optional(),
    liquidity: z.number().optional(),
    endDate: z.string(),
    slug: z.string().optional(),
    description: z.string().optional(),
  }).optional(), // Allow passing market data to avoid refetch
});

interface ResearchResult {
  summary: string;
  whatIsThisBet: string;
  keyPoints: string[];
  riskLevel: 'low' | 'medium' | 'high';
  riskExplanation: string;
  confidence: number;
  confidenceExplanation: string;
  sources: { name: string; type: string; url?: string }[];
  prosAndCons: {
    pros: string[];
    cons: string[];
  };
  keyDates: string[];
  marketSentiment: string;
  recommendation: string;
  beginnerExplanation: string;
  newsArticles: NewsArticle[];
  newsSummary: string;
}

/**
 * Build a comprehensive prompt for Gemini to analyze the market
 */
function buildResearchPrompt(market: Market, priceHistory: PricePoint[], newsResult: NewsSearchResult): string {
  const yesPrice = market.outcomes[0]?.price || 0.5;
  const noPrice = market.outcomes[1]?.price || 0.5;
  const priceChange = market.outcomes[0]?.priceChange24h || 0;
  
  // Calculate price trend from history
  let trendDescription = 'stable';
  if (priceHistory.length >= 2) {
    const oldPrice = priceHistory[0].price;
    const newPrice = priceHistory[priceHistory.length - 1].price;
    const change = newPrice - oldPrice;
    if (change > 0.05) trendDescription = 'trending up significantly';
    else if (change > 0.02) trendDescription = 'trending up slightly';
    else if (change < -0.05) trendDescription = 'trending down significantly';
    else if (change < -0.02) trendDescription = 'trending down slightly';
  }

  const endDate = new Date(market.endDate);
  const now = Date.now();
  const daysToEnd = Math.ceil((endDate.getTime() - now) / (1000 * 60 * 60 * 24));
  const daysAgo = -daysToEnd; // Positive if market has ended
  const hasEnded = endDate.getTime() < now;
  const endedWeeksAgo = hasEnded && daysAgo >= 14;
  const tenseInstruction = endedWeeksAgo 
    ? 'IMPORTANT: This market ended ' + daysAgo + ' days ago. Use PAST TENSE throughout your analysis (e.g., "was priced", "had volume", "was resolved"). Refer to it as a historical market.'
    : hasEnded 
    ? 'NOTE: This market has ended recently. Use appropriate tense - past tense for completed events, present tense where still relevant.'
    : 'Use present tense - this market is still active.';

  const statusLabel = hasEnded ? (endedWeeksAgo ? `Ended ${daysAgo} days ago` : `Ended ${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`) : `${daysToEnd} days until resolution`;

  return `You are a prediction market research analyst helping users understand betting markets. Analyze the following market and provide comprehensive research.

MARKET INFORMATION:
- Question: "${market.question}"
- Category: ${market.category}
- Current YES Price: ${(yesPrice * 100).toFixed(1)}% (meaning the market ${hasEnded ? 'thought there was' : 'thinks there is'} a ${(yesPrice * 100).toFixed(0)}% chance of YES)
- Current NO Price: ${(noPrice * 100).toFixed(1)}%
- 24h Price Change: ${priceChange > 0 ? '+' : ''}${(priceChange * 100).toFixed(1)}%
- Price Trend: ${trendDescription}
- Trading Volume: $${market.volume?.toLocaleString() || 'Unknown'}
- Liquidity: $${market.liquidity?.toLocaleString() || 'Unknown'}
- Status: ${statusLabel}
- End Date: ${endDate.toLocaleDateString()}
${market.description ? `- Description: ${market.description}` : ''}

${tenseInstruction}

RECENT NEWS & CONTEXT:
${formatNewsForPrompt(newsResult)}

Provide your analysis in the following JSON format (respond ONLY with valid JSON, no markdown):

{
  "summary": "A 2-3 sentence overview of this market${endedWeeksAgo ? ' and its historical outcome' : ' and its current state'}",
  "whatIsThisBet": "Explain in simple terms what this bet${hasEnded ? ' was' : ' is'} about, as if explaining to someone who has never heard of prediction markets",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3", "Key point 4"],
  "riskLevel": "low" | "medium" | "high",
  "riskExplanation": "Why this risk level - consider odds${hasEnded ? ' and historical context' : ', time to resolution'}, and market factors",
  "confidence": 0-100,
  "confidenceExplanation": "Explanation of confidence in this analysis",
  "prosAndCons": {
    "pros": ["Reason${endedWeeksAgo ? ' that historically supported' : ' to consider'} betting YES", "Another reason", "Third reason"],
    "cons": ["Risk or reason for caution", "Another risk", "Third concern"]
  },
  "keyDates": ["Important date 1 and why", "Important date 2 and why"],
  "marketSentiment": "Describe what the${hasEnded ? ' final' : ' current'} price${hasEnded ? ' told' : ' tells'} us about market sentiment",
  "recommendation": "${endedWeeksAgo ? 'Historical analysis and insights from' : 'Balanced advice for someone considering'} this market - not financial advice, but educational guidance",
  "beginnerExplanation": "A very simple 1-2 sentence explanation a complete beginner could understand"
}

Important guidelines:
- Be objective and balanced
- Don't provide financial advice, but educate
- Consider both sides of the outcome
- Highlight key risks
- Make it accessible to beginners
- Base analysis on the market data provided
${endedWeeksAgo ? '- CRITICAL: Use PAST TENSE throughout (e.g., "was priced at", "had volume", "was resolved", "told us about sentiment")' : hasEnded ? '- Use past tense for completed events, present tense where still relevant' : '- Use present tense - market is still active'}`;
}

/**
 * Parse Gemini response into structured result
 */
function parseGeminiResponse(text: string, market: Market, newsResult: NewsSearchResult): ResearchResult {
  // Try to extract JSON from response
  let jsonText = text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonText = jsonMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonText);
    
    // Build sources list including news
    const sources = [
      { name: 'Polymarket Live Data', type: 'market', url: getPolymarketUrl(market) },
      { name: 'Price History Analysis', type: 'analysis' },
      { name: 'AI Market Analysis', type: 'ai' },
    ];
    
    // Add news sources
    newsResult.articles.slice(0, 3).forEach(article => {
      sources.push({ name: article.source, type: 'news', url: article.url });
    });

    return {
      summary: parsed.summary || 'Analysis not available',
      whatIsThisBet: parsed.whatIsThisBet || `This market asks: "${market.question}"`,
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      riskLevel: ['low', 'medium', 'high'].includes(parsed.riskLevel) ? parsed.riskLevel : 'medium',
      riskExplanation: parsed.riskExplanation || 'Risk assessment not available',
      confidence: typeof parsed.confidence === 'number' ? Math.min(100, Math.max(0, parsed.confidence)) : 50,
      confidenceExplanation: parsed.confidenceExplanation || 'Confidence based on available data',
      sources,
      prosAndCons: {
        pros: Array.isArray(parsed.prosAndCons?.pros) ? parsed.prosAndCons.pros : [],
        cons: Array.isArray(parsed.prosAndCons?.cons) ? parsed.prosAndCons.cons : [],
      },
      keyDates: Array.isArray(parsed.keyDates) ? parsed.keyDates : [],
      marketSentiment: parsed.marketSentiment || 'Sentiment analysis not available',
      recommendation: parsed.recommendation || 'Do your own research before making any decisions',
      beginnerExplanation: parsed.beginnerExplanation || `This is a prediction market about: ${market.question}`,
      newsArticles: newsResult.articles,
      newsSummary: newsResult.articles.length > 0 
        ? `Found ${newsResult.articles.length} real news source${newsResult.articles.length !== 1 ? 's' : ''} with clickable links.`
        : process.env.NEWS_API_KEY 
          ? 'No recent news articles found for this topic.'
          : 'News API key not configured. Add NEWS_API_KEY to environment variables to get real news sources.',
    };
  } catch (error) {
    console.error('[Research] Failed to parse Gemini response:', error);
    throw new Error('Failed to parse AI response. Please try again.');
  }
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // More lenient parsing - catch schema errors but continue
    let marketId: string;
    let providedMarket: any = undefined;
    
    try {
      const parsed = requestSchema.parse(body);
      marketId = parsed.marketId;
      providedMarket = parsed.market;
    } catch (schemaError) {
      console.error('[Research] Schema validation error:', schemaError);
      // Fallback: try to get marketId directly
      if (body.marketId) {
        marketId = body.marketId;
        providedMarket = body.market; // Try to use even if schema doesn't match
      } else {
        throw new Error('Missing marketId in request');
      }
    }

    console.log('[Research] Starting research for market:', marketId);

    // Step 1: Use provided market data or fetch from API
    let market: Market | null = null;
    
    // If market data is provided, use it (avoids unnecessary API call)
    if (providedMarket && providedMarket.id && providedMarket.question) {
      try {
        console.log('[Research] Using provided market data');
        market = {
          id: providedMarket.id || marketId,
          question: providedMarket.question,
          category: providedMarket.category || 'other',
          outcomes: Array.isArray(providedMarket.outcomes) 
            ? providedMarket.outcomes.map((o: any, i: number) => ({
                id: o.id || `${providedMarket.id || marketId}-${i}`,
                name: o.name || (i === 0 ? 'Yes' : 'No'),
                price: typeof o.price === 'number' ? o.price : 0.5,
                priceChange24h: o.priceChange24h || 0,
              }))
            : [
                { id: `${providedMarket.id || marketId}-0`, name: 'Yes', price: 0.5, priceChange24h: 0 },
                { id: `${providedMarket.id || marketId}-1`, name: 'No', price: 0.5, priceChange24h: 0 },
              ],
          volume: typeof providedMarket.volume === 'number' ? providedMarket.volume : 0,
          liquidity: typeof providedMarket.liquidity === 'number' ? providedMarket.liquidity : 0,
          endDate: providedMarket.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          slug: providedMarket.slug || '',
          description: providedMarket.description || '',
          active: providedMarket.active !== undefined ? providedMarket.active : true,
          closed: providedMarket.closed !== undefined ? providedMarket.closed : false,
          resolved: providedMarket.resolved !== undefined ? providedMarket.resolved : false,
          createdAt: providedMarket.createdAt || new Date().toISOString(),
          updatedAt: providedMarket.updatedAt || new Date().toISOString(),
        };
        console.log('[Research] Successfully transformed provided market data');
      } catch (transformError) {
        console.error('[Research] Failed to transform provided market data:', transformError);
        // Fall through to fetch from API
        market = null;
      }
    }
    
    if (!market) {
      // Try to fetch from API
      try {
        market = await fetchMarketDetail(marketId);
      } catch (error) {
        console.error('[Research] Failed to fetch market detail:', error);
        // Continue with error - we'll handle it below
      }

      if (!market) {
        console.error('[Research] Market not found:', marketId);
        return NextResponse.json(
          { 
            success: false,
            error: `Unable to fetch live data for this market. The market may no longer exist or the API is temporarily unavailable. Please try again later.`,
            message: 'Market not found or unavailable'
          },
          { status: 404 }
        );
      }
    }
    
    if (!market) {
      console.error('[Research] No market data available after all attempts');
      return NextResponse.json(
        { 
          success: false,
          error: `Unable to process research for this market. Please ensure the market exists and try again.`,
          message: 'Market data unavailable'
        },
        { status: 400 }
      );
    }

    // Step 2: Fetch price history (continue even if it fails)
    let priceHistory: PricePoint[] = [];
    try {
      priceHistory = await fetchMarketHistory(marketId, '7D');
      console.log(`[Research] Fetched ${priceHistory.length} price history points`);
    } catch (error) {
      console.error('[Research] Failed to fetch price history:', error);
      // Continue without price history - it's not critical
      priceHistory = [];
    }

    // Step 3: Search for relevant news (continue even if it fails)
    console.log('[Research] Searching for relevant news...');
    let newsResult: NewsSearchResult;
    try {
      newsResult = await searchNews(market);
      console.log(`[Research] Found ${newsResult.articles.length} news articles`);
    } catch (error) {
      console.error('[Research] Failed to search news:', error);
      // Continue with empty news results
      newsResult = { articles: [], query: market.question, totalResults: 0 };
    }

    // Step 4: Generate AI analysis
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false,
          error: 'GEMINI_API_KEY not configured. Please add it to your .env.local file.',
          message: 'AI analysis requires Gemini API key'
        },
        { status: 501 }
      );
    }

    let result: ResearchResult;
    try {
      console.log('[Research] Generating AI analysis via OpenRouter...');
      const prompt = buildResearchPrompt(market, priceHistory, newsResult);
      const text = await callOpenRouter(prompt);

      result = parseGeminiResponse(text, market, newsResult);
      console.log('[Research] AI analysis complete');
    } catch (aiError) {
      console.error('[Research] AI analysis failed:', aiError);
      return NextResponse.json(
        { 
          success: false,
          error: 'AI analysis failed. Please try again.',
          message: aiError instanceof Error ? aiError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      market: {
        id: market.id,
        question: market.question,
        category: market.category,
        yesPrice: market.outcomes[0]?.price || 0.5,
        noPrice: market.outcomes[1]?.price || 0.5,
        volume: market.volume,
        liquidity: market.liquidity,
        endDate: market.endDate,
        slug: market.slug,
      },
      research: result,
      generatedAt: Date.now(),
    });
  } catch (error) {
    console.error('[Research] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate research', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
