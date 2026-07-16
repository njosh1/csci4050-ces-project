"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthUser, clearAuth, getStoredUser } from "@/lib/auth";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type Showtime = {
  time: string;
  date: string;
};

// Matches the Mongoose schema in backend/models/movieModel.js.
// Key differences from Amit's MySQL version:
//   - _id (string ObjectId) instead of id (integer)
//   - posterUrl / trailerUrl in camelCase instead of poster_url / trailer_url
//   - genre is string[] (array) because MongoDB stores multiple genres per movie
//   - status values are "Currently Running" / "Coming Soon" (not snake_case)
type Movie = {
  _id: string;
  title: string;
  description: string;
  genre: string[];
  rating: string;
  status: "Currently Running" | "Coming Soon";
  posterUrl: string;
  trailerUrl: string;
  showtimes: Showtime[];
};

// --------------------------------------------------------------------------
// Constants
// --------------------------------------------------------------------------

// Express backend — defined in backend/server.js, default port 5000
const API_URL = "http://localhost:5001";

// Color classes for the genre badge; falls back to neutral if genre is unknown
const GENRE_COLORS: Record<string, string> = {
  "Sci-Fi":    "bg-blue-900/60 text-blue-300 border-blue-700/40",
  "Action":    "bg-red-900/60 text-red-300 border-red-700/40",
  "Adventure": "bg-amber-900/60 text-amber-300 border-amber-700/40",
  "Drama":     "bg-purple-900/60 text-purple-300 border-purple-700/40",
  "Horror":    "bg-zinc-900/60 text-zinc-300 border-zinc-700/40",
  "Animation": "bg-green-900/60 text-green-300 border-green-700/40",
  "Thriller":  "bg-orange-900/60 text-orange-300 border-orange-700/40",
};
const DEFAULT_GENRE_COLOR = "bg-zinc-800/60 text-zinc-300 border-zinc-700/40";

// Fallback gradients for movies with no poster — index by first char of title
// so the same movie always gets the same colour
const POSTER_GRADIENTS = [
  "from-blue-800 to-indigo-900",
  "from-red-800 to-rose-900",
  "from-amber-700 to-orange-900",
  "from-purple-800 to-violet-900",
  "from-teal-700 to-cyan-900",
  "from-emerald-700 to-green-900",
];

// --------------------------------------------------------------------------
// MovieCard
// --------------------------------------------------------------------------

function MovieCard({ movie }: { movie: Movie }) {
  const isComingSoon = movie.status === "Coming Soon";

  // Use the first genre for the badge colour (genre is an array in MongoDB)
  const primaryGenre = movie.genre[0] ?? "";
  const genreColor = GENRE_COLORS[primaryGenre] ?? DEFAULT_GENRE_COLOR;

  const gradient =
    POSTER_GRADIENTS[movie.title.charCodeAt(0) % POSTER_GRADIENTS.length];

  return (
    // Clicking the card goes to the Movie Details page (/movies/[id])
    <Link
      href={`/movies/${movie._id}`}
      className="group relative flex flex-col rounded-xl overflow-hidden border border-white/5 bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-white/10"
    >
      {/* Poster image — falls back to a gradient tile if the URL is missing */}
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            onError={(e) => {
              // If the remote image fails to load, swap in a placeholder
              e.currentTarget.src =
                "https://placehold.co/500x750?text=Movie+Poster";
            }}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-3 p-4`}
          >
            <span className="text-white/80 font-bold text-center text-sm leading-tight">
              {movie.title}
            </span>
            {isComingSoon && (
              <span className="mt-2 px-3 py-1 rounded-full bg-white/10 text-white/60 text-xs font-semibold tracking-widest uppercase">
                Coming Soon
              </span>
            )}
          </div>
        )}

        {/* MPAA rating badge — top-right corner */}
        <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white text-xs font-bold border border-white/10">
          {movie.rating}
        </span>
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div>
          <h3 className="font-bold text-white text-base leading-tight mb-1 line-clamp-2">
            {movie.title}
          </h3>
          {/* Join all genres — MongoDB stores them as an array */}
          <span
            className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${genreColor}`}
          >
            {movie.genre.join(", ")}
          </span>
        </div>

        <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
          {movie.description}
        </p>

        {/* Showtimes — pulled from MongoDB; Coming Soon movies have an empty array */}
        <div className="mt-auto pt-2 border-t border-white/5">
          {isComingSoon || movie.showtimes.length === 0 ? (
            <p className="text-slate-500 text-xs text-center italic">
              Showtimes not yet available
            </p>
          ) : (
            <>
              <p className="text-slate-500 text-xs mb-2 uppercase tracking-wider font-semibold">
                Showtimes
              </p>
              <div className="flex flex-wrap gap-1.5">
                {movie.showtimes.map((showtime, i) => (
                  // Each showtime links to /booking with movie title + time as query params
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold"
                  >
                    {showtime.time}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

// --------------------------------------------------------------------------
// SectionHeader
// --------------------------------------------------------------------------

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

// --------------------------------------------------------------------------
// Home Page
// --------------------------------------------------------------------------

export default function HomePage() {
  const router = useRouter();

  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [genre, setGenre] = useState("All");
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  function handleLogout() {
    clearAuth();
    setUser(null);
    router.push("/");
  }

  useEffect(() => {
    async function fetchMovies() {
      setLoading(true);
      setError(null);
      try {
        // When a genre is selected, use the filter endpoint on the Express backend.
        // GET /api/movies/filter?genre=<genre> is defined in backend/server.js.
        // Otherwise fetch all movies with GET /api/movies.
        const url =
          genre === "All"
            ? `${API_URL}/api/movies`
            : `${API_URL}/api/movies/filter?genre=${encodeURIComponent(genre)}`;

        const res = await fetch(url);
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
  }, [genre]); // Re-fetch whenever the selected genre changes

  // Split movies into their two display sections.
  // Status values match the enum in backend/models/movieModel.js.
  const currentlyRunning = movies.filter((m) => m.status === "Currently Running");
  const comingSoon = movies.filter((m) => m.status === "Coming Soon");

  return (
    <div
      className="min-h-screen"
      style={{ background: "radial-gradient(circle at top, #0f1e36 0%, #030712 75%)" }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Navbar                                                               */}
      {/* ------------------------------------------------------------------ */}
      <nav className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-md bg-black/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-extrabold text-white tracking-tight">
            CineBook
          </span>
<div className="flex items-center gap-6 text-sm font-medium text-slate-400">
  <Link href="/" className="text-white">
    Home
  </Link>

  <Link href="/search" className="hover:text-white transition-colors">
    Search
  </Link>

  {user ? (
    <>
      {user.role === "Admin" && (
        <Link
          href="/admin"
          className="hover:text-white transition-colors"
        >
          Admin Portal
        </Link>
      )}

      <Link href="/profile" className="hover:text-white transition-colors">
        My Profile
      </Link>

      <span className="text-slate-500">
        Hi, {user.firstName}
      </span>

      <button
        type="button"
        onClick={handleLogout}
        className="rounded-lg border border-white/10 px-4 py-2 font-semibold text-white transition hover:bg-white/10"
      >
        Log Out
      </button>
    </>
  ) : (
    <>
      <Link href="/login" className="hover:text-white transition-colors">
        Log In
      </Link>

      <Link
        href="/register"
        className="rounded-lg bg-sky-500 px-4 py-2 font-semibold text-white transition hover:bg-sky-400"
      >
        Sign Up
      </Link>
    </>
  )}
</div>
        </div>
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* Hero                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <header className="max-w-7xl mx-auto px-6 pt-16 pb-10 text-center">
        <p className="inline-block text-xs font-bold tracking-widest text-sky-400 uppercase border border-sky-500/20 bg-sky-500/10 px-4 py-1.5 rounded-full mb-4">
          Now Showing & Coming Soon
        </p>
        <h1 className="text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
          Your Cinema,
          <br />
          <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
            One Click Away
          </span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Browse current films and upcoming releases. Select a showtime to book
          your seats instantly.
        </p>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Filters (requirement 2.4)                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="max-w-7xl mx-auto px-6 pb-8 flex flex-wrap items-center gap-4">
        {/* Genre filter — triggers a new fetch via the /api/movies/filter endpoint */}
        <div className="flex items-center gap-2">
          <label className="text-slate-400 text-sm font-medium">Genre:</label>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="rounded-lg border border-white/10 bg-slate-800 text-white text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          >
            <option>All</option>
            <option>Action</option>
            <option>Adventure</option>
            <option>Animation</option>
            <option>Comedy</option>
            <option>Drama</option>
            <option>Family</option>
            <option>Sci-Fi</option>
            <option>Thriller</option>
          </select>
        </div>

        {/* Show date filter — UI only for this sprint, not yet wired to the backend */}
        <div className="flex items-center gap-2">
          <label className="text-slate-400 text-sm font-medium">Show Date:</label>
          <input
            type="date"
            className="rounded-lg border border-white/10 bg-slate-800 text-white text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Main content                                                         */}
      {/* ------------------------------------------------------------------ */}
      <main className="max-w-7xl mx-auto px-6 pb-20">
        {/* Loading spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-sky-500/20 border-t-sky-400 animate-spin" />
            <p className="text-slate-400 text-sm">Loading movies...</p>
          </div>
        )}

        {/* Error state — shown when the fetch fails (e.g. backend not running) */}
        {error && (
          <div className="max-w-lg mx-auto mt-16 p-6 rounded-xl bg-red-900/20 border border-red-500/20 text-center">
            <p className="text-red-400 font-semibold mb-1">Could not load movies</p>
            <p className="text-slate-400 text-sm">{error}</p>
            <p className="text-slate-500 text-xs mt-3">
              Make sure the backend is running on port 5000 and MongoDB Atlas is
              connected.
            </p>
          </div>
        )}

        {/* Empty state — shown when a genre filter returns no results */}
        {!loading && !error && movies.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-16">
            No movies match this filter.
          </p>
        )}

        {/* Movie grid — only rendered once data is loaded with no errors */}
        {!loading && !error && movies.length > 0 && (
          <>
            <section className="mb-16">
              <SectionHeader
                title="Currently Running"
                count={currentlyRunning.length}
              />
              {currentlyRunning.length === 0 ? (
                <p className="text-slate-500 text-sm">
                  No movies currently running.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {currentlyRunning.map((movie) => (
                    // movie._id is MongoDB's ObjectId — used as the React key
                    // and passed to the /movies/[id] route in MovieCard
                    <MovieCard key={movie._id} movie={movie} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <SectionHeader title="Coming Soon" count={comingSoon.length} />
              {comingSoon.length === 0 ? (
                <p className="text-slate-500 text-sm">No upcoming movies.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {comingSoon.map((movie) => (
                    <MovieCard key={movie._id} movie={movie} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* Footer                                                               */}
      {/* ------------------------------------------------------------------ */}
      <footer className="border-t border-white/5 py-8 text-center text-slate-600 text-sm">
        © {new Date().getFullYear()} CineBook — Cinema E-Booking System
      </footer>
    </div>
  );
}
