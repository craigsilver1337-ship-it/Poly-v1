/**
 * AI API Client for AI-Powered Market Briefs
 * Uses OpenRouter for access to multiple AI models
 * Server-side only - never expose API key to client
 */

import {
  GeminiBriefRequest,
  GeminiBrief,
  GeminiResponse,
  GeminiError,
  KeyVariable,
  SourceSuggestion,
} from '@/types';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const REQUEST_TIMEOUT = 60000;

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const AI_MODEL = 'google/gemini-2.0-flash-001';

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
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
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

/**
 * Build the structured prompt for AI
 */
function buildPrompt(request: GeminiBriefRequest): string {
  const { market, priceHistory, scannerFlags, userThesis, userBias } = request;
  
  const recentPrices = priceHistory.slice(-10);
  const priceChange = recentPrices.length >= 2
    ? ((recentPrices[recentPrices.length - 1].price - recentPrices[0].price) / recentPrices[0].price * 100).toFixed(1)
    : '0';
  
  const currentPrice = market.outcomes[0]?.price || 0.5;
  const daysToEnd = Math.max(0, Math.ceil((new Date(market.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  
  let prompt = `You are a prediction market analyst. Analyze the following market and provide a structured research brief.

MARKET DETAILS:
- Question: ${market.question}
- Category: ${market.category}
- Current YES Price: ${(currentPrice * 100).toFixed(1)}%
- Recent Price Change: ${priceChange}%
- Days Until Resolution: ${daysToEnd}
- Volume: $${market.volume?.toLocaleString() || 'N/A'}
${market.description ? `- Description: ${market.description}` : ''}

`;

  if (scannerFlags && scannerFlags.length > 0) {
    prompt += `\nSCANNER FLAGS DETECTED:\n`;
    scannerFlags.forEach((flag, i) => {
      prompt += `${i + 1}. [${flag.severity.toUpperCase()}] ${flag.title}: ${flag.explanation}\n`;
    });
  }

  if (userThesis) {
    prompt += `\nUSER'S THESIS: ${userThesis}\n`;
  }

  if (userBias) {
    prompt += `USER'S BIAS: ${userBias}\n`;
  }

  prompt += `
Please provide your analysis in the following JSON format:

{
  "resolutionChecklist": ["item1", "item2", ...],
  "keyVariables": [
    {"name": "variable name", "currentState": "description", "directionOfImpact": "bullish|bearish|neutral", "importance": "high|medium|low"}
  ],
  "baseCase": "2-3 sentences describing the most likely scenario",
  "bullCase": "1-2 sentences for the optimistic scenario",
  "bearCase": "1-2 sentences for the pessimistic scenario",
  "whatWouldChangeMyMind": ["point1", "point2", "point3"],
  "debatePrompts": ["question1", "question2", "question3"],
  "confidence": 0-100,
  "confidenceJustification": "Brief explanation of confidence level",
  "sourcesToConsult": [
    {"type": "news|official|data|social", "description": "what to look for", "searchQuery": "suggested search"}
  ]
}

Be specific, actionable, and evidence-focused. Do not provide financial advice. Frame as research analysis only.`;

  return prompt;
}

/**
 * Parse AI response into structured brief
 */
function parseAIResponse(
  text: string,
  marketId: string,
  startTime: number
): GeminiBrief {
  // Extract JSON from response (handle markdown code blocks)
  let jsonText = text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1];
  }
  
  // Try to find JSON object in text
  const jsonObjectMatch = jsonText.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    jsonText = jsonObjectMatch[0];
  }
  
  try {
    const parsed = JSON.parse(jsonText);
    
    return {
      id: `brief-${Date.now()}`,
      marketId,
      generatedAt: Date.now(),
      resolutionChecklist: Array.isArray(parsed.resolutionChecklist)
        ? parsed.resolutionChecklist
        : ['Unable to parse checklist'],
      keyVariables: Array.isArray(parsed.keyVariables)
        ? parsed.keyVariables.map((v: Partial<KeyVariable>) => ({
            name: v.name || 'Unknown',
            currentState: v.currentState || 'Unknown',
            directionOfImpact: v.directionOfImpact || 'neutral',
            importance: v.importance || 'medium',
          }))
        : [],
      baseCase: parsed.baseCase || 'Analysis not available',
      bullCase: parsed.bullCase || 'Not provided',
      bearCase: parsed.bearCase || 'Not provided',
      whatWouldChangeMyMind: Array.isArray(parsed.whatWouldChangeMyMind)
        ? parsed.whatWouldChangeMyMind
        : [],
      debatePrompts: Array.isArray(parsed.debatePrompts)
        ? parsed.debatePrompts
        : [],
      confidence: typeof parsed.confidence === 'number'
        ? Math.min(100, Math.max(0, parsed.confidence))
        : 50,
      confidenceJustification: parsed.confidenceJustification || 'Not provided',
      sourcesToConsult: Array.isArray(parsed.sourcesToConsult)
        ? parsed.sourcesToConsult.map((s: Partial<SourceSuggestion>) => ({
            type: s.type || 'news',
            description: s.description || 'General research',
            searchQuery: s.searchQuery,
          }))
        : [],
      processingTime: Date.now() - startTime,
      modelVersion: AI_MODEL,
    };
  } catch {
    // Return a fallback brief if parsing fails
    return {
      id: `brief-${Date.now()}`,
      marketId,
      generatedAt: Date.now(),
      resolutionChecklist: ['Unable to parse AI response'],
      keyVariables: [],
      baseCase: text.slice(0, 500) || 'Analysis generation failed',
      bullCase: 'Not available',
      bearCase: 'Not available',
      whatWouldChangeMyMind: [],
      debatePrompts: ['What factors should be considered?'],
      confidence: 30,
      confidenceJustification: 'Low confidence due to parsing error',
      sourcesToConsult: [],
      processingTime: Date.now() - startTime,
      modelVersion: AI_MODEL,
    };
  }
}

/**
 * Generate a market brief using AI
 */
export async function generateMarketBrief(
  request: GeminiBriefRequest
): Promise<GeminiResponse> {
  const startTime = Date.now();
  
  // Check for API key
  if (!process.env.GEMINI_API_KEY) {
    return {
      success: false,
      error: {
        code: 'MISSING_KEY',
        message: 'API key not configured. Please set GEMINI_API_KEY in your environment.',
      },
    };
  }
  
  let lastError: GeminiError | null = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const prompt = buildPrompt(request);
      
      // Generate with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT);
      });
      
      const generatePromise = callOpenRouter(prompt);
      
      const text = await Promise.race([generatePromise, timeoutPromise]);
      
      if (!text) {
        throw new Error('Empty response from AI');
      }
      
      const brief = parseAIResponse(text, request.market.id, startTime);
      
      return { success: true, brief };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('timeout')) {
        lastError = {
          code: 'TIMEOUT',
          message: 'Request timed out. Please try again.',
          retryAfter: 5,
        };
      } else if (errorMessage.includes('429') || errorMessage.includes('rate')) {
        lastError = {
          code: 'RATE_LIMITED',
          message: 'Rate limited. Please wait before trying again.',
          retryAfter: 30,
        };
        // Don't retry on rate limit
        break;
      } else {
        lastError = {
          code: 'API_ERROR',
          message: `API error: ${errorMessage}`,
        };
      }
      
      // Wait before retry
      if (attempt < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (attempt + 1)));
      }
    }
  }
  
  return {
    success: false,
    error: lastError || {
      code: 'API_ERROR',
      message: 'Failed to generate brief after multiple attempts',
    },
  };
}
