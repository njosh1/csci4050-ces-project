"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { authHeaders, getToken } from "@/lib/auth";

const API_URL = "http://localhost:5001";

type Address = {
  street: string;
  city: string;
  state: string;
  zipCode: string;
};

type PaymentCard = {
  id: string;
  cardholderName: string;
  lastFourDigits: string;
  expirationMonth: number;
  expirationYear: number;
  billingZip: string;
};

type Profile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  promotionOptIn: boolean;
  address: Address | null;
  paymentCards: PaymentCard[];
  favoriteCount: number;
};

type FavoriteMovie = {
  _id: string;
  title: string;
  posterUrl: string;
  rating: string;
};

const MAX_PAYMENT_CARDS = 3;

async function apiFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}/api/profile${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [favorites, setFavorites] = useState<FavoriteMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }

    async function load() {
      try {
        const [profileData, favoritesData] = await Promise.all([
          apiFetch("/"),
          apiFetch("/favorites"),
        ]);

        setProfile(profileData);
        setFavorites(favoritesData.favorites || []);
      } catch (err) {
        setLoadError(
          err instanceof Error ? err.message : "Unable to load your profile."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-8 text-black">
        <p className="mx-auto max-w-3xl">Loading your profile...</p>
      </main>
    );
  }

  if (loadError || !profile) {
    return (
      <main className="min-h-screen bg-gray-100 p-8 text-black">
        <div className="mx-auto max-w-3xl rounded-lg bg-white p-8 shadow">
          <p className="text-red-700">{loadError || "Profile unavailable."}</p>
          <Link href="/login" className="mt-4 inline-block text-blue-600">
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/" className="inline-block text-blue-600">
          ← Back to Home
        </Link>

        <h1 className="text-3xl font-bold">My Profile</h1>

        <PersonalInfoSection
          profile={profile}
          onUpdated={(updated) =>
            setProfile((current) =>
              current ? { ...current, ...updated } : current
            )
          }
        />

        <AddressSection
          address={profile.address}
          onUpdated={(address) =>
            setProfile((current) => (current ? { ...current, address } : current))
          }
        />

        <PaymentCardsSection
          cards={profile.paymentCards}
          onUpdated={(paymentCards) =>
            setProfile((current) =>
              current ? { ...current, paymentCards } : current
            )
          }
        />

        <PasswordSection />

        <FavoritesSection
          favorites={favorites}
          onRemoved={(movieId) =>
            setFavorites((current) =>
              current.filter((movie) => movie._id !== movieId)
            )
          }
        />
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function RequiredMark() {
  return <span className="text-red-500"> *</span>;
}

function Banner({ error, success }: { error: string; success: string }) {
  if (!error && !success) return null;

  return (
    <div
      className={`mb-4 rounded p-3 text-sm ${
        error
          ? "bg-red-50 text-red-700 border border-red-200"
          : "bg-green-50 text-green-700 border border-green-200"
      }`}
    >
      {error || success}
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Personal info
// ---------------------------------------------------------------------------

function PersonalInfoSection({
  profile,
  onUpdated,
}: {
  profile: Profile;
  onUpdated: (fields: Partial<Profile>) => void;
}) {
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [phone, setPhone] = useState(profile.phone);
  const [promotionOptIn, setPromotionOptIn] = useState(profile.promotionOptIn);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError("");
    setSuccess("");

    if (!firstName.trim() || !lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }

    setSaving(true);

    try {
      const data = await apiFetch("/", {
        method: "PUT",
        body: JSON.stringify({ firstName, lastName, phone, promotionOptIn }),
      });

      onUpdated(data.profile);
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Personal Information">
      <Banner error={error} success={success} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">
            First Name
            <RequiredMark />
          </label>
          <input
            className="w-full rounded border border-gray-300 px-3 py-2"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Last Name
            <RequiredMark />
          </label>
          <input
            className="w-full rounded border border-gray-300 px-3 py-2"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            className="w-full cursor-not-allowed rounded border border-gray-300 bg-gray-100 px-3 py-2 text-gray-500"
            value={profile.email}
            disabled
            title="Email address cannot be changed."
          />
          <p className="mt-1 text-xs text-gray-500">
            Email address cannot be changed.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Phone</label>
          <input
            className="w-full rounded border border-gray-300 px-3 py-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 555-5555"
          />
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={promotionOptIn}
          onChange={(e) => setPromotionOptIn(e.target.checked)}
        />
        Send me promotional emails
      </label>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Address (max 1)
// ---------------------------------------------------------------------------

function AddressSection({
  address,
  onUpdated,
}: {
  address: Address | null;
  onUpdated: (address: Address | null) => void;
}) {
  const emptyForm: Address = { street: "", city: "", state: "", zipCode: "" };
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Address>(address || emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setForm(address || emptyForm);
    setError("");
    setSuccess("");
    setEditing(true);
  }

  async function handleSave() {
    setError("");
    setSuccess("");

    if (!form.street.trim() || !form.city.trim() || !form.state.trim() || !form.zipCode.trim()) {
      setError("Street, city, state, and ZIP code are required.");
      return;
    }

    setSaving(true);

    try {
      const data = await apiFetch("/address", {
        method: address ? "PUT" : "POST",
        body: JSON.stringify(form),
      });

      onUpdated(data.address);
      setSuccess(address ? "Address updated successfully." : "Address added successfully.");
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save address.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      await apiFetch("/address", { method: "DELETE" });
      onUpdated(null);
      setSuccess("Address removed successfully.");
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove address.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Mailing Address">
      <Banner error={error} success={success} />
      <p className="mb-3 text-xs text-gray-500">
        Only one address may be stored at a time.
      </p>

      {!editing && address && (
        <div className="mb-4 rounded border border-gray-200 p-3 text-sm">
          <p>{address.street}</p>
          <p>
            {address.city}, {address.state} {address.zipCode}
          </p>
        </div>
      )}

      {!editing && !address && (
        <p className="mb-4 text-sm text-gray-600">No address on file.</p>
      )}

      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Street<RequiredMark />
            </label>
            <input
              className="w-full rounded border border-gray-300 px-3 py-2"
              value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">
                City<RequiredMark />
              </label>
              <input
                className="w-full rounded border border-gray-300 px-3 py-2"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                State<RequiredMark />
              </label>
              <input
                className="w-full rounded border border-gray-300 px-3 py-2"
                value={form.state}
                maxLength={2}
                placeholder="GA"
                onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                ZIP Code<RequiredMark />
              </label>
              <input
                className="w-full rounded border border-gray-300 px-3 py-2"
                value={form.zipCode}
                placeholder="30601"
                onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Address"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded border border-gray-300 px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={startEdit}
            className="rounded bg-black px-4 py-2 text-white"
          >
            {address ? "Edit Address" : "Add Address"}
          </button>

          {address && (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="rounded border border-red-300 px-4 py-2 text-red-700 disabled:opacity-50"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Payment cards (max 3)
// ---------------------------------------------------------------------------

function PaymentCardsSection({
  cards,
  onUpdated,
}: {
  cards: PaymentCard[];
  onUpdated: (cards: PaymentCard[]) => void;
}) {
  const emptyForm = {
    cardholderName: "",
    cardNumber: "",
    expirationMonth: "",
    expirationYear: "",
    billingZip: "",
  };
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const atLimit = cards.length >= MAX_PAYMENT_CARDS;

  async function handleAdd() {
    setError("");
    setSuccess("");

    if (
      !form.cardholderName.trim() ||
      !form.cardNumber.trim() ||
      !form.expirationMonth ||
      !form.expirationYear ||
      !form.billingZip.trim()
    ) {
      setError("All card fields are required.");
      return;
    }

    setSaving(true);

    try {
      const data = await apiFetch("/cards", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          expirationMonth: Number(form.expirationMonth),
          expirationYear: Number(form.expirationYear),
        }),
      });

      onUpdated(data.paymentCards);
      setSuccess("Payment card added successfully.");
      setForm(emptyForm);
      setAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add card.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cardId: string) {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const data = await apiFetch(`/cards/${cardId}`, { method: "DELETE" });
      onUpdated(data.paymentCards);
      setSuccess("Payment card removed successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove card.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Payment Cards">
      <Banner error={error} success={success} />
      <p className="mb-3 text-xs text-gray-500">
        Up to {MAX_PAYMENT_CARDS} cards may be stored. Card numbers are encrypted.
      </p>

      <ul className="mb-4 space-y-2">
        {cards.map((card) => (
          <li
            key={card.id}
            className="flex items-center justify-between rounded border border-gray-200 p-3 text-sm"
          >
            <span>
              {card.cardholderName} — •••• {card.lastFourDigits} (exp{" "}
              {String(card.expirationMonth).padStart(2, "0")}/{card.expirationYear})
            </span>
            <button
              onClick={() => handleDelete(card.id)}
              disabled={saving}
              className="text-red-700 hover:underline disabled:opacity-50"
            >
              Remove
            </button>
          </li>
        ))}

        {cards.length === 0 && (
          <li className="text-sm text-gray-600">No payment cards on file.</li>
        )}
      </ul>

      {adding ? (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Cardholder Name<RequiredMark />
            </label>
            <input
              className="w-full rounded border border-gray-300 px-3 py-2"
              value={form.cardholderName}
              onChange={(e) => setForm({ ...form, cardholderName: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Card Number<RequiredMark />
            </label>
            <input
              className="w-full rounded border border-gray-300 px-3 py-2"
              value={form.cardNumber}
              placeholder="4111111111111111"
              onChange={(e) => setForm({ ...form, cardNumber: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Exp. Month<RequiredMark />
              </label>
              <input
                className="w-full rounded border border-gray-300 px-3 py-2"
                value={form.expirationMonth}
                placeholder="12"
                onChange={(e) => setForm({ ...form, expirationMonth: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Exp. Year<RequiredMark />
              </label>
              <input
                className="w-full rounded border border-gray-300 px-3 py-2"
                value={form.expirationYear}
                placeholder="2028"
                onChange={(e) => setForm({ ...form, expirationYear: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Billing ZIP<RequiredMark />
              </label>
              <input
                className="w-full rounded border border-gray-300 px-3 py-2"
                value={form.billingZip}
                placeholder="30601"
                onChange={(e) => setForm({ ...form, billingZip: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add Card"}
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setForm(emptyForm);
              }}
              className="rounded border border-gray-300 px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          disabled={atLimit}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          title={atLimit ? `Only ${MAX_PAYMENT_CARDS} cards may be stored.` : undefined}
        >
          {atLimit ? "Card limit reached" : "Add Card"}
        </button>
      )}
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Password
// ---------------------------------------------------------------------------

function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError("");
    setSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All password fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSaving(true);

    try {
      await apiFetch("/password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      setSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to change password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Change Password">
      <Banner error={error} success={success} />

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Current Password<RequiredMark />
          </label>
          <input
            type="password"
            className="w-full rounded border border-gray-300 px-3 py-2"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            New Password<RequiredMark />
          </label>
          <input
            type="password"
            className="w-full rounded border border-gray-300 px-3 py-2"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            At least 8 characters, with uppercase, lowercase, a number, and a special character.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Confirm New Password<RequiredMark />
          </label>
          <input
            type="password"
            className="w-full rounded border border-gray-300 px-3 py-2"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {saving ? "Saving..." : "Change Password"}
      </button>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Favorites
// ---------------------------------------------------------------------------

function FavoritesSection({
  favorites,
  onRemoved,
}: {
  favorites: FavoriteMovie[];
  onRemoved: (movieId: string) => void;
}) {
  const [error, setError] = useState("");

  async function handleRemove(movieId: string) {
    setError("");

    try {
      await apiFetch(`/favorites/${movieId}`, { method: "DELETE" });
      onRemoved(movieId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove favorite.");
    }
  }

  return (
    <SectionCard title="My Favorite Movies">
      <Banner error={error} success="" />

      {favorites.length === 0 ? (
        <p className="text-sm text-gray-600">
          You haven&apos;t favorited any movies yet. Look for the heart icon while
          browsing movies to add one.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {favorites.map((movie) => (
            <li
              key={movie._id}
              className="flex items-center justify-between gap-3 rounded border border-gray-200 p-3"
            >
              <Link href={`/movies/${movie._id}`} className="text-sm font-medium text-blue-700 hover:underline">
                {movie.title}
              </Link>
              <button
                onClick={() => handleRemove(movie._id)}
                className="text-xs text-red-700 hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
