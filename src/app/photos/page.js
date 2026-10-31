'use client';

import Link from "next/link";
import { useState } from "react";

const data = [
    {
        id: 0,
        src: "/pic.jpg",
    },
    {
        id: 1,
        src: "/pic2.jpg"
    },
    {
        id: 2,
        src: "/pic3.jpg"
    },
        {
        id: 3,
        src: "/pic4.jpg"
    },
        {
        id: 4,
        src: "/pic5.JPG"
    },
        {
        id: 5,
        src: "/pic6.JPG"
    }
];

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextItem = () => {
    if (currentIndex < data.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const prevItem = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#d3809c] to-[#dba38d] text-white px-4 py-12 sm:px-8 flex flex-col justify-center items-center font-sans select-none">
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
       <div className="w-full flex justify-start">
                <Link
                  href="/"
                  aria-label="Go back"
                  className="inline-flex items-center gap-1.5 min-h-11 pl-3 pr-4 bg-white/20 hover:bg-white/30 active:scale-[0.97] border border-white/30 rounded-full text-black text-sm font-semibold backdrop-blur-md transition-all"
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
      <div className="w-full max-w-xl flex flex-col items-center gap-6">
        
        {/* Header Title */}
        <div className="text-center space-y-2">
          
          <h1 className="reveal text-balance font-serif text-3xl font-extrabold tracking-tight leading-tight text-[#6b181a] sm:text-4xl" style={{ animationDelay: "0.1s" }}>
            My Favorite Photos of You
          </h1>
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold tracking-widest text-[#9a2d30]/80 uppercase">
            <span>Item {currentIndex + 1} of {data.length}</span>
            <span className="w-1 h-1 rounded-full bg-[#9a2d30]/60"></span>
            <span className="animate-pulse">❤️</span>
          </div>
        </div>

        {/* Premium Glassmorphic Carousel Viewer */}
        <div className="reveal relative w-full lg:h-[35rem] h-72 overflow-hidden bg-white/25 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl flex items-center justify-center p-6 sm:p-10 transition-all duration-300 hover:shadow-white/5">
          
          {/* Main Slider Display Track */}
          <div 
            className="flex  transition-transform duration-500 ease-out h-full w-full"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {data.map((item) => (
              <div 
                key={item.id} 
                className="w-full h-full flex-shrink-0 flex flex-col items-center justify-center text-center px-4"
              >
                {/* Floating Quotes Graphic decoration */}
                <span className="text-5xl font-serif text-white/20 leading-none h-6 block pointer-events-none select-none">“</span>
                <img src={item.src} className="w-full h-full object-cover rounded-xl" />
                <span className="text-5xl font-serif text-white/20 leading-none h-6 block pointer-events-none select-none translate-y-2">”</span>
              </div>
            ))}
          </div>

          {/* Dots Indicator Array */}
          <div className="absolute bottom-4 flex gap-1.5 justify-center items-center">
            {data.map((item, idx) => (
              <span 
                key={item.id} 
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`}
              />
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex gap-4 w-full">
          {/* Previous Button */}
          <button
            onClick={prevItem}
            disabled={currentIndex === 0}
            className="reveal flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-white/10 hover:bg-white/20 disabled:opacity-20 text-white font-semibold border border-white/10 rounded-2xl transition-all shadow-md active:scale-[0.97] group"
          >
            <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 transition-transform group-hover:-translate-x-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <span>Previous</span>
          </button>

          {/* Next Button */}
          <button
            onClick={nextItem}
            disabled={currentIndex === data.length - 1}
            className="reveal flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-neutral-900/90 hover:bg-neutral-900 disabled:opacity-20 disabled:hover:bg-neutral-900/90 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-neutral-950/10 active:scale-[0.97] group"
          >
            <span >Next</span>
            <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 transition-transform group-hover:translate-x-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

      </div>
    </main>
  );
}
