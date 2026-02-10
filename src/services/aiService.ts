import { apiFetch } from "./apiClient";

export type ChatMessage = {
  role: "user" | "ai";
  content: string;
};

export const generateAIResponse = async (message: string, history: ChatMessage[] = []) => {
  const data = await apiFetch<{ reply: string }>("/ai-chat", {
    method: "POST",
    body: JSON.stringify({ message, history }),
  });

  return data.reply;
};
