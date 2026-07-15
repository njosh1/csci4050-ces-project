"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { redirectPathForRole, storeAuth } from "@/lib/auth";

const API_URL = "http://localhost:5001";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to log in.");
      }

      storeAuth(data.token, data.user);
      router.push(redirectPathForRole(data.user.role));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to log in."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      className="min-h-screen px-6 py-10 text-white"
      style={{
        background:
          "radial-gradient(circle at top, #0f1e36 0%, #030712 75%)",
      }}
    >
      <div className="mx-auto max-w-6xl">
        <nav className="mb-10 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-extrabold tracking-tight text-white"
          >
            CineBook
          </Link>

          <Link
            href="/"
            className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            Back to Home
          </Link>
        </nav>

        <div className="grid items-center gap-10 lg:grid-cols-2">
          <section>
            <p className="mb-4 inline-block rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-sky-400">
              Welcome back
            </p>

            <h1 className="mb-5 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Log in to book your next movie night.
            </h1>
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-6 shadow-2xl backdrop-blur sm:p-8">
            <h2 className="text-2xl font-bold">Log In</h2>

            {error && (
              <div
                role="alert"
                className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  Email Address <span className="text-red-400">*</span>
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-slate-200"
                  >
                    Password <span className="text-red-400">*</span>
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-sky-400 transition-colors hover:text-sky-300"
                  >
                    Forgot password?
                  </Link>
                </div>

                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-3 font-bold text-white transition hover:from-sky-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Logging In..." : "Log In"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-sky-400 hover:text-sky-300"
              >
                Register
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
