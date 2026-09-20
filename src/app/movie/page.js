'use client';

import React, { useState, useEffect, useRef } from 'react';

// Phone photos are often 3-10 MB. Shrinking covers before saving keeps
// the data file (and page load) small.
const MAX_IMAGE_SIZE = 600; // px, longest side

const compressImage = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_SIZE / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Modal & Form State
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const fileInputRef = useRef(null);

  // 1. LOAD MOVIES FROM THE SERVER (which reads src/data/movies.jsx)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/movies', { cache: 'no-store' });
        if (!res.ok) throw new Error('Load failed');
        const data = await res.json();
        if (!cancelled) setMovies(data);
      } catch (e) {
        console.error('Failed to load movies:', e);
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Stop the page behind the modal from scrolling on phones
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 2. Pick an image and shrink it
  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      setPreviewUrl(compressed);
    } catch (e) {
      console.error('Failed to read image:', e);
      alert("Couldn't read that image. Try a different one.");
    }
  };

  // 3. Save the movie: the server appends it to the .jsx file
  const handleSaveMovie = async (e) => {
    e.preventDefault();
    if (!title.trim() || !previewUrl || isSaving) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), cover: previewUrl }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Save failed');
      }

      const saved = await res.json();
      setMovies((prev) => [...prev, saved]);
      closeModal();
    } catch (err) {
      console.error('Save error:', err);
      alert("Couldn't save the movie. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Delete a movie: the server removes it from the .jsx file
  const handleDeleteMovie = async (idToDelete) => {
    try {
      const res = await fetch(`/api/movies?id=${idToDelete}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setMovies((prev) => prev.filter((movie) => movie.id !== idToDelete));
    } catch (err) {
      console.error('Delete error:', err);
      alert("Couldn't delete the movie. Please try again.");
    }
  };

  // Reset inputs and close modal
  const closeModal = () => {
    setIsOpen(false);
    setTitle('');
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-dvh bg-linear-to-b from-[#414141] to-[#2d2a2a] text-white px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8 sm:pt-16 sm:pb-8 flex flex-col items-center justify-start font-sans">

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

      {/* Status messages */}
      {isLoading && (
        <p className="text-neutral-400 text-sm py-8">Loading movies…</p>
      )}
      {loadError && (
        <p className="text-red-300 text-sm py-8 text-center">
          Couldn't load your movies. Try refreshing the page.
        </p>
      )}
      {!isLoading && !loadError && movies.length === 0 && (
        <p className="reveal text-neutral-400 text-sm py-8 text-center">
          No movies yet. Add your first one below.
        </p>
      )}

      {/* Movie Grid: 2 columns on phones, cards fit their photo so nothing gets cropped */}
      <div className="grid grid-cols-2 lg:grid-cols-3 items-start gap-3 sm:gap-6 w-full max-w-6xl">
        {movies.map((movie, i) => (
          <div
            key={movie.id}
            className="reveal bg-neutral-900 rounded-xl overflow-hidden shadow-2xl border border-neutral-800 transition-all duration-200 sm:hover:scale-[1.02] group relative"
            style={{ animationDelay: `${Math.min(i, 8) * 0.08}s` }}
          >
            <img src={movie.cover} alt={movie.title} className="w-full h-auto block" />

            <div className="p-3 sm:p-4">
              <h2 className="text-base sm:text-xl font-bold tracking-tight leading-snug break-words">
                {movie.title}
              </h2>
            </div>

            {/* Delete: always visible on phones, appears on hover on desktop */}
            <button
              onClick={() => handleDeleteMovie(movie.id)}
              aria-label={`Delete ${movie.title}`}
              className="absolute top-2 right-2 min-h-9 px-3 bg-red-600/80 hover:bg-red-600 text-white rounded-lg sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-150 text-xs font-semibold shadow-md"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* Add Movie Button */}
      <div className="reveal mt-8 sm:mt-12 w-full sm:w-auto" style={{ animationDelay: '0.2s' }}>
        <button
          onClick={() => setIsOpen(true)}
          className="w-full sm:w-auto min-h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95"
        >
          + Add New Movie
        </button>
      </div>

      {/* Add Movie Modal (bottom sheet on phones, centered on larger screens) */}
      {isOpen && (
        <div className="fade-in fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm sm:p-4">
          <div className="slide-up bg-neutral-900 border border-neutral-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[92dvh] overflow-y-auto p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl">
            <h3 className="text-xl sm:text-2xl font-bold mb-4">Add a New Movie</h3>

            <form onSubmit={handleSaveMovie} className="space-y-4">

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Movie Cover</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                {previewUrl ? (
                  <div className="relative group rounded-lg overflow-hidden border border-neutral-700 bg-neutral-800">
                    <img src={previewUrl} alt="Preview" className="w-full max-h-72 object-contain mx-auto block" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 sm:bg-black/50 sm:opacity-0 sm:group-hover:opacity-100 flex items-center justify-center text-sm font-semibold transition-opacity duration-200"
                    >
                      Change Image
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 border-2 border-dashed border-neutral-700 hover:border-neutral-500 rounded-lg flex flex-col items-center justify-center gap-2 text-neutral-400 hover:text-neutral-200 transition-colors"
                  >
                    <span className="text-2xl">📷</span>
                    <span className="text-sm font-medium">Tap to upload cover</span>
                  </button>
                )}
              </div>

              {/* Title Input */}
              <div>
                <label htmlFor="movie-title" className="block text-sm font-medium text-neutral-400 mb-1">Movie Title</label>
                <input
                  id="movie-title"
                  type="text"
                  required
                  placeholder="e.g., Inception"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>

              {/* Form Controls */}
              <div className="flex gap-3 sm:justify-end pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none min-h-11 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-300 font-medium py-2 px-5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || !previewUrl || isSaving}
                  className="flex-1 sm:flex-none min-h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-5 rounded-lg transition-colors"
                >
                  {isSaving ? 'Saving…' : 'Add Movie'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}