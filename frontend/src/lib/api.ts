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

const API_BASE_URL = "https://ironpulse-ai.onrender.com";

export const getAccessToken = () =>
  (typeof window !== "undefined" && localStorage.getItem("ironpulse:accessToken")) ||
  "";

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

export const apiRequest = async <T>(path: string, init: RequestInit = {}): Promise<ApiSuccess<T>> => {
  const token = getAccessToken();
  const res = await withTimeout(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });

  const json = (await res.json()) as ApiSuccess<T> | ApiError;
  if (!res.ok || !json.success) {
    const err = json as ApiError;
    throw new Error(err.message || "Request failed");
  }
  return json as ApiSuccess<T>;
};

export const isBackendReachable = async () => {
  try {
    const res = await withTimeout(`${API_BASE_URL}/health`, { method: "GET" }, 4000);
    return res.ok;
  } catch {
    return false;
  }
};

export { API_BASE_URL };
