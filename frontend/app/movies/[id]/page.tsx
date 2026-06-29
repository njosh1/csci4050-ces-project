"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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

const API_URL = "http://localhost:5001";

export default function MovieDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [movie, setMovie] = useState<Movie | null>(null);

  useEffect(() => {
    async function getMovie() {
      const res = await fetch(`${API_URL}/api/movies/${id}`);
      const data = await res.json();
      setMovie(data);
    }

    getMovie();
  }, [id]);

  if (!movie) {
    return <main className="p-8 text-black">Loading...</main>;
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-black">
      <section className="mx-auto max-w-5xl rounded bg-white p-8 shadow">
        <Link href="/" className="mb-6 inline-block text-blue-600">
          ← Back Home
        </Link>

        <div className="grid gap-8 md:grid-cols-[300px_1fr]">
          <img
            src={movie.posterUrl}
            alt={movie.title}
	onError={(e) => {
	    e.currentTarget.src =
	      "https://placehold.co/500x750?text=Movie+Poster";
	  }}
            className="w-full rounded"
          />

          <div>
            <h1 className="text-4xl font-bold">{movie.title}</h1>
            <p className="mt-2 font-semibold">{movie.rating}</p>
            <p className="mt-4">{movie.description}</p>

            <p className="mt-4">
              <strong>Genre:</strong> {movie.genre.join(", ")}
            </p>

            <h2 className="mt-6 text-2xl font-bold">Showtimes</h2>

            {movie.showtimes.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-3">
                {movie.showtimes.map((showtime, index) => (
                  <Link
                    key={index}
                    href={`/booking?movie=${encodeURIComponent(
                      movie.title
                    )}&showtime=${encodeURIComponent(showtime.time)}`}
                    className="rounded bg-black px-4 py-2 text-white"
                  >
                    {showtime.date} at {showtime.time}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-gray-600">
                No showtimes yet. This movie is coming soon.
              </p>
            )}
          </div>
        </div>

        <div className="mt-10">
          <h2 className="mb-4 text-2xl font-bold">Trailer</h2>
          <div className="aspect-video overflow-hidden rounded">
            <iframe
              src={movie.trailerUrl}
              title={movie.title}
              className="h-full w-full"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </section>
    </main>
  );
}
