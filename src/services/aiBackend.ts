import { apiFetch } from "./apiClient";
import { AIAnalysisResult } from "@/types/gallery";

const getOpenRouterOverride = () =>
  localStorage.getItem("app:openrouter_api_key") || "";
const getHuggingFaceOverride = () =>
  localStorage.getItem("app:huggingface_api_key") || "";

const getAiHeaders = () => {
  const openrouter = getOpenRouterOverride().trim();
  const huggingface = getHuggingFaceOverride().trim();

  const headers: Record<string, string> = {};
  if (openrouter) headers["x-openrouter-key"] = openrouter;
  if (huggingface) headers["x-huggingface-key"] = huggingface;

  return Object.keys(headers).length ? headers : undefined;
};

export type AiProviderStatus = {
  id: string;
  enabled: boolean;
  reachable: boolean;
  status: string;
  statusCode?: number | null;
  latencyMs?: number | null;
  checkedAt: string;
  models: string[];
  detail?: string;
};

export const getAiProviders = async (): Promise<AiProviderStatus[]> => {
  const data = await apiFetch<{ providers: AiProviderStatus[] }>("/ai/providers", {
    headers: getAiHeaders(),
  });

  if (!Array.isArray(data.providers)) {
    throw new Error("Invalid provider status payload from backend");
  }

  return data.providers;
};

export const analyzeImageViaBackend = async (imageBase64: string): Promise<AIAnalysisResult> => {
  return apiFetch<AIAnalysisResult>("/analyze-image", {
    method: "POST",
    headers: getAiHeaders(),
    body: JSON.stringify({ imageBase64, type: "analyze" }),
  });
};

export const regenerateCaptionViaBackend = async (imageBase64: string): Promise<string> => {
  const data = await apiFetch<{ caption: string }>("/analyze-image", {
    method: "POST",
    headers: getAiHeaders(),
    body: JSON.stringify({ imageBase64, type: "regenerate_caption" }),
  });

  return data.caption;
};
