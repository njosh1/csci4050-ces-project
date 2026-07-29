"use client";

import Link from "next/link";
import { useState } from "react";

type Movie = {
  _id: string;
  title: string;
  genre: string[];
  rating: string;
  posterUrl: string;
  status: string;
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    setLoading(true);
    setSearched(true);

    const response = await fetch(
      `http://localhost:5001/api/movies/search?q=${encodeURIComponent(query)}`
    );

    const data = await response.json();

    setMovies(data);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#090d16] p-8 text-white">
      <section className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-slate-900/75 p-8 shadow-xl backdrop-blur">
        <Link
          href="/"
          className="mb-6 inline-block text-sky-400 hover:text-sky-300"
        >
          ← Back to Home
        </Link>

        <h1 className="mb-2 text-3xl font-bold">Search Movies</h1>
        <p className="mb-6 text-slate-400">
          Search for movies by title.
        </p>

        <div className="mb-6 flex gap-2">
          <input
            className="w-full rounded border border-white/10 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
            type="text"
            placeholder="Enter movie title..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />

          <button
            onClick={handleSearch}
            className="rounded bg-sky-600 px-4 py-2 text-white transition hover:bg-sky-500"
          >
            Search
          </button>
        </div>

        {loading && <p className="text-slate-400">Searching...</p>}

        {!loading && searched && movies.length === 0 && (
          <p className="text-slate-400">No movies found.</p>
        )}

        <div className="grid gap-4">
          {movies.map((movie) => (
            <Link
              href={`/movies/${movie._id}`}
              key={movie._id}
              className="flex gap-4 rounded-lg border border-white/10 bg-slate-800/50 p-4 transition hover:border-sky-500/40 hover:bg-slate-800"
            >
              <img
                src={movie.posterUrl}
                alt={movie.title}
                onError={(e) => {
                  e.currentTarget.src =
                    "https://placehold.co/500x750?text=Movie+Poster";
                }}
                className="h-32 w-24 rounded object-cover"
              />

              <div>
                <h2 className="text-xl font-semibold">{movie.title}</h2>
                <p className="text-slate-400">
                  {movie.genre.join(", ")}
                </p>
                <p className="text-sm">{movie.rating}</p>
                <p className="text-sm text-sky-400">
                  {movie.status}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}