export const API_URL = "http://localhost:5001";

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "Customer" | "Admin";
  status: string;
};

const TOKEN_KEY = "ces_token";
const USER_KEY = "ces_user";

export function storeAuth(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function authHeaders(): Record<string, string> {
  const token = getToken();

  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function redirectPathForRole(role: AuthUser["role"]): string {
  return role === "Admin" ? "/admin" : "/";
}
