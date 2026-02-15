const configuredApiBaseUrl =
  typeof import.meta.env.VITE_API_BASE_URL === "string"
    ? import.meta.env.VITE_API_BASE_URL.trim()
    : "";

const API_BASE_URL = configuredApiBaseUrl
  ? configuredApiBaseUrl.replace(/\/+$/, "")
  : import.meta.env.DEV
    ? "http://localhost:4000"
    : "";

const toApiUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export type ApiError = Error & {
  status?: number;
  data?: unknown;
};

const readErrorMessage = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object") return null;

  const source = payload as { message?: unknown; error?: unknown };
  if (typeof source.message === "string" && source.message.trim()) {
    return source.message;
  }

  if (typeof source.error === "string" && source.error.trim()) {
    return source.error;
  }

  return null;
};

const AUTH_EVENT = "app:auth-changed";
const REQUEST_TIMEOUT = 15_000; // 15s

/* ----------------------------- */
/* Auth token helpers            */
/* ----------------------------- */

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem("auth_token");
  } catch {
    return null;
  }
};

export const setAuthToken = (token: string | null): void => {
  try {
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
    }
  } finally {
    window.dispatchEvent(new Event(AUTH_EVENT));
  }
};

export const onAuthChange = (handler: () => void): (() => void) => {
  window.addEventListener(AUTH_EVENT, handler);
  return () => window.removeEventListener(AUTH_EVENT, handler);
};

/* ----------------------------- */
/* API fetch wrapper             */
/* ----------------------------- */

export const apiFetch = async <T>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  let response: Response;

  try {
    response = await fetch(toApiUrl(path), {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    throw new Error("Network request failed");
  }

  clearTimeout(timeoutId);

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  const data = isJson
    ? await response.json().catch(() => null)
    : null;

  if (!response.ok) {
    if (response.status === 401 && token) {
      setAuthToken(null);
    }

    const errorMessage = readErrorMessage(data);
    const error = new Error(
      errorMessage ||
        response.statusText ||
        "Request failed"
    ) as ApiError;

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data as T;
};
