"use client";

import Link from "next/link";

const SECTIONS = [
  {
    href: "/admin/movies",
    title: "Movies",
    description: "Add, edit, or remove movies from the catalog.",
  },
  {
    href: "/admin/showtimes",
    title: "Showtimes",
    description: "Manage showtimes for existing movies.",
  },
  {
    href: "/admin/promotions",
    title: "Promotions",
    description: "Create and manage promo codes.",
  },
  {
    href: "/admin/users",
    title: "Users",
    description: "View accounts and update their status.",
  },
];

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">
        Admin Dashboard
      </h1>

      <p className="mt-2 text-slate-400">
        Manage the Cinema E-Booking catalog and accounts.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-2xl border border-white/10 bg-slate-900/75 p-6 shadow-xl backdrop-blur transition hover:border-sky-500/40"
          >
            <h2 className="text-xl font-bold">{section.title}</h2>
            <p className="mt-2 text-sm text-slate-400">
              {section.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
