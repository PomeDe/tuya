// Put this file at: src/app/api/movies/route.js
//
// Stores movies in Upstash Redis instead of a file, because Vercel's disk is read-only.
// Needs two environment variables (see setup steps): a REST URL and a REST token.

import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HASH = 'movies';          // one hash: field = movie id, value = the movie
const COUNTER = 'movies:nextId'; // atomic counter for new ids

// Covers are shrunk in the browser; this is just a safety net against huge uploads
const MAX_COVER_CHARS = 700_000;

// Accepts either the Upstash names or the older Vercel KV names
const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

function getRedis() {
  if (!url || !token) {
    throw new Error(
      'Missing Redis env vars: set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN'
    );
  }
  return new Redis({ url, token });
}

export async function GET() {
  try {
    const data = await getRedis().hgetall(HASH); // null when empty
    const movies = Object.values(data ?? {})
      .map((v) => (typeof v === 'string' ? JSON.parse(v) : v))
      .sort((a, b) => a.id - b.id);
    return NextResponse.json(movies);
  } catch (err) {
    console.error('Failed to read movies:', err);
    return NextResponse.json({ error: 'Could not read movies' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const cover = typeof body?.cover === 'string' ? body.cover : '';

    if (!title || !cover.startsWith('data:image/')) {
      return NextResponse.json({ error: 'A title and an image are required' }, { status: 400 });
    }
    if (cover.length > MAX_COVER_CHARS) {
      return NextResponse.json({ error: 'That image is too large' }, { status: 413 });
    }

    const redis = getRedis();
    const id = await redis.incr(COUNTER);
    const movie = { id, title, cover };
    await redis.hset(HASH, { [id]: movie });

    return NextResponse.json(movie, { status: 201 });
  } catch (err) {
    console.error('Failed to save movie:', err);
    return NextResponse.json({ error: 'Could not save the movie' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = Number(new URL(request.url).searchParams.get('id'));
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: 'A valid id is required' }, { status: 400 });
    }

    await getRedis().hdel(HASH, String(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Failed to delete movie:', err);
    return NextResponse.json({ error: 'Could not delete the movie' }, { status: 500 });
  }
}