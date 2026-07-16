"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const API_URL = "http://localhost:5001";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!password) {
      setError("Please enter a new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/reset-password/${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to reset password.");
      }

      setSuccess(data.message);

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to reset password."
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
            href="/login"
            className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            Back to Login
          </Link>
        </nav>

        <div className="mx-auto max-w-md">
          <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-6 shadow-2xl backdrop-blur sm:p-8">
            <h2 className="text-2xl font-bold">Reset Password</h2>

            <p className="mt-2 text-sm text-slate-400">
              Choose a new password for your account.
            </p>

            {error && (
              <div
                role="alert"
                className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mt-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
              >
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  New Password <span className="text-red-400">*</span>
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />

                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Use at least 8 characters with uppercase, lowercase, a
                  number, and a special character.
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  Confirm New Password{" "}
                  <span className="text-red-400">*</span>
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-3 font-bold text-white transition hover:from-sky-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
