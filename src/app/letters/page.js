'use client';

import Link from "next/link";
import React, { useState, useEffect } from 'react';

export default function LettersPage() {
  const [letters, setLetters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Modal toggles & content states
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeLetter, setActiveLetter] = useState(null); // Letter currently being read

  // Form input fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // 1. LOAD LETTERS FROM THE SERVER (which reads src/data/letters.jsx)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/letters', { cache: 'no-store' });
        if (!res.ok) throw new Error('Load failed');
        const data = await res.json();
        if (!cancelled) setLetters(data);
      } catch (e) {
        console.error('Failed to load letters:', e);
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Stop the page behind a modal from scrolling on phones
  useEffect(() => {
    document.body.style.overflow = isOpen || activeLetter ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, activeLetter]);

  // 2. Save a new letter: the server adds it to the .jsx file
  const handleSaveLetter = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Save failed');
      }

      const saved = await res.json();
      setLetters((prev) => [saved, ...prev]); // newest first
      closeModal();
    } catch (err) {
      console.error('Save error:', err);
      alert("Couldn't save the letter. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Delete a letter: the server removes it from the .jsx file
  const handleDeleteLetter = async (e, idToDelete) => {
    e.stopPropagation(); // Don't open the reader when tapping delete

    // The delete button is always visible on touch screens,
    // so ask first to avoid accidental taps wiping a letter.
    if (!window.confirm("Delete this letter?")) return;

    try {
      const res = await fetch(`/api/letters?id=${idToDelete}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');

      setLetters((prev) => prev.filter((letter) => letter.id !== idToDelete));
      if (activeLetter?.id === idToDelete) {
        setActiveLetter(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert("Couldn't delete the letter. Please try again.");
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setTitle('');
    setContent('');
  };

  return (
    <div className="min-h-dvh bg-linear-to-br from-neutral-700 to-neutral-950 text-white px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8 sm:pt-16 sm:pb-8 flex flex-col items-center justify-start font-sans">

      {/* Animations */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .reveal   { animation: fadeUp 0.6s ease-out backwards; }
        .fade-in  { animation: fadeIn 0.25s ease-out; }
        .slide-up { animation: slideUp 0.35s ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .reveal, .fade-in, .slide-up { animation: none; }
        }
      `}</style>

      {/* Back button */}
      <div className="reveal w-full max-w-5xl flex justify-start mb-4 sm:mb-6">
        <Link
          href="/"
          aria-label="Go back"
          className="inline-flex items-center gap-1.5 min-h-11 pl-3 pr-4 bg-white/20 hover:bg-white/30 active:scale-[0.97] border border-white/30 rounded-full text-white text-sm font-semibold backdrop-blur-md transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          <span>Back</span>
        </Link>
      </div>

      {/* Page Header */}
      <div className="reveal w-full max-w-5xl flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-800 pb-5 sm:pb-6 mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Our Letters</h1>
          <p className="text-sm text-neutral-400 mt-1">The poetry of our love</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="w-full sm:w-auto min-h-12 sm:min-h-0 bg-red-500 hover:bg-red-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-all shadow-lg hover:shadow-red-500/10 active:scale-95 text-sm"
        >
          Write New Letter
        </button>
      </div>

      {/* Status messages */}
      {isLoading && (
        <p className="text-neutral-400 text-sm py-8">Loading letters…</p>
      )}
      {loadError && (
        <p className="text-red-300 text-sm py-8 text-center">
          Couldn't load your letters. Try refreshing the page.
        </p>
      )}
      {!isLoading && !loadError && letters.length === 0 && (
        <div className="reveal text-center py-16 sm:py-20 text-neutral-500 max-w-md">
          <p className="text-lg">No letters available.</p>
          <p className="text-sm mt-1">Tap the button above to write your first letter.</p>
        </div>
      )}

      {/* Letters Grid */}
      {letters.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full max-w-5xl">
          {letters.map((letter, i) => (
            <div
              key={letter.id}
              onClick={() => setActiveLetter(letter)}
              className="reveal bg-neutral-900 rounded-xl p-4 sm:p-5 pb-14 border border-neutral-800 min-h-44 sm:min-h-48 cursor-pointer active:scale-[0.99] sm:hover:border-neutral-700 transition-all group relative shadow-md sm:hover:shadow-xl"
              style={{ animationDelay: `${Math.min(i, 8) * 0.08}s` }}
            >
              <div className="flex justify-between items-start gap-4 mb-2">
                <h2 className="text-lg font-bold tracking-tight text-neutral-100 truncate w-full">{letter.title}</h2>
                <span className="text-xs text-neutral-500 whitespace-nowrap pt-1">{letter.date}</span>
              </div>
              <p className="text-sm text-neutral-400 line-clamp-3 sm:line-clamp-4 leading-relaxed font-light break-words">
                {letter.content}
              </p>

              {/* Delete button: always visible on phones, appears on hover on desktop */}
              <button
                onClick={(e) => handleDeleteLetter(e, letter.id)}
                className="absolute bottom-3 right-3 min-h-9 px-3 bg-neutral-800 hover:bg-red-950 text-neutral-400 hover:text-red-400 rounded-md sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity text-xs border border-neutral-700 hover:border-red-900/50"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: WRITE A NEW LETTER (bottom sheet on phones, centered on larger screens) */}
      {isOpen && (
        <div className="fade-in fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm sm:p-4">
          <div className="slide-up bg-neutral-900 border border-neutral-800 rounded-t-2xl sm:rounded-2xl w-full max-w-xl max-h-[92dvh] overflow-y-auto p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl">
            <h3 className="text-xl font-bold mb-4 border-b border-neutral-800 pb-2">Write a Letter</h3>

            <form onSubmit={handleSaveLetter} className="space-y-4">
              <div>
                <label htmlFor="letter-title" className="block text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1">Subject / Title</label>
                {/* text-base on phones stops iOS from zooming in when the field is focused */}
                <input
                  id="letter-title"
                  type="text"
                  required
                  placeholder="e.g., A Note to My Love"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-base sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="letter-content" className="block text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1">Message Content</label>
                <textarea
                  id="letter-content"
                  required
                  rows={6}
                  placeholder="Start typing your entry here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-base sm:text-sm font-sans resize-none leading-relaxed sm:h-48"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none min-h-11 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-300 text-sm font-semibold py-2 px-5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || !content.trim() || isSaving}
                  className="flex-1 sm:flex-none min-h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2 px-5 rounded-lg transition-colors"
                >
                  {isSaving ? 'Saving…' : 'Store Letter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LETTER READER */}
      {activeLetter && (
        <div
          onClick={() => setActiveLetter(null)}
          className="fade-in fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()} // Tapping the text shouldn't close it
            className="slide-up bg-neutral-900 border border-neutral-800 rounded-t-2xl sm:rounded-2xl w-full max-w-2xl p-5 sm:p-8 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl max-h-[88dvh] flex flex-col"
          >
            <div className="flex justify-between items-start gap-4 border-b border-neutral-800 pb-4 mb-4">
              <div className="min-w-0">
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight break-words">{activeLetter.title}</h3>
                <span className="text-xs text-neutral-500 mt-1 block">Written on {activeLetter.date}</span>
              </div>
              <button
                onClick={() => setActiveLetter(null)}
                aria-label="Close letter"
                className="shrink-0 text-neutral-400 hover:text-white font-bold text-sm bg-neutral-800 h-10 w-10 rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Scrollable letter text: fills whatever space the screen has left */}
            <div className="flex-1 min-h-0 overflow-y-auto text-neutral-300 text-[17px] sm:text-base leading-relaxed pr-1 font-serif whitespace-pre-wrap break-words">
              {activeLetter.content}
            </div>

            <div className="mt-5 pt-4 border-t border-neutral-800 flex justify-end">
              <button
                onClick={() => setActiveLetter(null)}
                className="w-full sm:w-auto min-h-11 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-semibold py-2 px-5 rounded-lg transition-colors"
              >
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}