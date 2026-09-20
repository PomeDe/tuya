'use client';

import Link from "next/link";
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

// PASTE YOUR ORIGINAL "Angel in The Snow" base64 image string between the quotes below.
// (It's too long to copy reliably, so I moved it to its own line to make it easy to paste back.)
// Until you do, that card shows a plain gradient instead of a broken image.

const TRACKS = [
  {
    id: 'song-1',
    title: 'Luna',
    artist: 'Smashing Pumpkins',
    src: '/audio/luna.mp3',
    coverUrl: 'https://ew.com/thmb/70kfPJcF-4c1GjIB-weWYIJtTmw=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/siamese-dream-9adbee3e6d724a5595a9be3f1e0c47a6.jpg'
  },
  {
    id: 'song-2',
    title: 'Nubian Queen',
    artist: 'Micheal Angelo',
    src: '/audio/Nubian.mp3',
    coverUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKjsPAsiyr9DKNPGtHzHaegEUKugWkT2HkbyIUBDTEXMIIzBhAR5On2Bez&s=10'
  },
  {
    id: 'song-3',
    title: 'Angel in The Snow',
    artist: 'Elliot Smith',
    src: '/audio/Angel.mp3',
    coverUrl: "https://i.scdn.co/image/ab67616d0000b2732b82c19b95a3adc173b76e96"
  },
  {
    id: 'song-4',
    title: 'Melhii Gunj',
    artist: 'The Lemons',
    src: '/audio/gunj.mp3',
    coverUrl: 'https://i.scdn.co/image/ab67616d0000b2733a91e9f8027435d1fe47f5dd'
  },
  {
    id: 'song-5',
    title: 'Anenome',
    artist: 'The Brian Jonestown Massacre',
    src: '/audio/ane.mp3',
    coverUrl: 'https://i.scdn.co/image/ab67616d0000b2732557f5ed1ca07d5111d49b93'
  },
  {
    id: 'song-6',
    title: 'Rust',
    artist: 'Black Label Society',
    src: '/audio/Rust.mp3',
    coverUrl: 'https://i.ytimg.com/vi/cxGZj3xLzfI/maxresdefault.jpg'
  },
  {
    id: 'song-7',
    title: 'Comme un boomerang',
    artist: 'Gainsbourg',
    src: '/audio/boom.mp3',
    coverUrl: 'https://m.media-amazon.com/images/I/51wmUxnLPzL._SY300_SX300_QL70_FMwebp_.jpg'
  },
  {
    id: 'song-8',
    title: 'All I Need',
    artist: 'Radiohead',
    src: '/audio/radio.mp3',
    coverUrl: 'https://i.scdn.co/image/ab67616d0000b273de3c04b5fc750b68899b20a9'
  }
];

export default function Home() {
  const [activeTrackId, setActiveTrackId] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleTrackClick = (track) => {
    if (activeTrackId === track.id) {
      if (audioRef.current) audioRef.current.pause();
      setActiveTrackId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    audioRef.current = new Audio(track.src);

    audioRef.current.onended = () => {
      setActiveTrackId(null);
    };

    audioRef.current.play()
      .then(() => {
        setActiveTrackId(track.id);
      })
      .catch((err) => {
        console.error("Audio playback error:", err);
        setActiveTrackId(null);
      });
  };

  return (
    <div className="min-h-dvh bg-linear-to-br from-[#b36b52] to-[#2d3029] text-white px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:p-8 flex flex-col items-center font-sans">
 <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .reveal {
          animation: fadeUp 0.7s ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .reveal { animation: none; }
        }
      `}</style>
      {/* Back button */}
      <div className="w-full max-w-5xl flex justify-start" >
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
          <span className="reveal" style={{ animationDelay: "0.1s" }}>
            Back
          </span>
        </Link>
      </div>

      {/* Header */}
      <div className="text-center mt-6 mb-6 sm:mt-10 sm:mb-10 max-w-md">
        <h1 className="reveal text-2xl sm:text-3xl font-extrabold tracking-tight text-balance bg-clip-text text-transparent bg-gradient-to-r from-neutral-100 to-neutral-400"  style={{ animationDelay: "0.1s" }}>
          Songs that remind me of you
        </h1>
      </div>

      {/* Grid: 2 columns on phones, 4 on large screens */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 max-w-5xl w-full sm:px-2">
        {TRACKS.map((track) => {
          const isCurrent = activeTrackId === track.id;

          return (
            <button
              key={track.id}
              onClick={() => handleTrackClick(track)}
              aria-label={`${isCurrent ? 'Pause' : 'Play'} ${track.title} by ${track.artist}`}
              aria-pressed={isCurrent}
              className="reveal relative aspect-square w-full rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 sm:hover:scale-[1.03] active:scale-[0.98] group border border-neutral-900 text-left"
               style={{ animationDelay: "0.1s" }}
            >
              {/* Cover image (or gradient fallback) */}
              {track.coverUrl ? (
                <img
                  src={track.coverUrl}
                  alt=""
                  loading="lazy"
                  draggable={false}
                  className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out select-none ${
                    isCurrent ? 'scale-110' : 'sm:group-hover:scale-105'
                  }`}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-neutral-500 to-neutral-800" />
              )}

              {/* Dark tint overlay */}
              <div className={`absolute inset-0 transition-opacity duration-500 bg-gradient-to-t from-black via-black/40 to-black/20 ${
                isCurrent ? 'opacity-90 backdrop-blur-[2px]' : 'opacity-60 sm:group-hover:opacity-75'
              }`} />

              {/* Content */}
              <div className="absolute inset-0 p-3 sm:p-5 flex flex-col items-center justify-between z-10">
                <div /> {/* Spacer */}

                {/* Play / pause control.
                    Always visible on phones (there's no hover on touch screens),
                    fades in on hover for larger screens. */}
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 transform ${
                  isCurrent
                    ? 'bg-emerald-500 text-black scale-110 shadow-lg shadow-emerald-500/30'
                    : 'bg-white/25 text-white backdrop-blur-md sm:bg-white/10 sm:opacity-0 sm:group-hover:opacity-100 sm:group-hover:scale-105 sm:group-hover:bg-white sm:group-hover:text-black'
                }`}>
                  {isCurrent ? (
                    <Pause size={22} fill="currentColor" />
                  ) : (
                    <Play size={22} className="ml-0.5" fill="currentColor" />
                  )}
                </div>

                {/* Song info */}
                <div className="w-full text-left">
                  <h3 className={`text-sm sm:text-base font-semibold truncate ${isCurrent ? 'text-emerald-400' : 'text-neutral-100'}`}>
                    {track.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-neutral-300 truncate mt-0.5">
                    {track.artist}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}