"use client";

import { FormEvent, useEffect, useState } from "react";

import { API_URL, authHeaders } from "@/lib/auth";

type Promotion = {
  _id: string;
  promoCode: string;
  discountAmount: number;
  expirationDate: string;
  isActive: boolean;
};

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [promoCode, setPromoCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [expirationDate, setExpirationDate] = useState("");

  async function loadPromotions() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/admin/promotions`, {
        headers: authHeaders(),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load promotions.");
      }

      setPromotions(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load promotions."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPromotions();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!promoCode.trim() || !discountAmount || !expirationDate) {
      setError("Please fill in all promotion fields.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/admin/promotions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          promoCode: promoCode.trim(),
          discountAmount: Number(discountAmount),
          expirationDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create promotion.");
      }

      setPromoCode("");
      setDiscountAmount("");
      setExpirationDate("");
      await loadPromotions();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create promotion."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(promotion: Promotion) {
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/admin/promotions/${promotion._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({ isActive: !promotion.isActive }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update promotion.");
      }

      await loadPromotions();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update promotion."
      );
    }
  }

  async function handleDelete(id: string) {
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/admin/promotions/${id}`,
        {
          method: "DELETE",
          headers: authHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete promotion.");
      }

      await loadPromotions();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete promotion."
      );
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">
        Promotions
      </h1>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900/75 p-6 shadow-xl">
        <h2 className="text-lg font-bold">Create Promotion</h2>

        <form
          onSubmit={handleCreate}
          className="mt-4 grid gap-4 sm:grid-cols-3"
        >
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-200">
              Promo Code <span className="text-red-400">*</span>
            </label>
            <input
              required
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-200">
              Discount Amount ($){" "}
              <span className="text-red-400">*</span>
            </label>
            <input
              required
              type="number"
              min={0}
              step="0.01"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-200">
              Expiration Date <span className="text-red-400">*</span>
            </label>
            <input
              required
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-sky-500"
            />
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2.5 font-bold text-white transition hover:from-sky-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create Promotion"}
            </button>
          </div>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold">
          All Promotions ({promotions.length})
        </h2>

        {loading ? (
          <p className="mt-4 text-slate-400">Loading promotions...</p>
        ) : (
          <div className="mt-4 space-y-3">
            {promotions.map((promotion) => (
              <div
                key={promotion._id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/60 px-5 py-4"
              >
                <div>
                  <p className="font-semibold text-white">
                    {promotion.promoCode}{" "}
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        promotion.isActive
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "bg-slate-500/10 text-slate-400"
                      }`}
                    >
                      {promotion.isActive ? "Active" : "Inactive"}
                    </span>
                  </p>
                  <p className="text-sm text-slate-400">
                    ${promotion.discountAmount.toFixed(2)} off &middot;
                    expires{" "}
                    {new Date(
                      promotion.expirationDate
                    ).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(promotion)}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    {promotion.isActive ? "Deactivate" : "Activate"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(promotion._id)}
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
