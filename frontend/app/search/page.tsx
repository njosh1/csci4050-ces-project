"use client";

import { useState } from "react";

type Movie = {
  id: number;
  title: string;
  genre: string;
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    setLoading(true);
    setSearched(true);

    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();

    setMovies(data);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <section className="mx-auto max-w-3xl rounded-lg bg-white p-8 shadow">
        <h1 className="mb-2 text-3xl font-bold text-black">Search Movies</h1>
        <p className="mb-6 text-gray-600">Search for movies by title.</p>

        <div className="mb-6 flex gap-2">
          <input
            className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="rounded bg-black px-4 py-2 text-white"
          >
            Search
          </button>
        </div>

        {loading && <p className="text-black">Searching...</p>}

        {!loading && searched && movies.length === 0 && (
          <p className="text-black">No movies found.</p>
        )}

        <div className="grid gap-4">
          {movies.map((movie) => (
            <div key={movie.id} className="rounded border border-gray-300 p-4">
              <h2 className="text-xl font-semibold text-black">{movie.title}</h2>
              <p className="text-gray-600">{movie.genre}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}