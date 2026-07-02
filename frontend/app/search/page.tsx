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
      `http://localhost:5050/api/movies/search?q=${encodeURIComponent(query)}`
    );

    const data = await response.json();

    setMovies(data);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-black">
      <section className="mx-auto max-w-4xl rounded-lg bg-white p-8 shadow">
        <Link href="/" className="mb-6 inline-block text-blue-600">
          ← Back to Home
        </Link>

        <h1 className="mb-2 text-3xl font-bold">Search Movies</h1>
        <p className="mb-6 text-gray-600">Search for movies by title.</p>

        <div className="mb-6 flex gap-2">
          <input
            className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-black"
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

        {loading && <p>Searching...</p>}

        {!loading && searched && movies.length === 0 && (
          <p>No movies found.</p>
        )}

        <div className="grid gap-4">
          {movies.map((movie) => (
            <Link
              href={`/movies/${movie._id}`}
              key={movie._id}
              className="flex gap-4 rounded border border-gray-300 p-4 hover:bg-gray-50"
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
                <p className="text-gray-600">{movie.genre.join(", ")}</p>
                <p className="text-sm">{movie.rating}</p>
                <p className="text-sm text-blue-600">{movie.status}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}