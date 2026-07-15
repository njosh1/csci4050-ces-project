"use client";

import { useEffect, useState } from "react";

import { API_URL, authHeaders } from "@/lib/auth";

type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
};

const STATUSES = ["Active", "Inactive", "Suspended"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/admin/users`, {
        headers: authHeaders(),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load users.");
      }

      setUsers(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleStatusChange(id: string, status: string) {
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/admin/users/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update user status.");
      }

      await loadUsers();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update user status."
      );
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">Users</h1>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {loading ? (
        <p className="mt-4 text-slate-400">Loading users...</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/75 shadow-xl">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-slate-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-white/5 last:border-0"
                >
                  <td className="px-5 py-3 text-white">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="px-5 py-3 text-slate-300">
                    {user.email}
                  </td>
                  <td className="px-5 py-3 text-slate-300">
                    {user.role}
                  </td>
                  <td className="px-5 py-3">
                    <select
                      value={user.status}
                      onChange={(e) =>
                        handleStatusChange(user.id, e.target.value)
                      }
                      className="rounded-lg border border-white/10 bg-slate-800 px-2 py-1.5 text-white outline-none focus:border-sky-500"
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
