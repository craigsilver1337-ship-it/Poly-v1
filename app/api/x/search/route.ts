import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const requestSchema = z.object({
  // Free-form query. We add some safe defaults server-side.
  query: z.string().min(1).max(300),
  maxResults: z.coerce.number().min(10).max(50).optional().default(25),
});

type XUser = {
  id: string;
  username: string;
  name?: string;
  profile_image_url?: string;
  verified?: boolean;
};

type XTweet = {
  id: string;
  text: string;
  created_at?: string;
  author_id?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = requestSchema.parse(body);

    // Support a few common env var names to reduce setup friction.
    // Prefer X_BEARER_TOKEN (documented), but allow TWITTER_BEARER_TOKEN / BEARER_TOKEN too.
    const bearer =
      process.env.X_BEARER_TOKEN ||
      process.env.TWITTER_BEARER_TOKEN ||
      process.env.BEARER_TOKEN;
    if (!bearer) {
      return NextResponse.json(
        {
          error: 'X integration is not configured',
          message:
            'Missing bearer token in environment (.env.local). Set X_BEARER_TOKEN (preferred) or TWITTER_BEARER_TOKEN or BEARER_TOKEN, then restart the dev server.',
        },
        { status: 501 }
      );
    }

    // Keep the query simple and predictable to reduce errors.
    // -is:retweet avoids noisy duplicates, lang:en makes UI nicer by default.
    const q = `${parsed.query} -is:retweet lang:en`.slice(0, 512);

    const url = new URL('https://api.twitter.com/2/tweets/search/recent');
    url.searchParams.set('query', q);
    url.searchParams.set('max_results', String(parsed.maxResults));
    url.searchParams.set('tweet.fields', 'created_at,author_id,public_metrics,lang');
    url.searchParams.set('expansions', 'author_id');
    url.searchParams.set('user.fields', 'username,name,profile_image_url,verified');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    const resp = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${bearer}`,
      },
      signal: controller.signal,
      cache: 'no-store',
    }).finally(() => clearTimeout(timeout));

    const payload = await resp.json().catch(() => null);

    if (!resp.ok) {
      return NextResponse.json(
        {
          error: 'X API request failed',
          status: resp.status,
          details: payload,
        },
        { status: 502 }
      );
    }

    const tweets: XTweet[] = Array.isArray(payload?.data) ? payload.data : [];
    const users: XUser[] = Array.isArray(payload?.includes?.users) ? payload.includes.users : [];
    const userById = new Map(users.map((u) => [u.id, u]));

    const result = tweets.map((t) => {
      const user = t.author_id ? userById.get(t.author_id) : undefined;
      return {
        id: t.id,
        text: t.text,
        createdAt: t.created_at || null,
        author: user
          ? {
              id: user.id,
              username: user.username,
              name: user.name || null,
              profileImageUrl: user.profile_image_url || null,
              verified: !!user.verified,
            }
          : null,
      };
    });

    return NextResponse.json(
      {
        query: parsed.query,
        count: result.length,
        tweets: result,
      },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Server error', message }, { status: 500 });
  }
}


