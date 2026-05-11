import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "./api";

export type AuthUser = {
  _id: string;
  name: string;
  email: string;
  xp: number;
  level: string;
  streak: number;
  timerDuration?: number;
  notificationsEnabled?: boolean;
  preferredUnits?: "metric" | "imperial";
  themePreference?: "light" | "dark";
};

type AuthResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
};

const ACCESS_TOKEN_KEY = "ironpulse:accessToken";
const USER_KEY = "ironpulse:user";

export function getStoredAccessToken() {
  return (typeof window !== "undefined" && localStorage.getItem(ACCESS_TOKEN_KEY)) || "";
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function storeAuthSession(payload: AuthResponse) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
}

export function updateStoredUser(user: AuthUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function loginUser(payload: { email: string; password: string }) {
  const res = await apiRequest<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  storeAuthSession(res.data);
  return res.data;
}

export async function registerUser(payload: { name: string; email: string; password: string }) {
  const res = await apiRequest<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  storeAuthSession(res.data);
  return res.data;
}

export async function logoutUser() {
  try {
    await apiRequest("/api/v1/auth/logout", { method: "POST" });
  } finally {
    clearAuthSession();
  }
}

export function useAuthProfile(enabled = true) {
  return useQuery({
    queryKey: ["auth-profile"],
    enabled,
    queryFn: async () => {
      const res = await apiRequest<{ user: AuthUser }>("/api/v1/auth/profile");
      updateStoredUser(res.data.user);
      return res.data.user;
    },
    initialData: getStoredUser() ?? undefined,
  });
}
