'use client';
import { useEffect, useRef, useState } from 'react';

const ANIMATIONS = {
  sitting:    { row: 0, steps: 4 },
  lookUp:     { row: 1, steps: 4 },
  alert:      { row: 2, steps: 4 },
  stretching: { row: 3, steps: 4 },
  sleeping:   { row: 6, steps: 4 }, // The default state
  pouncing:   { row: 7, steps: 6 },
  jumping:    { row: 8, steps: 7 },
  grooming:   { row: 9, steps: 8 },
};
const CAT_PHRASES = [
    "You're doing great, my dear.",
    "I love you so much!",
    "You're the best!",
    "Keep being amazing!",
    "You're my sunshine!",
    "You make me so happy!",
    "Your drawings are so amazing!",
    "You're my everything<3",
    "Minii miniih <3",
    "Ci min mni jargal",
    "Avyaslagshu ci min!",
    "Hun yj iim goy zurdag bna",
    "The prettiest thing ever",
    "You make my day",
    "You can do anything my dear",
    "I believe in you!",
    "I love you more than everything!"
];
export default function CatSprite() {
  const canvasRef = useRef(null);
  const [popups, setPopups] = useState([]); // Array to manage floating dialogue text pieces
  
  const stateRef = useRef({
    current: 'sleeping', 
    next: 'sleeping',
    frameIndex: 0,
    tickCount: 0,
    ticksPerFrame: 10,     
    timeUntilSleep: 0,    
  });

  const handlePet = () => {
    const state = stateRef.current;
    
    // 1. Core behavior logic change
    if (state.current === 'sleeping' || state.next === 'sleeping') {
      const keys = Object.keys(ANIMATIONS).filter(k => k !== 'sleeping');
      state.next = keys[Math.floor(Math.random() * keys.length)];
      state.timeUntilSleep = Math.floor(Math.random() * 3000) + 4000;
    }

    // 2. Generate random floating text node
    const randomText = CAT_PHRASES[Math.floor(Math.random() * CAT_PHRASES.length)];
    const uniqueId = Date.now() + Math.random(); // Unique key for rendering arrays cleanly
    
    // Add a slight horizontal layout random shift so multiple popups spread out neatly
    const randomOffset = Math.floor(Math.random() * 40) - 20; // Shift left or right by up to 20px

    setPopups((prev) => [...prev, { id: uniqueId, text: randomText, offset: randomOffset }]);

    // 3. Destruct/remove text after 1.5 seconds once fade transition completes
    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== uniqueId));
    }, 1500);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = '/Cat Sprite Sheet.png'; 

    const FRAME_SIZE = 32;
    let animationFrameId;
    let lastTime = performance.now();

    const loop = (now) => {
      const delta = now - lastTime;
      lastTime = now;

      const state = stateRef.current;
      const activeAnim = ANIMATIONS[state.current];

      if (state.current !== 'sleeping') {
        state.timeUntilSleep -= delta;
        if (state.timeUntilSleep <= 0) {
          state.next = 'sleeping';
        }
      }

      state.tickCount++;
      if (state.tickCount >= state.ticksPerFrame) {
        state.tickCount = 0;
        state.frameIndex++;

        if (state.frameIndex >= activeAnim.steps) {
          state.frameIndex = 0; 
          if (state.current !== state.next) {
            state.current = state.next;
            state.ticksPerFrame = state.current === 'sleeping' ? 10 : 6;
          }
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const currentActive = ANIMATIONS[state.current];
      ctx.drawImage(
        img,
        state.frameIndex * FRAME_SIZE,        
        currentActive.row * FRAME_SIZE,       
        FRAME_SIZE, FRAME_SIZE,               
        0, 0,                                 
        FRAME_SIZE, FRAME_SIZE                
      );

      animationFrameId = requestAnimationFrame(loop);
    };

    img.onload = () => {
      animationFrameId = requestAnimationFrame(loop);
    };

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="fixed bottom-4 right-10 z-50 flex flex-col items-center">
      {/* Container for Floating Text Elements */}
      <div className="relative w-full h-0 pointer-events-none">
        {popups.map((popup) => (
          <div
            key={popup.id}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/90 text-white text-[11px] font-medium px-2.5 py-1 rounded-lg shadow-md border border-slate-700/50 animate-float-up"
            style={{
              transform: `translateX(calc(-50% + ${popup.offset}px))`,
            }}
          >
            {popup.text}
          </div>
        ))}
      </div>

      {/* Main Interactive Companion Box */}
      <div 
        onClick={handlePet}
        className="cursor-pointer select-none transition-transform duration-200 active:scale-100 group mt-20"
        title="Click to wake up!"
      >
        <div className="w-25 h-25 flex items-center justify-center bg-white/10 backdrop-blur-xs rounded-full border border-white/5 shadow-md group-hover:bg-white/20 group-hover:border-white/20 transition-all duration-300">
          <canvas 
            ref={canvasRef} 
            width={32} 
            height={32} 
            className="w-23 h-23 drop-shadow-sm" 
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      </div>

      {/* Custom Keyframe utility for Tailwind layout targeting smooth floating motion */}
      <style jsx global>{`
        @keyframes floatUp {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.8);
          }
          15% {
            opacity: 1;
            transform: translateY(0px) scale(1);
          }
          85% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(-45px) scale(0.9);
          }
        }
        .animate-float-up {
          animation: floatUp 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}