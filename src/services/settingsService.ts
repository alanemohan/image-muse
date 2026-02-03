import { apiFetch } from "./apiClient";

export type UserSettings = {
  autoAnalyze: boolean;
  defaultSort: "newest" | "oldest" | "title" | "size";
  watermarkText: string;
  showMetadata: boolean;
};

export const getSettings = async (): Promise<UserSettings> => {
  const data = await apiFetch<{ settings: UserSettings }>("/settings");
  return data.settings;
};

export const updateSettings = async (payload: Partial<UserSettings>): Promise<UserSettings> => {
  const data = await apiFetch<{ settings: UserSettings }>("/settings", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data.settings;
};
