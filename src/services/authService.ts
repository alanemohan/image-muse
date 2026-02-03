import { apiFetch, setAuthToken } from "./apiClient";

export type AuthUser = {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
  last_sign_in_at?: string | null;
  is_admin?: boolean;
};

type AuthResponse = {
  user: AuthUser;
  token: string;
};

export const signUp = async (email: string, password: string) => {
  const data = await apiFetch<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  setAuthToken(data.token);
  return data.user;
};

export const signIn = async (email: string, password: string) => {
  const data = await apiFetch<AuthResponse>("/auth/signin", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  setAuthToken(data.token);
  return data.user;
};

export const getMe = async () => {
  const data = await apiFetch<{ user: AuthUser }>("/auth/me");
  return data.user;
};

export const updateProfile = async (payload: { full_name?: string; avatar_url?: string }) => {
  const data = await apiFetch<{ user: AuthUser }>("/auth/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data.user;
};

export const signOut = () => {
  setAuthToken(null);
};
