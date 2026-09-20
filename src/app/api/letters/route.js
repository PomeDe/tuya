// Put this file at: src/app/api/letters/route.js
//
// Browsers can't write to files, so the page talks to this route and this
// route reads/writes src/data/letters.jsx on the server.

import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FILE = path.join(process.cwd(), 'src', 'data', 'letters.jsx');

const HEADER =
  '// Saved letters. This file is rewritten automatically by /api/letters.\n' +
  '// Avoid editing it by hand while the server is running.\n\n';

const MARKER = 'export const letters =';

// Read the array back out of the .jsx file
async function readLetters() {
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
async function writeLetters(letters) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const content = `${HEADER}${MARKER} ${JSON.stringify(letters, null, 2)};\n`;
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
    return NextResponse.json(await readLetters());
  } catch (err) {
    console.error('Failed to read letters:', err);
    return NextResponse.json({ error: 'Could not read letters' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const content = typeof body?.content === 'string' ? body.content.trim() : '';

    if (!title || !content) {
      return NextResponse.json({ error: 'A title and content are required' }, { status: 400 });
    }

    const newLetter = await withLock(async () => {
      const letters = await readLetters();
      const letter = {
        id: letters.length > 0 ? Math.max(...letters.map((l) => l.id)) + 1 : 0,
        title,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        content,
      };
      await writeLetters([letter, ...letters]); // newest first
      return letter;
    });

    return NextResponse.json(newLetter, { status: 201 });
  } catch (err) {
    console.error('Failed to save letter:', err);
    return NextResponse.json({ error: 'Could not save the letter' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = Number(new URL(request.url).searchParams.get('id'));
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: 'A valid id is required' }, { status: 400 });
    }

    await withLock(async () => {
      const letters = await readLetters();
      await writeLetters(letters.filter((l) => l.id !== id));
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Failed to delete letter:', err);
    return NextResponse.json({ error: 'Could not delete the letter' }, { status: 500 });
  }
}