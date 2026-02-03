import { apiFetch } from "./apiClient";

export type AiLog = {
  id: string;
  user_id?: string | null;
  type: string;
  status_code?: number | null;
  message?: string | null;
  raw?: string | null;
  created_at: string;
};

export const listAiLogs = async (limit = 100): Promise<AiLog[]> => {
  const data = await apiFetch<{ logs: AiLog[] }>(`/logs?limit=${limit}`);
  return data.logs;
};
