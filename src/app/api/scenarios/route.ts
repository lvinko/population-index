import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { PredictionInput } from '@/lib/utils/types';
import {
  createScenario,
  deleteScenario,
  fetchScenarioList,
  updateScenario,
} from '@/services/scenarioRepository';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 25;

type RateLimitEntry = {
  count: number;
  expiresAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

const scenarioMutationSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .trim()
    .min(1, 'Scenario name is required.')
    .max(120, 'Scenario name is too long.'),
  input: z.custom<PredictionInput>((value) => typeof value === 'object' && value !== null, {
    message: 'Invalid scenario payload.',
  }),
});

const scenarioDeleteSchema = z.object({
  id: z.string().min(1, 'Scenario id is required.'),
});

const getClientKey = (request: Request) => {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'anonymous';
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return 'anonymous';
};

const checkRateLimit = (key: string) => {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.expiresAt < now) {
    rateLimitStore.set(key, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  entry.count += 1;
  rateLimitStore.set(key, entry);
  return false;
};

const enforceRateLimit = (request: Request) => {
  const key = getClientKey(request);
  if (checkRateLimit(key)) {
    return NextResponse.json(
      { error: 'Too many scenario requests. Please slow down and try again shortly.' },
      { status: 429 }
    );
  }
  return null;
};

export async function GET(request: Request) {
  const rateLimitResponse = enforceRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const scenarios = await fetchScenarioList();
    return NextResponse.json({ data: scenarios });
  } catch (error) {
    console.error('Failed to fetch scenarios', error);
    return NextResponse.json({ error: 'Unable to load scenarios.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const rateLimitResponse = enforceRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const payload = await request.json();
    const parsed = scenarioMutationSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { id, name, input } = parsed.data;

    if (id) {
      await updateScenario(id, name, input);
    } else {
      await createScenario(name, input);
    }

    const scenarios = await fetchScenarioList();
    return NextResponse.json({ data: scenarios });
  } catch (error) {
    console.error('Failed to save scenario', error);
    return NextResponse.json({ error: 'Unable to save scenario.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const rateLimitResponse = enforceRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const payload = await request.json();
    const parsed = scenarioDeleteSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    await deleteScenario(parsed.data.id);
    const scenarios = await fetchScenarioList();
    return NextResponse.json({ data: scenarios });
  } catch (error) {
    console.error('Failed to delete scenario', error);
    return NextResponse.json({ error: 'Unable to delete scenario.' }, { status: 500 });
  }
}

