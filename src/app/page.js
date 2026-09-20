import Link from "next/link"

const images = [
  { src: "/143.jpeg", alt: "Anniversary Image 1" },
  {src: "/us.jpeg", alt: "Anniversary Image 2" },
      {src: "/h.jpeg", alt: "Anniversary Image 6" },
  { src: "/love2.jpeg", alt: "Anniversary Image 3" },
  { src: "/love4.jpeg", alt: "Anniversary Image 4" },
    {src: "/mylove.jpeg", alt: "Anniversary Image 2" },

]

const links = [
  { href: "/songs", label: "Songs about you" },
  { href: "/47", label: "47 things i love about you" },
  { href: "/movie", label: "Our movie list" },
  { href: "/photos", label: "My favorite photos of u" },
  { href: "/letters", label: "The letters" },
]

export default function Home() {
  return (
    <main className="min-h-dvh bg-linear-to-b from-[#d3809c] to-[#dba38d] text-white px-4 py-8 sm:px-8 sm:py-12">
      {/* Opening animation: everything fades up one after another */}
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

      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 sm:gap-8">
        <h1
          className="reveal text-balance text-center font-mono text-2xl font-bold leading-snug text-[#9a2d30] sm:text-3xl lg:text-4xl"
          style={{ animationDelay: "0.1s" }}
        >
          Happy 1 month anniversary, my sweet love!
        </h1>

        {/* Four picture section */}
        <div className="grid w-full max-w-lg lg:grid-cols-3 grid-cols-2 gap-3 sm:max-w-xl sm:gap-4 lg:max-w-4xl lg:gap-6">
          {images.map((img, i) => (
            <img
              key={img.src}
              src={img.src}
              alt={img.alt}
              className="reveal w-full rounded-lg object-cover shadow-lg h-32 sm:h-40 lg:h-48"
              style={{ animationDelay: `${0.5 + i * 0.15}s` }}
            />
          ))}
        </div>

        {/* Buttons */}
        <nav className="grid w-full max-w-md grid-cols-1 gap-3 sm:max-w-xl sm:grid-cols-2 lg:max-w-3xl lg:grid-cols-3 lg:gap-4">
          {links.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              className="reveal text-sm flex min-h-12 items-center justify-center rounded-2xl bg-gray-500 px-4 py-3 text-center font-bold text-white transition-colors hover:bg-gray-700 active:bg-gray-700 lg:text-xl"
              style={{ animationDelay: `${1.2 + i * 0.12}s` }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </main>
  )
}