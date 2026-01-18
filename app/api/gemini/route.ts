import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateMarketBrief, generateMockBrief } from '@/lib/gemini/client';
import { GeminiBriefRequest } from '@/types';

const requestSchema = z.object({
  market: z.object({
    id: z.string(),
    question: z.string(),
    category: z.string(),
    endDate: z.string(),
    volume: z.number().optional(),
    description: z.string().optional(),
    outcomes: z.array(z.object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
      priceChange24h: z.number(),
    })),
  }),
  priceHistory: z.array(z.object({
    timestamp: z.number(),
    price: z.number(),
    volume: z.number().optional(),
  })).optional().default([]),
  scannerFlags: z.array(z.any()).optional(),
  userThesis: z.string().optional(),
  userBias: z.enum(['bullish', 'bearish', 'neutral']).optional(),
  useMock: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = requestSchema.parse(body);

    // Use mock if requested or if API key is missing
    if (parsed.useMock || !process.env.GEMINI_API_KEY) {
      const brief = generateMockBrief(parsed as unknown as GeminiBriefRequest);
      return NextResponse.json({ success: true, brief });
    }

    const result = await generateMarketBrief(parsed as unknown as GeminiBriefRequest);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Gemini API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: 'Invalid request body', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'API_ERROR', message: 'Failed to generate brief' } },
      { status: 500 }
    );
  }
}
