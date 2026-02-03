import { apiFetch } from "./apiClient";
import { AIAnalysisResult } from "@/types/gallery";

const getGeminiOverride = () => localStorage.getItem("gemini_api_key") || "";

const getAiHeaders = () => {
  const key = getGeminiOverride().trim();
  return key ? { "x-gemini-key": key } : undefined;
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
