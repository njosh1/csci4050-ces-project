"use client";

import Link from "next/link";
import { useState } from "react";

type Movie = {
  _id: string;
  title: string;
  description: string;
  genre: string[];
  rating: string;
  status: string;
  posterUrl: string;
  trailerUrl: string;
};

const API_URL = "http://localhost:5050";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [searched, setSearched] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [showDate, setShowDate] = useState("");

  async function handleSearch() {
    setSearched(true);

    const response = await fetch(
      `${API_URL}/api/movies/search?q=${encodeURIComponent(query.trim())}`
    );

    const data = await response.json();
    setMovies(data);
  }

  const filteredMovies =
  selectedGenre === "All"
    ? movies
    : movies.filter((movie) =>
        movie.genre.includes(selectedGenre)
      );

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-black">
      <section className="mx-auto max-w-4xl rounded bg-white p-8 shadow">
        <Link href="/" className="mb-6 inline-block text-blue-600">
          ← Back Home
        </Link>

        <h1 className="mb-4 text-3xl font-bold">Search Movies</h1>

        <div className="mb-6 flex gap-2">
          <input
            className="w-full rounded border px-3 py-2 text-black"
            type="text"
            placeholder="Search movie title..."
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
        
        {searched && movies.length === 0 && (
          <p className="text-gray-600">No movies found.</p>
        )}

        <div className="grid gap-4">
          {movies.map((movie) => (
            <Link
              key={movie._id}
              href={`/movies/${movie._id}`}
              className="flex gap-4 rounded border p-4 hover:bg-gray-50"
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
                <h2 className="text-xl font-bold">{movie.title}</h2>
                <p className="text-sm text-gray-600">
                  {movie.genre.join(", ")}
                </p>
                <p className="text-sm font-semibold">{movie.rating}</p>
                <p className="text-sm text-blue-600">{movie.status}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
