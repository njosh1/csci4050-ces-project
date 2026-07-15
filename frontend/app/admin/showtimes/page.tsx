"use client";

import { FormEvent, useEffect, useState } from "react";

import { API_URL, authHeaders } from "@/lib/auth";

type Showtime = {
  _id: string;
  date: string;
  time: string;
};

type Movie = {
  _id: string;
  title: string;
  showtimes: Showtime[];
};

export default function AdminShowtimesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovieId, setSelectedMovieId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function loadMovies() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/movies`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load movies.");
      }

      setMovies(data);

      if (!selectedMovieId && data.length > 0) {
        setSelectedMovieId(data[0]._id);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load movies."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMovies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedMovie = movies.find((m) => m._id === selectedMovieId);

  async function handleAddShowtime(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!selectedMovieId || !date || !time) {
      setError("Please choose a movie, date, and time.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `${API_URL}/api/admin/movies/${selectedMovieId}/showtimes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({ date, time }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to add showtime.");
      }

      setDate("");
      setTime("");
      await loadMovies();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to add showtime."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteShowtime(showtimeId: string) {
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/admin/movies/${selectedMovieId}/showtimes/${showtimeId}`,
        {
          method: "DELETE",
          headers: authHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to remove showtime.");
      }

      await loadMovies();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to remove showtime."
      );
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">
        Showtimes
      </h1>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {loading ? (
        <p className="mt-4 text-slate-400">Loading movies...</p>
      ) : movies.length === 0 ? (
        <p className="mt-4 text-slate-400">
          No movies yet. Add a movie first.
        </p>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-6 shadow-xl">
            <h2 className="text-lg font-bold">Add Showtime</h2>

            <form
              onSubmit={handleAddShowtime}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-200">
                  Movie
                </label>
                <select
                  value={selectedMovieId}
                  onChange={(e) => setSelectedMovieId(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-sky-500"
                >
                  {movies.map((movie) => (
                    <option key={movie._id} value={movie._id}>
                      {movie.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-200">
                  Date
                </label>
                <input
                  required
                  placeholder="2026-08-01"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-200">
                  Time
                </label>
                <input
                  required
                  placeholder="7:00 PM"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-sky-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2.5 font-bold text-white transition hover:from-sky-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Adding..." : "Add Showtime"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-6 shadow-xl">
            <h2 className="text-lg font-bold">
              {selectedMovie ? selectedMovie.title : "Showtimes"}
            </h2>

            {selectedMovie && selectedMovie.showtimes.length === 0 && (
              <p className="mt-4 text-sm text-slate-400">
                No showtimes scheduled yet.
              </p>
            )}

            <div className="mt-4 space-y-2">
              {selectedMovie?.showtimes.map((showtime) => (
                <div
                  key={showtime._id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-800/60 px-4 py-2.5"
                >
                  <span className="text-sm text-slate-200">
                    {showtime.date} &middot; {showtime.time}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDeleteShowtime(showtime._id)}
                    className="rounded-lg border border-red-500/30 px-3 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-500/10"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
