"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Showtime = {
  time: string;
  date: string;
};

type Movie = {
  _id: string;
  title: string;
  description: string;
  genre: string[];
  rating: string;
  status: string;
  posterUrl: string;
  trailerUrl: string;
  showtimes: Showtime[];
};

const API_URL = "http://localhost:5050";

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genre, setGenre] = useState("All");

  useEffect(() => {
    async function getMovies() {
      const url =
        genre === "All"
          ? `${API_URL}/api/movies`
          : `${API_URL}/api/movies/filter?genre=${encodeURIComponent(genre)}`;

      const res = await fetch(url);
      const data = await res.json();
      setMovies(data);
    }

    getMovies();
  }, [genre]);

  const currentlyRunning = movies.filter(
    (movie) => movie.status === "Currently Running"
  );

  const comingSoon = movies.filter((movie) => movie.status === "Coming Soon");

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-bold">Cinema E-Booking System</h1>

        <div className="my-6 flex gap-4">
          <Link href="/search" className="rounded bg-black px-4 py-2 text-white">
            Search Movies
          </Link>

          <select
            className="rounded border px-4 py-2"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
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

        <MovieSection title="Currently Running" movies={currentlyRunning} />
        <MovieSection title="Coming Soon" movies={comingSoon} />
      </div>
    </main>
  );
}

function MovieSection({ title, movies }: { title: string; movies: Movie[] }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-2xl font-bold">{title}</h2>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {movies.map((movie) => (
          <Link
            href={`/movies/${movie._id}`}
            key={movie._id}
            className="rounded bg-white p-4 shadow"
          >
            <img
              src={movie.posterUrl}
              alt={movie.title}
	      onError={(e) => {
		e.currentTarget.src =
		"https://placehold.co/500x750?text=Movie+Poster";
		}}
              className="mb-4 h-80 w-full rounded object-cover"
            />

            <h3 className="text-xl font-bold">{movie.title}</h3>
            <p className="text-sm text-gray-600">{movie.genre.join(", ")}</p>
            <p className="text-sm font-semibold">{movie.rating}</p>

            {movie.showtimes.length > 0 && (
              <p className="mt-2 text-sm text-blue-600">
                Showtimes: {movie.showtimes.map((s) => s.time).join(", ")}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
