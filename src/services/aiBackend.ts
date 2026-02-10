import { apiFetch } from "./apiClient";
import { AIAnalysisResult } from "@/types/gallery";

export const analyzeImageViaBackend = async (imageBase64: string): Promise<AIAnalysisResult> => {
  return apiFetch<AIAnalysisResult>("/analyze-image", {
    method: "POST",
    body: JSON.stringify({ imageBase64, type: "analyze" }),
  });
};

export const regenerateCaptionViaBackend = async (imageBase64: string): Promise<string> => {
  const data = await apiFetch<{ caption: string }>("/analyze-image", {
    method: "POST",
    body: JSON.stringify({ imageBase64, type: "regenerate_caption" }),
  });

  return data.caption;
};
