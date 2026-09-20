// Put this file at: src/app/api/movies/route.js
//
// Browsers can't write to files, so the page talks to this route and this
// route reads/writes src/data/movies.jsx on the server.

import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FILE = path.join(process.cwd(), 'src', 'data', 'movies.jsx');

const HEADER =
  '// Saved movies. This file is rewritten automatically by /api/movies.\n' +
  '// Avoid editing it by hand while the server is running.\n\n';

const MARKER = 'export const movies =';

// Read the array back out of the .jsx file
async function readMovies() {
  try {
    const raw = await fs.readFile(FILE, 'utf8');
    const markerAt = raw.indexOf(MARKER);
    if (markerAt === -1) return [];
    const start = raw.indexOf('[', markerAt);
    const end = raw.lastIndexOf(']');
    if (start === -1 || end === -1) return [];
    return JSON.parse(raw.slice(start, end + 1));
  } catch (err) {
    if (err.code === 'ENOENT') return []; // file doesn't exist yet
    throw err;
  }
}

// Write the array into the .jsx file (temp file + rename so a crash can't leave it half-written)
async function writeMovies(movies) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const content = `${HEADER}${MARKER} ${JSON.stringify(movies, null, 2)};\n`;
  const tmp = `${FILE}.tmp`;
  await fs.writeFile(tmp, content, 'utf8');
  await fs.rename(tmp, FILE);
}

// Run read-modify-write jobs one at a time so two requests can't overwrite each other
let lock = Promise.resolve();
function withLock(task) {
  const run = lock.then(task);
  lock = run.catch(() => {});
  return run;
}

export async function GET() {
  try {
    return NextResponse.json(await readMovies());
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

    const newMovie = await withLock(async () => {
      const movies = await readMovies();
      const movie = {
        id: movies.length > 0 ? Math.max(...movies.map((m) => m.id)) + 1 : 0,
        title,
        cover,
      };
      await writeMovies([...movies, movie]);
      return movie;
    });

    return NextResponse.json(newMovie, { status: 201 });
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

    await withLock(async () => {
      const movies = await readMovies();
      await writeMovies(movies.filter((m) => m.id !== id));
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Failed to delete movie:', err);
    return NextResponse.json({ error: 'Could not delete the movie' }, { status: 500 });
  }
}