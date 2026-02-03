const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export type ApiError = Error & { status?: number };

const AUTH_EVENT = "auth-changed";

export const getAuthToken = () => localStorage.getItem("auth_token");

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem("auth_token", token);
  } else {
    localStorage.removeItem("auth_token");
  }
  window.dispatchEvent(new Event(AUTH_EVENT));
};

export const onAuthChange = (handler: () => void) => {
  window.addEventListener(AUTH_EVENT, handler);
  return () => window.removeEventListener(AUTH_EVENT, handler);
};

export const apiFetch = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(data?.error || "Request failed") as ApiError;
    error.status = response.status;
    throw error;
  }

  return data as T;
};
