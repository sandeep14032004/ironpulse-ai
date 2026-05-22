export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiError = {
  success: false;
  message: string;
  errors?: Array<{ field?: string; message?: string }>;
};

const DEFAULT_PROD_API_BASE_URL = "https://ironpulse-ai.onrender.com";
const DEFAULT_LOCAL_API_BASE_URL = "http://localhost:5000";
const ACCESS_TOKEN_KEY = "ironpulse:accessToken";

const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  const localEnvUrl = import.meta.env.VITE_API_BASE_URL_LOCAL?.trim();
  const prodEnvUrl = import.meta.env.VITE_API_BASE_URL_PROD?.trim();

  if (envUrl) return envUrl.replace(/\/+$/, "");

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return (localEnvUrl || DEFAULT_LOCAL_API_BASE_URL).replace(/\/+$/, "");
    }
  }

  return (prodEnvUrl || DEFAULT_PROD_API_BASE_URL).replace(/\/+$/, "");
};

const API_BASE_URL = resolveApiBaseUrl();

export const getAccessToken = () =>
  (typeof window !== "undefined" && localStorage.getItem(ACCESS_TOKEN_KEY)) || "";

export const hasBackendAuth = () => Boolean(getAccessToken());

const withTimeout = async (input: RequestInfo | URL, init?: RequestInit, timeoutMs = 12000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const storeAccessToken = (token: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

const clearAccessToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

const refreshAccessToken = async () => {
  const res = await withTimeout(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  const json = (await res.json()) as ApiSuccess<{ accessToken: string }> | ApiError;
  if (!res.ok || !json.success) {
    clearAccessToken();
    throw new Error((json as ApiError).message || "Session expired");
  }

  storeAccessToken(json.data.accessToken);
  return json.data.accessToken;
};

export const apiRequest = async <T>(path: string, init: RequestInit = {}): Promise<ApiSuccess<T>> => {
  const execute = async (token: string) =>
    withTimeout(`${API_BASE_URL}${path}`, {
      credentials: "include",
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers || {}),
      },
    });

  let token = getAccessToken();
  let res = await execute(token);

  if (res.status === 401 && token && path !== "/api/v1/auth/refresh") {
    try {
      token = await refreshAccessToken();
      res = await execute(token);
    } catch {
      clearAccessToken();
    }
  }

  const json = (await res.json()) as ApiSuccess<T> | ApiError;
  if (!res.ok || !json.success) {
    const err = json as ApiError;
    throw new Error(err.message || "Request failed");
  }
  return json as ApiSuccess<T>;
};

export { API_BASE_URL };
