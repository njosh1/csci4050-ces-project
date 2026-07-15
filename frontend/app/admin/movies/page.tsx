"use client";

import { FormEvent, useEffect, useState } from "react";

import { API_URL, authHeaders } from "@/lib/auth";

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

const RATINGS = ["G", "PG", "PG-13", "R", "NC-17"];
const STATUSES = ["Currently Running", "Coming Soon"];

const EMPTY_FORM = {
  title: "",
  description: "",
  genre: "",
  rating: "PG-13",
  status: "Currently Running",
  posterUrl: "",
  trailerUrl: "",
};

export default function AdminMoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
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
  }, []);

  function startEdit(movie: Movie) {
    setEditingId(movie._id);
    setForm({
      title: movie.title,
      description: movie.description,
      genre: movie.genre.join(", "),
      rating: movie.rating,
      status: movie.status,
      posterUrl: movie.posterUrl,
      trailerUrl: movie.trailerUrl,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      genre: form.genre
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean),
      rating: form.rating,
      status: form.status,
      posterUrl: form.posterUrl.trim(),
      trailerUrl: form.trailerUrl.trim(),
    };

    try {
      const url = editingId
        ? `${API_URL}/api/admin/movies/${editingId}`
        : `${API_URL}/api/admin/movies`;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save movie.");
      }

      cancelEdit();
      await loadMovies();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save movie."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/admin/movies/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete movie.");
      }

      await loadMovies();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete movie."
      );
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">Movies</h1>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900/75 p-6 shadow-xl">
        <h2 className="text-lg font-bold">
          {editingId ? "Edit Movie" : "Add Movie"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-semibold text-slate-200">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              required
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-sky-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-semibold text-slate-200">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-sky-500"
              rows={3}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-200">
              Genre (comma separated) <span className="text-red-400">*</span>
            </label>
            <input
              required
              value={form.genre}
              onChange={(e) =>
                setForm({ ...form, genre: e.target.value })
              }
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-200">
              Rating
            </label>
            <select
              value={form.rating}
              onChange={(e) =>
                setForm({ ...form, rating: e.target.value })
              }
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-sky-500"
            >
              {RATINGS.map((rating) => (
                <option key={rating} value={rating}>
                  {rating}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-200">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value })
              }
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-sky-500"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-200">
              Poster URL <span className="text-red-400">*</span>
            </label>
            <input
              required
              value={form.posterUrl}
              onChange={(e) =>
                setForm({ ...form, posterUrl: e.target.value })
              }
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-200">
              Trailer URL <span className="text-red-400">*</span>
            </label>
            <input
              required
              value={form.trailerUrl}
              onChange={(e) =>
                setForm({ ...form, trailerUrl: e.target.value })
              }
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2.5 font-bold text-white transition hover:from-sky-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Saving..."
                : editingId
                ? "Save Changes"
                : "Add Movie"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg border border-white/10 px-5 py-2.5 font-semibold text-white transition hover:bg-white/10"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold">
          Catalog ({movies.length})
        </h2>

        {loading ? (
          <p className="mt-4 text-slate-400">Loading movies...</p>
        ) : (
          <div className="mt-4 space-y-3">
            {movies.map((movie) => (
              <div
                key={movie._id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/60 px-5 py-4"
              >
                <div>
                  <p className="font-semibold text-white">
                    {movie.title}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      ({movie.rating} &middot; {movie.status})
                    </span>
                  </p>
                  <p className="text-sm text-slate-400">
                    {movie.genre.join(", ")}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(movie)}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(movie._id)}
                    className="rounded-lg border border-red-500/30 px-3 py-1.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
