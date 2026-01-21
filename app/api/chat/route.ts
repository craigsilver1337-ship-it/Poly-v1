import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Market } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const AI_MODEL = 'google/gemini-2.0-flash-001';

const requestSchema = z.object({
  query: z.string(),
  marketContext: z.array(z.any()).optional(),
});

async function callOpenRouter(systemPrompt: string, userQuery: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('API key not configured');
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
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userQuery },
      ],
      max_tokens: 500,
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, marketContext } = requestSchema.parse(body);

    const marketSummary = marketContext?.slice(0, 5).map((m: Market) => 
      `• "${m.question}" - ${Math.round((m.outcomes?.[0]?.price || 0.5) * 100)}% YES`
    ).join('\n') || 'No specific markets loaded';

    const systemPrompt = `You are PolyPulse's AI Market Assistant - a friendly, insightful guide for prediction market traders.

Your personality:
- Enthusiastic and encouraging, but not over the top
- Data-driven and analytical
- Honest about uncertainty
- Uses emojis sparingly but effectively (1-2 per response max)

Your capabilities:
- Explain prediction markets and how they work
- Help interpret market prices (price = probability)
- Provide context on current events affecting markets
- Suggest research strategies and things to consider
- Point out interesting patterns or opportunities

Current context - Top markets right now:
${marketSummary}

Guidelines:
- Keep responses concise (2-4 sentences typically)
- Be specific and actionable
- Never give financial advice - frame as "research" or "things to consider"
- If asked about specific markets, reference the context above
- Use **bold** for emphasis on key points
- End with a helpful suggestion or question when appropriate`;

    const response = await callOpenRouter(systemPrompt, query);

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error('[Chat API] Error:', error);

    // Return smart fallback based on query
    const query = (await request.json().catch(() => ({}))).query?.toLowerCase() || '';
    
    let fallbackResponse = "🤔 I'm having a moment - let me think differently. Try asking about specific topics like 'crypto markets' or 'political odds', or use price filters like 'above 60%'.";
    
    if (query.includes('help')) {
      fallbackResponse = "👋 I can help you explore prediction markets! Try asking about specific topics (crypto, politics, sports), filtering by price ('above 70%'), or finding trends ('what's hot today').";
    } else if (query.includes('explain') || query.includes('how')) {
      fallbackResponse = "📚 **Prediction markets** are like stock markets for future events. The price represents probability - a 70¢ price means ~70% chance of happening. When you disagree with the crowd, that's your opportunity!";
    }

    return NextResponse.json({
      success: true,
      response: fallbackResponse,
    });
  }
}
