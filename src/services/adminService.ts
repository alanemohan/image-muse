import { apiFetch } from "./apiClient";
import { AiLog } from "./logsService";

export type AdminStats = {
  users: number;
  images: number;
  favorites: number;
  ai_logs: number;
};

export type AdminUser = {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
  last_sign_in_at?: string | null;
  is_admin?: number | boolean;
};

export const getAdminStats = async (): Promise<AdminStats> => {
  const data = await apiFetch<AdminStats>("/admin/stats");
  return data;
};

export const listAdminUsers = async (limit = 50): Promise<AdminUser[]> => {
  const data = await apiFetch<{ users: AdminUser[] }>(`/admin/users?limit=${limit}`);
  return data.users;
};

export const listAdminLogs = async (limit = 200): Promise<AiLog[]> => {
  const data = await apiFetch<{ logs: AiLog[] }>(`/admin/logs?limit=${limit}`);
  return data.logs;
};
