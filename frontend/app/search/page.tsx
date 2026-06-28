"use client";

import Link from "next/link";
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
  // filter
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [showDate, setShowDate] = useState("");

  async function handleSearch() {
    setLoading(true);
    setSearched(true);

    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();

    setMovies(data);
    setLoading(false);
  }

  const filteredMovies = 
  selectedGenre === "All"
        ? movies
        : movies.filter(movie => movie.genre === selectedGenre);

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
        {/* inserting the filter UI*/}
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block font-semibold text-black">
              Filter by Genre
            </label>
            <select
            className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-black"
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            >
              <option value="All">All</option>
              <option value="Action">Action</option>
              <option value="Sci-Fi">Sci-Fi</option>
              <option value="Adventure">Adventure</option>

              { /* extra filter options we can implement later when we have more movies
              <option value="Comedy">Comedy</option>
              <option value="Drama">Drama</option>
              <option value="Horror">Horror</option>
              <option value="International">International</option>*/}
            </select>
          </div>
          <div>
            <label className="mb-1 block font-semibold text-black">
              Filter by Show Date
            </label>
            <input 
            className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-black"
            type="date"
            value={showDate}
            onChange={(e) => setShowDate(e.target.value)}
            />
          </div>
        </div>
        
        
        {loading && <p className="text-black">Searching...</p>}

        {!loading && searched && filteredMovies.length === 0 && (
          <p className="text-black">No movies found.</p>
        )}

        <div className="grid gap-4">
          {filteredMovies.map((movie) => (
            /*<div key={movie.id} className="rounded border border-gray-300 p-4">*/
              <Link
              key={movie.id}
              href={`/booking?movie=${encodeURIComponent(movie.title)}&showtime=${encodeURIComponent("7:00pm")}`}
              >
                <div className="rounded border border-gray-300 p-4 hover:bg-gray-100">
              <h2 className="text-xl font-semibold text-black">{movie.title}</h2>
              <p className="text-gray-600">{movie.genre}</p>
            </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}