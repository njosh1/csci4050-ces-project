"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const API_URL = "http://localhost:5001";

type RegistrationForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  promotionOptIn: boolean;
};

export default function RegisterPage() {
  const [form, setForm] = useState<RegistrationForm>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    promotionOptIn: false,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(
    field: keyof RegistrationForm,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim().toLowerCase();

    if (!firstName || !lastName || !email || !form.password) {
      setError("Please complete all required fields.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password: form.password,
          promotionOptIn: form.promotionOptIn,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create account.");
      }

      setSuccess(data.message);
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        promotionOptIn: false,
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create account."
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
              Create your account
            </p>

            <h1 className="mb-5 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Join CineBook and make every movie night entertaining.
            </h1>

          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-6 shadow-2xl backdrop-blur sm:p-8">
            <h2 className="text-2xl font-bold">Registration</h2>

            <p className="mt-2 text-sm text-slate-400">
              Fields marked with <span className="text-red-400">*</span> are
              required.
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
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="firstName"
                    className="mb-2 block text-sm font-semibold text-slate-200"
                  >
                    First Name <span className="text-red-400">*</span>
                  </label>

                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    maxLength={50}
                    autoComplete="given-name"
                    value={form.firstName}
                    onChange={(event) =>
                      updateField("firstName", event.target.value)
                    }
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="mb-2 block text-sm font-semibold text-slate-200"
                  >
                    Last Name <span className="text-red-400">*</span>
                  </label>

                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    maxLength={50}
                    autoComplete="family-name"
                    value={form.lastName}
                    onChange={(event) =>
                      updateField("lastName", event.target.value)
                    }
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
              </div>

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
                  value={form.email}
                  onChange={(event) =>
                    updateField("email", event.target.value)
                  }
                  className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  Password <span className="text-red-400">*</span>
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) =>
                    updateField("password", event.target.value)
                  }
                  className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />

                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Use at least 8 characters with uppercase, lowercase, a number,
                  and a special character.
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  Confirm Password <span className="text-red-400">*</span>
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(event) =>
                    updateField("confirmPassword", event.target.value)
                  }
                  className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <input
                  type="checkbox"
                  checked={form.promotionOptIn}
                  onChange={(event) =>
                    updateField("promotionOptIn", event.target.checked)
                  }
                  className="h-4 w-4 accent-sky-500"
                />

                <span className="text-sm text-slate-300">
                  Receive promotions
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-3 font-bold text-white transition hover:from-sky-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              After registering, check your email to verify your account before
              logging in.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
