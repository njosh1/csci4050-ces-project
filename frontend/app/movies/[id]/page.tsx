"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { authHeaders, getToken } from "@/lib/auth";

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

function FavoriteButton({ movieId }: { movieId: string }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const loggedIn = Boolean(getToken());
  // If the person isn't logged in, there's nothing to check — start
  // "checked" immediately so we don't setState from inside the effect.
  const [checked, setChecked] = useState(() => !loggedIn);

  useEffect(() => {
    if (!loggedIn) {
      return;
    }

    async function checkFavorite() {
      try {
        const res = await fetch(`${API_URL}/api/profile/favorites`, {
          headers: authHeaders(),
        });

        if (!res.ok) return;

        const data = await res.json();
        const favorited = (data.favorites || []).some(
          (m: { _id: string }) => m._id === movieId
        );
        setIsFavorite(favorited);
      } finally {
        setChecked(true);
      }
    }

    checkFavorite();
  }, [movieId, loggedIn]);

  async function toggleFavorite() {
    if (!loggedIn) {
      window.location.href = "/login";
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${API_URL}/api/profile/favorites/${movieId}`,
        {
          method: isFavorite ? "DELETE" : "POST",
          headers: authHeaders(),
        }
      );

      if (res.ok) {
        setIsFavorite(!isFavorite);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!checked) return null;

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      title={
        loggedIn
          ? isFavorite
            ? "Remove from favorites"
            : "Add to favorites"
          : "Log in to save favorites"
      }
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      className="ml-3 inline-flex items-center justify-center rounded-full border border-gray-300 p-2 transition hover:bg-gray-100 disabled:opacity-50"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill={isFavorite ? "#dc2626" : "none"}
        stroke={isFavorite ? "#dc2626" : "currentColor"}
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21s-7.5-4.6-10-9.3C.5 8.4 2.3 5 5.7 5c1.9 0 3.4 1 4.3 2.5C11 6 12.5 5 14.3 5c3.4 0 5.2 3.4 3.7 6.7C19.5 16.4 12 21 12 21z"
        />
      </svg>
    </button>
  );
}

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
            <div className="flex items-center">
              <h1 className="text-4xl font-bold">{movie.title}</h1>
              <FavoriteButton movieId={movie._id} />
            </div>
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