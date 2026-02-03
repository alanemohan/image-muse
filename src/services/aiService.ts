import { apiFetch } from "./apiClient";

export type ChatMessage = {
  role: "user" | "ai";
  content: string;
};

const getGeminiOverride = () => localStorage.getItem("gemini_api_key") || "";

const getAiHeaders = () => {
  const key = getGeminiOverride().trim();
  return key ? { "x-gemini-key": key } : undefined;
};

export const generateAIResponse = async (message: string, history: ChatMessage[] = []) => {
  const data = await apiFetch<{ reply: string }>("/ai-chat", {
    method: "POST",
    headers: getAiHeaders(),
    body: JSON.stringify({ message, history }),
  });

  return data.reply;
};
