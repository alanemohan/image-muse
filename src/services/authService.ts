import { apiFetch, setAuthToken } from "./apiClient";

/* ----------------------------- */
/* Types                         */
/* ----------------------------- */

export type AuthUser = {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  is_admin?: boolean;
  created_at?: string | null;
  last_sign_in_at?: string | null;
};

type AuthResponse = {
  user: AuthUser;
  token: string;
};

type UpdateProfilePayload = {
  full_name?: string;
  avatar_url?: string;
};

/* ----------------------------- */
/* Helpers                       */
/* ----------------------------- */

const assertAuthResponse = (data: AuthResponse) => {
  if (!data?.token || !data?.user?.id) {
    throw new Error("Invalid authentication response");
  }
};

/* ----------------------------- */
/* Auth API                      */
/* ----------------------------- */

export const signUp = async (
  email: string,
  password: string
): Promise<AuthUser> => {
  const data = await apiFetch<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  assertAuthResponse(data);
  setAuthToken(data.token);

  return data.user;
};

export const signIn = async (
  email: string,
  password: string
): Promise<AuthUser> => {
  const data = await apiFetch<AuthResponse>("/auth/signin", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  assertAuthResponse(data);
  setAuthToken(data.token);

  return data.user;
};

export const getMe = async (): Promise<AuthUser> => {
  const data = await apiFetch<{ user: AuthUser }>("/auth/me");

  if (!data?.user?.id) {
    throw new Error("Invalid user session");
  }

  return data.user;
};

export const updateProfile = async (
  payload: UpdateProfilePayload
): Promise<AuthUser> => {
  const cleanPayload = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );

  const data = await apiFetch<{ user: AuthUser }>("/auth/profile", {
    method: "PATCH",
    body: JSON.stringify(cleanPayload),
  });

  return data.user;
};

export const signOut = (): void => {
  setAuthToken(null);
};
