"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

import { AuthUser, clearAuth, getStoredUser } from "@/lib/auth";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/movies", label: "Movies" },
  { href: "/admin/showtimes", label: "Showtimes" },
  { href: "/admin/promotions", label: "Promotions" },
  { href: "/admin/users", label: "Users" },
];

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<AuthUser | null | undefined>(
    undefined
  );

  useEffect(() => {
    const storedUser = getStoredUser();

    if (!storedUser || storedUser.role !== "Admin") {
      router.replace("/login");
      return;
    }

    setUser(storedUser);
  }, [router]);

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Checking admin access...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background:
          "radial-gradient(circle at top, #0f1e36 0%, #030712 75%)",
      }}
    >
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/30 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-xl font-extrabold tracking-tight text-white"
            >
              CineBook Admin
            </Link>

            <div className="flex items-center gap-5 text-sm font-medium text-slate-400">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    pathname === link.href
                      ? "text-white"
                      : "transition-colors hover:text-white"
                  }
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-500">
              {user.firstName} {user.lastName}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-white/10 px-4 py-2 font-semibold text-white transition hover:bg-white/10"
            >
              Log Out
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}
