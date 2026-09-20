'use client';

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const data = [
  { id: 0, text: "Your eyes" },
  { id: 1, text: "The way you make me feel appriciated and loved everyday" },
  { id: 2, text: "The way you laugh at my unfunny jokes" },
  { id: 3, text: "The way you tease me" },
  { id: 4, text: "The way you can be comedic and mature at the same time" },
  { id: 5, text: "Your music taste" },
  { id: 6, text: "Your view of the world" },
  { id: 7, text: "The way your face lits up when you see me" },
  { id: 8, text: "The simple and little things you do for me everyday" },
  { id: 9, text: "Your amazing art skills and drawing of me" },
  { id: 10, text: "The way you ask me for my opinion " },
  { id: 11, text: "The poetic things you say to me" },
  { id: 12, text: "Your poetic writings" },
  { id: 13, text: "The poets you write for me" },
  { id: 14, text: "Your warm and cozy nature" },
  { id: 15, text: "The way u light up your cigarette " },
  { id: 16, text: "The way your face lits up when you see me" },
  { id: 17, text: "The simple and little things you do for me everyday" },
  { id: 18, text: "Your eyes" },
  { id: 19, text: "The way you make me feel appriciated and loved everyday" },
  { id: 20, text: "The way you laugh at my unfunny jokes" },
  { id: 21, text: "The way you tease me" },
  { id: 22, text: "The way you can be comedic and mature at the same time" },
  { id: 23, text: "Your music taste" },
  { id: 24, text: "Your view of the world" },
  { id: 25, text: "The way your face lits up when you see me" },
  { id: 26, text: "Your beautiful face" },
  { id: 27, text: "The cute way you talk to toddlers and dogs and cats" },
  { id: 28, text: "Your fashion sense and personal style" },
  { id: 29, text: "The way i only want you even if things are rough between us" },
  { id: 30, text: "How you make me feel calm when i get anxious" },
  { id: 31, text: "Your movie taste" },
  { id: 32, text: "The way you blossom with each day and time that passes by" },
  { id: 33, text: "Your kind and angelic soul" },
  { id: 34, text: "When u reccomend me alot of cool music " },
  { id: 35, text: "Your hair's beautiful smell when i hug me" },
  { id: 36, text: "Your soft lips and the way they feel when i kiss them" },
  { id: 37, text: "The way you keep buying my favorite ciggarettes when im not even there" },
  { id: 38, text: "Your romantic acts and gestures" },
  { id: 39, text: "The way you reassure me all the time" },
  { id: 40, text: "The way you compliment me on everything" },
  { id: 41, text: "The way that i can talk about anything with you and you will try and understand me" },
  { id: 42, text: "The way you make me feel like the most special person in the world" },
  { id: 43, text: "The way you want me to be okay first even though you arent" },
  { id: 44, text: "The way you text me right when u get up in the morning everyday" },
  { id: 45, text: "The way you let me know what youre doing all the time" },
  { id: 46, text: "The way you make me feel loved even when i dont love myself. " },
];

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const nextItem = () =>
    setCurrentIndex((prev) => Math.min(prev + 1, data.length - 1));

  const prevItem = () => setCurrentIndex((prev) => Math.max(prev - 1, 0));

  // Keyboard arrows (helpful on desktop / tablets with keyboards)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") nextItem();
      if (e.key === "ArrowLeft") prevItem();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Swipe left / right on touch screens
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    // Only count mostly-horizontal swipes so vertical scrolling still works
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) nextItem();
      else prevItem();
    }
  };

  const progress = ((currentIndex + 1) / data.length) * 100;

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-[#d3809c] to-[#dba38d] text-white px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-12 flex flex-col items-center font-sans select-none">
      <div className="w-full max-w-xl flex flex-col items-center gap-5 sm:gap-6">
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
        <div className="w-full flex justify-start">
          <Link
            href="/"
            aria-label="Go back"
            className="inline-flex items-center gap-1.5 min-h-11 pl-3 pr-4 bg-white/20 hover:bg-white/30 active:scale-[0.97] border border-white/30 rounded-full text-[#6b181a] text-sm font-semibold backdrop-blur-md transition-all"
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

        {/* Header Title */}
        <div className="text-center space-y-2">
          <h1 className="reveal text-balance font-serif text-2xl font-extrabold tracking-tight leading-tight text-[#6b181a] sm:text-4xl" style={{ animationDelay: "0.1s" }}>
            47 Things I Love About You
          </h1>
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold tracking-widest text-[#9a2d30]/80 uppercase">
            <span className="reveal" style={{ animationDelay: "0.1s" }}>
              Item {currentIndex + 1} of {data.length}
            </span>
            <span className="w-1 h-1 rounded-full bg-[#9a2d30]/60"></span>
            <span className="animate-pulse">❤️</span>
          </div>
        </div>

        {/* Carousel Viewer */}
        <div
          className="relative reveal w-full h-[18rem] sm:h-72 overflow-hidden bg-white/25 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl"
          style={{ touchAction: "pan-y" }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Slider Track */}
          <div
            className="flex transition-transform duration-500 ease-out h-full w-full"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {data.map((item) => (
              <div
                key={item.id}
                className="w-full h-full flex-shrink-0 flex flex-col items-center justify-center text-center px-6 pt-6 pb-10 sm:px-12 overflow-y-auto"
              >
                <span className="text-4xl sm:text-5xl font-serif text-white/30 leading-none h-5 sm:h-6 block pointer-events-none">“</span>
                <h2 className="text-xl sm:text-3xl font-serif font-bold text-neutral-900 tracking-tight leading-snug sm:leading-relaxed max-w-md drop-shadow-sm break-words">
                  {item.text}
                </h2>
                <span className="text-4xl sm:text-5xl font-serif text-white/30 leading-none h-5 sm:h-6 block pointer-events-none translate-y-2">”</span>
              </div>
            ))}
          </div>

          {/* Progress bar (replaces 47 tiny dots that overflowed on phones) */}
          <div className="absolute bottom-4 left-6 right-6 h-1.5 rounded-full bg-white/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-white transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex gap-3 sm:gap-4 w-full">
          <button
            onClick={prevItem}
            disabled={currentIndex === 0}
            className="reveal flex-1 flex items-center justify-center gap-2 min-h-14 py-3.5 px-4 sm:px-6 bg-white/10 hover:bg-white/20 disabled:opacity-20 text-white font-semibold border border-white/10 rounded-2xl transition-all shadow-md active:scale-[0.97] group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 transition-transform group-hover:-translate-x-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <span className="reveal" style={{ animationDelay: "0.1s" }}>
              Previous
            </span>
          </button>

          <button 

            onClick={nextItem}
            disabled={currentIndex === data.length - 1}
            className=" reveal flex-1 flex items-center justify-center gap-2 min-h-14 py-3.5 px-4 sm:px-6 bg-neutral-900/90 hover:bg-neutral-900 disabled:opacity-20 disabled:hover:bg-neutral-900/90 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-neutral-950/10 active:scale-[0.97] group"
          >
            <span className="reveal" style={{ animationDelay: "0.1s" }}>
              Next
            </span>
            <svg  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 transition-transform group-hover:translate-x-0.5">
              <path  strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Closing note */} 
        <p className="text-center text-base sm:text-lg font-serif font-bold leading-relaxed text-[#6b181a] select-text px-1">
          This is only the best 47 things and there is obviously more and i want you to know that i love you with all my heart and soul and i will always love you and i will always be here for you and i will always support you and i will always be your best friend and your lover and your partner in crime and your soulmate and your everything. I love you so much my sweet love.
        </p>
      </div>
    </main>
  );
}