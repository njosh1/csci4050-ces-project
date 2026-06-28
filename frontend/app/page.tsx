// app/page.tsx  –  CES Home Page
// Fetches movies from /api/movies and displays them under
// "Currently Running" and "Coming Soon" sections.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────
type Movie = {
  id: number;
  title: string;
  genre: string;
  rating: string;
  description: string;
  poster_url: string | null;
  trailer_url: string | null;
  status: "currently_running" | "coming_soon";
};

// ── Hardcoded showtimes (Sprint 1 requirement) ─────────────────
const SHOWTIMES = ["2:00 PM", "5:00 PM", "8:00 PM"];

// ── Genre colours for the badge ───────────────────────────────
const GENRE_COLORS: Record<string, string> = {
  "Sci-Fi":    "bg-blue-900/60 text-blue-300 border-blue-700/40",
  "Action":    "bg-red-900/60 text-red-300 border-red-700/40",
  "Adventure": "bg-amber-900/60 text-amber-300 border-amber-700/40",
  "Drama":     "bg-purple-900/60 text-purple-300 border-purple-700/40",
  "Horror":    "bg-zinc-900/60 text-zinc-300 border-zinc-700/40",
};
const DEFAULT_GENRE_COLOR = "bg-zinc-800/60 text-zinc-300 border-zinc-700/40";

// ── Movie Card ─────────────────────────────────────────────────
function MovieCard({ movie, isComingSoon }: { movie: Movie; isComingSoon: boolean }) {
  const genreColor = GENRE_COLORS[movie.genre] ?? DEFAULT_GENRE_COLOR;

  // Poster placeholder gradient (uses movie id for variety)
  const gradients = [
    "from-blue-800 to-indigo-900",
    "from-red-800 to-rose-900",
    "from-amber-700 to-orange-900",
    "from-purple-800 to-violet-900",
    "from-teal-700 to-cyan-900",
    "from-emerald-700 to-green-900",
  ];
  const gradient = gradients[movie.id % gradients.length];

  return (
    <div className="group relative flex flex-col rounded-xl overflow-hidden border border-white/5 bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-white/10">

      {/* Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        {movie.poster_url ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-3 p-4`}>
            <span className="text-4xl">🎬</span>
            <span className="text-white/80 font-bold text-center text-sm leading-tight">{movie.title}</span>
            {isComingSoon && (
              <span className="mt-2 px-3 py-1 rounded-full bg-white/10 text-white/60 text-xs font-semibold tracking-widest uppercase">
                Coming Soon
              </span>
            )}
          </div>
        )}

        {/* Rating badge */}
        <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white text-xs font-bold border border-white/10">
          {movie.rating}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div>
          <h3 className="font-bold text-white text-base leading-tight mb-1 line-clamp-2">{movie.title}</h3>
          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${genreColor}`}>
            {movie.genre}
          </span>
        </div>

        <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">{movie.description}</p>

        {/* Showtimes / Coming Soon */}
        {isComingSoon ? (
          <div className="mt-auto pt-2 border-t border-white/5">
            <p className="text-slate-500 text-xs text-center italic">Showtimes not yet available</p>
          </div>
        ) : (
          <div className="mt-auto pt-2 border-t border-white/5">
            <p className="text-slate-500 text-xs mb-2 uppercase tracking-wider font-semibold">Showtimes</p>
            <div className="flex flex-wrap gap-1.5">
              {SHOWTIMES.map((time) => (
                <Link
                  key={time}
                  href={`/booking?movie=${encodeURIComponent(movie.title)}&showtime=${encodeURIComponent(time)}`}
                  className="px-2.5 py-1 rounded-md bg-sky-500/10 hover:bg-sky-500/25 border border-sky-500/20 text-sky-400 text-xs font-semibold transition-colors"
                >
                  {time}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section Header ─────────────────────────────────────────────
function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
      <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-400 text-sm font-medium">
        {count} {count === 1 ? "movie" : "movies"}
      </span>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
}

// ── Home Page ──────────────────────────────────────────────────
export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMovies() {
      try {
        const res = await fetch("/api/movies");
        if (!res.ok) throw new Error("Failed to load movies.");
        const data: Movie[] = await res.json();
        setMovies(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error.");
      } finally {
        setLoading(false);
      }
    }
    fetchMovies();
  }, []);

  const running  = movies.filter((m) => m.status === "currently_running");
  const comingSoon = movies.filter((m) => m.status === "coming_soon");

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(circle at top, #0f1e36 0%, #030712 75%)" }}>

      {/* ── Navbar ─────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-md bg-black/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎬</span>
            <span className="text-xl font-extrabold text-white tracking-tight">CineBook</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-400">
            <Link href="/" className="text-white">Home</Link>
            <Link href="/search" className="hover:text-white transition-colors">Search</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────── */}
      <header className="max-w-7xl mx-auto px-6 pt-16 pb-12 text-center">
        <p className="inline-block text-xs font-bold tracking-widest text-sky-400 uppercase border border-sky-500/20 bg-sky-500/10 px-4 py-1.5 rounded-full mb-4">
          🎟 Now Showing & Coming Soon
        </p>
        <h1 className="text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
          Your Cinema,<br />
          <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
            One Click Away
          </span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Browse current films and upcoming releases. Select a showtime to book your seats instantly.
        </p>
      </header>

      {/* ── Content ────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 pb-20">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-sky-500/20 border-t-sky-400 animate-spin" />
            <p className="text-slate-400 text-sm">Loading movies from database…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="max-w-lg mx-auto mt-16 p-6 rounded-xl bg-red-900/20 border border-red-500/20 text-center">
            <p className="text-red-400 font-semibold mb-1">Could not load movies</p>
            <p className="text-slate-400 text-sm">{error}</p>
            <p className="text-slate-500 text-xs mt-3">Make sure your MySQL database is running and credentials in <code>.env.local</code> are correct.</p>
          </div>
        )}

        {/* Movies */}
        {!loading && !error && (
          <>
            {/* Currently Running */}
            <section className="mb-16">
              <SectionHeader title="Currently Running" count={running.length} />
              {running.length === 0 ? (
                <p className="text-slate-500 text-sm">No movies currently running.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {running.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} isComingSoon={false} />
                  ))}
                </div>
              )}
            </section>

            {/* Coming Soon */}
            <section>
              <SectionHeader title="Coming Soon" count={comingSoon.length} />
              {comingSoon.length === 0 ? (
                <p className="text-slate-500 text-sm">No upcoming movies.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {comingSoon.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} isComingSoon={true} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 text-center text-slate-600 text-sm">
        © {new Date().getFullYear()} CineBook — Cinema E-Booking System
      </footer>
    </div>
  );
}
