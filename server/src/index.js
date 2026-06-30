import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { z } from "zod";
import { createDatabase } from "./storage.js";

/* ------------------ ENV ------------------ */

dotenv.config({ path: new URL("../.env", import.meta.url) });

const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET;
const DB_PATH = process.env.DB_PATH || "./data.db";
const GEMINI_MODELS = (process.env.GEMINI_MODELS || "gemini-2.5-flash,gemini-2.0-flash")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL ||
  "meta-llama/llama-3.2-11b-vision-instruct:free";
const HUGGINGFACE_VISION_MODEL =
  process.env.HUGGINGFACE_VISION_MODEL ||
  "Salesforce/blip-image-captioning-large";
const PROVIDER_CHECK_TIMEOUT_MS = Number(
  process.env.PROVIDER_CHECK_TIMEOUT_MS || 8000
);
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);
const UPLOADS_DIR = path.resolve(process.cwd(), "../uploads");

if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET is not set");
  process.exit(1);
}

/* ------------------ APP ------------------ */

const app = express();
const db = createDatabase(DB_PATH, { adminEmails: ADMIN_EMAILS });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

/* ------------------ CORS ------------------ */

const corsOrigins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || corsOrigins.includes("*") || corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    }
  })
);

app.use(express.json({ limit: "15mb" }));
app.use("/uploads", express.static(UPLOADS_DIR));

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase();
      cb(null, `${randomUUID()}${ext || ".jpg"}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image uploads are allowed"));
  },
});

/* ------------------ AUTH UTILS ------------------ */

const signToken = (user) =>
  jwt.sign(
    { sub: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

const getTokenFromHeader = (header = "") =>
  header.startsWith("Bearer ") ? header.slice(7) : null;
const getProviderKey = (req, headerName, envName) => {
  const headerValue = req.headers[headerName];
  if (typeof headerValue === "string" && headerValue.trim()) {
    return headerValue.trim();
  }
  return process.env[envName]?.trim() || "";
};
const getGeminiKeyFromRequest = (req) =>
  getProviderKey(req, "x-gemini-key", "GEMINI_API_KEY");
const getOpenRouterKeyFromRequest = (req) =>
  getProviderKey(req, "x-openrouter-key", "OPENROUTER_API_KEY");
const getHuggingFaceKeyFromRequest = (req) =>
  getProviderKey(req, "x-huggingface-key", "HUGGINGFACE_API_KEY");
const parseImagePayload = (imageBase64 = "") => {
  const match = /^data:(.*?);base64,(.*)$/i.exec(imageBase64);
  if (!match) {
    return { mimeType: "image/jpeg", data: imageBase64.trim() };
  }
  return {
    mimeType: match[1] || "image/jpeg",
    data: match[2] || "",
  };
};
const parseOpenRouterContent = (content) => {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";

  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (typeof part?.text === "string") return part.text;
      return "";
    })
    .join("\n")
    .trim();
};
const parseHuggingFaceCaption = (payload) => {
  if (Array.isArray(payload) && typeof payload[0]?.generated_text === "string") {
    return payload[0].generated_text.trim();
  }
  if (typeof payload?.generated_text === "string") {
    return payload.generated_text.trim();
  }
  if (Array.isArray(payload) && typeof payload[0] === "string") {
    return payload[0].trim();
  }
  return "";
};
const tryParseJson = (value) => {
  if (typeof value !== "string") return null;

  const trimmed = value.replace(/```json|```/g, "").trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
};
const normalizeTags = (tags) =>
  Array.from(
    new Set(
      Array.isArray(tags)
        ? tags
            .map((tag) => String(tag).trim())
            .filter(Boolean)
            .slice(0, 20)
        : []
    )
  );
const buildTaskPrompt = ({ task, prompt, hasImage }) => {
  const baseInstructions = hasImage
    ? "Analyze the provided image and return JSON only."
    : "Answer the request and return JSON only.";

  switch (task) {
    case "caption":
      return {
        systemPrompt: `${baseInstructions} Return {\"caption\": string, \"alternatives\": string[]}.`,
        userPrompt: prompt || "Write a concise, vivid caption.",
      };
    case "alt_text":
      return {
        systemPrompt: `${baseInstructions} Return {\"altText\": string, \"confidence\": number}.`,
        userPrompt: prompt || "Write accessible alt text that describes the image clearly.",
      };
    case "tags":
      return {
        systemPrompt: `${baseInstructions} Return {\"tags\": string[], \"summary\": string}.`,
        userPrompt: prompt || "Generate practical search tags for this image.",
      };
    case "ocr":
      return {
        systemPrompt: `${baseInstructions} Return {\"text\": string, \"confidence\": number, \"notes\": string}.`,
        userPrompt: prompt || "Extract visible text exactly as seen in the image.",
      };
    case "palette":
      return {
        systemPrompt: `${baseInstructions} Return {\"palette\": [{\"name\": string, \"hex\": string, \"usage\": string}]}.`,
        userPrompt: prompt || "Extract the dominant colors and describe their usage.",
      };
    case "quality":
      return {
        systemPrompt: `${baseInstructions} Return {\"score\": number, \"assessment\": string, \"improvements\": string[]}.`,
        userPrompt: prompt || "Assess technical image quality and suggest improvements.",
      };
    case "scene":
      return {
        systemPrompt: `${baseInstructions} Return {\"scene\": string, \"mood\": string, \"composition\": string}.`,
        userPrompt: prompt || "Describe the scene, mood, and composition.",
      };
    case "style":
      return {
        systemPrompt: `${baseInstructions} Return {\"style\": string, \"similarStyles\": string[], \"why\": string}.`,
        userPrompt: prompt || "Identify the visual style and comparable styles.",
      };
    case "prompt":
      return {
        systemPrompt: `${baseInstructions} Return {\"prompt\": string, \"negativePrompt\": string, \"variations\": string[]}.`,
        userPrompt: prompt || "Generate a production-quality creative prompt.",
      };
    case "enhance_prompt":
      return {
        systemPrompt: `${baseInstructions} Return {\"prompt\": string, \"improvements\": string[]}.`,
        userPrompt: prompt || "Improve the user's prompt while keeping intent intact.",
      };
    case "analysis":
    default:
      return {
        systemPrompt: `${baseInstructions} Return JSON with title, description, caption, tags, analysis, metadata, confidence, and recommendations.`,
        userPrompt: prompt || "Provide a detailed image analysis.",
      };
  }
};
const parseAiTaskResult = ({ task, text }) => {
  const parsed = tryParseJson(text);

  if (task === "caption") {
    const caption =
      typeof parsed?.caption === "string"
        ? parsed.caption.trim()
        : typeof text === "string"
          ? text.trim()
          : "";

    return {
      caption,
      alternatives: Array.isArray(parsed?.alternatives) ? parsed.alternatives.slice(0, 5) : [],
    };
  }

  if (task === "alt_text") {
    return {
      altText:
        typeof parsed?.altText === "string"
          ? parsed.altText.trim()
          : typeof text === "string"
            ? text.trim()
            : "",
      confidence: typeof parsed?.confidence === "number" ? parsed.confidence : 0.7,
    };
  }

  if (task === "tags") {
    return {
      tags: normalizeTags(parsed?.tags),
      summary: typeof parsed?.summary === "string" ? parsed.summary.trim() : "",
    };
  }

  if (task === "ocr") {
    return {
      text:
        typeof parsed?.text === "string"
          ? parsed.text.trim()
          : typeof text === "string"
            ? text.trim()
            : "",
      confidence: typeof parsed?.confidence === "number" ? parsed.confidence : 0.7,
      notes: typeof parsed?.notes === "string" ? parsed.notes.trim() : "",
    };
  }

  if (task === "palette") {
    return {
      palette: Array.isArray(parsed?.palette)
        ? parsed.palette
            .map((item) => ({
              name: typeof item?.name === "string" ? item.name.trim() : "",
              hex: typeof item?.hex === "string" ? item.hex.trim() : "",
              usage: typeof item?.usage === "string" ? item.usage.trim() : "",
            }))
            .filter((item) => item.name || item.hex)
            .slice(0, 8)
        : [],
    };
  }

  if (task === "quality") {
    return {
      score: typeof parsed?.score === "number" ? parsed.score : 0.7,
      assessment:
        typeof parsed?.assessment === "string" ? parsed.assessment.trim() : "",
      improvements: Array.isArray(parsed?.improvements) ? parsed.improvements.slice(0, 6) : [],
    };
  }

  if (task === "scene") {
    return {
      scene: typeof parsed?.scene === "string" ? parsed.scene.trim() : "",
      mood: typeof parsed?.mood === "string" ? parsed.mood.trim() : "",
      composition:
        typeof parsed?.composition === "string" ? parsed.composition.trim() : "",
    };
  }

  if (task === "style") {
    return {
      style: typeof parsed?.style === "string" ? parsed.style.trim() : "",
      similarStyles: Array.isArray(parsed?.similarStyles) ? parsed.similarStyles.slice(0, 6) : [],
      why: typeof parsed?.why === "string" ? parsed.why.trim() : "",
    };
  }

  if (task === "prompt") {
    return {
      prompt: typeof parsed?.prompt === "string" ? parsed.prompt.trim() : "",
      negativePrompt:
        typeof parsed?.negativePrompt === "string" ? parsed.negativePrompt.trim() : "",
      variations: Array.isArray(parsed?.variations) ? parsed.variations.slice(0, 5) : [],
    };
  }

  if (task === "enhance_prompt") {
    return {
      prompt: typeof parsed?.prompt === "string" ? parsed.prompt.trim() : "",
      improvements: Array.isArray(parsed?.improvements) ? parsed.improvements.slice(0, 5) : [],
    };
  }

  const analysis = parsed && typeof parsed === "object" ? parsed : null;
  return {
    title: typeof analysis?.title === "string" ? analysis.title.trim() : "Image",
    description:
      typeof analysis?.description === "string"
        ? analysis.description.trim()
        : typeof text === "string"
          ? text.trim()
          : "",
    caption:
      typeof analysis?.caption === "string"
        ? analysis.caption.trim()
        : typeof text === "string"
          ? text.split(".")[0].trim() + "."
          : "",
    tags: normalizeTags(analysis?.tags),
    metadata: analysis?.metadata && typeof analysis.metadata === "object" ? analysis.metadata : {},
    analysis: analysis?.analysis && typeof analysis.analysis === "object" ? analysis.analysis : {},
    confidence: typeof analysis?.confidence === "number" ? analysis.confidence : 0.7,
    recommendations: Array.isArray(analysis?.recommendations) ? analysis.recommendations.slice(0, 8) : [],
    raw: analysis ?? null,
  };
};
const callModelWithImage = async ({
  task,
  imagePayload,
  systemPrompt,
  userPrompt,
  geminiKey,
  providerErrors,
}) => {
  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  { text: `${systemPrompt}\n\n${userPrompt}` },
                  {
                    inline_data: {
                      mime_type: imagePayload.mimeType,
                      data: imagePayload.data,
                    },
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const rawText = await response.text().catch(() => "");
        providerErrors.push({ provider: "gemini", model, status: response.status, raw: rawText });
        continue;
      }

      const data = await response.json();
      const parts = data?.candidates?.[0]?.content?.parts;
      const text = Array.isArray(parts)
        ? parts.map((part) => part?.text || "").join("\n").trim()
        : "";

      if (!text) {
        providerErrors.push({ provider: "gemini", model, status: 502, raw: "Empty response text" });
        continue;
      }

      return parseAiTaskResult({ task, text });
    } catch (error) {
      providerErrors.push({
        provider: "gemini",
        model,
        status: 502,
        raw: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return null;
};
const callTextModel = async ({ task, systemPrompt, userPrompt, geminiKey, providerErrors }) => {
  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const rawText = await response.text().catch(() => "");
        providerErrors.push({ provider: "gemini", model, status: response.status, raw: rawText });
        continue;
      }

      const data = await response.json();
      const parts = data?.candidates?.[0]?.content?.parts;
      const text = Array.isArray(parts)
        ? parts.map((part) => part?.text || "").join("\n").trim()
        : "";

      if (!text) {
        providerErrors.push({ provider: "gemini", model, status: 502, raw: "Empty response text" });
        continue;
      }

      return parseAiTaskResult({ task, text });
    } catch (error) {
      providerErrors.push({
        provider: "gemini",
        model,
        status: 502,
        raw: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return null;
};
const runAiTask = async ({ req, task, imageBase64, prompt }) => {
  const geminiKey = getGeminiKeyFromRequest(req);
  const openRouterKey = getOpenRouterKeyFromRequest(req);
  const huggingFaceKey = getHuggingFaceKeyFromRequest(req);
  const providerErrors = [];

  const imagePayload = imageBase64 ? parseImagePayload(imageBase64) : null;
  if (imageBase64 && !imagePayload?.data) {
    return { error: { status: 400, message: "Invalid image data" } };
  }

  const imageRequiredTasks = new Set([
    "analysis",
    "caption",
    "alt_text",
    "tags",
    "ocr",
    "palette",
    "quality",
    "scene",
    "style",
  ]);

  if (imageRequiredTasks.has(task) && !imagePayload) {
    return { error: { status: 400, message: "Image data is required for this task" } };
  }

  const { systemPrompt, userPrompt } = buildTaskPrompt({
    task,
    prompt,
    hasImage: Boolean(imagePayload),
  });

  const textOnlyTasks = new Set(["prompt", "enhance_prompt"]);

  const tryGemini = async () => {
    if (!geminiKey) return null;
    return imagePayload
      ? callModelWithImage({ task, imagePayload, systemPrompt, userPrompt, geminiKey, providerErrors })
      : callTextModel({ task, systemPrompt, userPrompt, geminiKey, providerErrors });
  };

  const tryOpenRouter = async () => {
    if (!openRouterKey) return null;

    const imageDataUri = imagePayload
      ? `data:${imagePayload.mimeType};base64,${imagePayload.data}`
      : null;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openRouterKey}`,
          "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:5173",
          "X-Title": "Image Muse",
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            imageDataUri
              ? {
                  role: "user",
                  content: [
                    { type: "text", text: userPrompt },
                    {
                      type: "image_url",
                      image_url: {
                        url: imageDataUri,
                      },
                    },
                  ],
                }
              : { role: "user", content: userPrompt },
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const rawText = await response.text().catch(() => "");
        providerErrors.push({ provider: "openrouter", model: OPENROUTER_MODEL, status: response.status, raw: rawText });
        return null;
      }

      const data = await response.json();
      const text = parseOpenRouterContent(data?.choices?.[0]?.message?.content);

      if (!text) {
        providerErrors.push({ provider: "openrouter", model: OPENROUTER_MODEL, status: 502, raw: "Empty response text" });
        return null;
      }

      return parseAiTaskResult({ task, text });
    } catch (error) {
      providerErrors.push({ provider: "openrouter", model: OPENROUTER_MODEL, status: 502, raw: error instanceof Error ? error.message : String(error) });
      return null;
    }
  };

  const tryHuggingFace = async () => {
    if (!huggingFaceKey || !imagePayload || textOnlyTasks.has(task)) return null;

    try {
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${encodeURIComponent(HUGGINGFACE_VISION_MODEL)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${huggingFaceKey}`,
            "Content-Type": imagePayload.mimeType,
          },
          body: Buffer.from(imagePayload.data, "base64"),
        }
      );

      if (!response.ok) {
        const rawText = await response.text().catch(() => "");
        providerErrors.push({ provider: "huggingface", model: HUGGINGFACE_VISION_MODEL, status: response.status, raw: rawText });
        return null;
      }

      const data = await response.json();
      const caption = parseHuggingFaceCaption(data);
      if (!caption) {
        providerErrors.push({ provider: "huggingface", model: HUGGINGFACE_VISION_MODEL, status: 502, raw: JSON.stringify(data) });
        return null;
      }

      if (task === "caption") {
        return { caption, alternatives: [] };
      }

      if (task === "analysis") {
        return {
          title: "Image",
          description: caption,
          caption,
          tags: ["image", "caption"],
          metadata: {},
          analysis: { summary: caption },
          confidence: 0.55,
          recommendations: [],
        };
      }

      return null;
    } catch (error) {
      providerErrors.push({ provider: "huggingface", model: HUGGINGFACE_VISION_MODEL, status: 502, raw: error instanceof Error ? error.message : String(error) });
      return null;
    }
  };

  const providerResult = await tryGemini() || await tryOpenRouter() || await tryHuggingFace();

  if (!providerResult) {
    return {
      error: {
        status: providerErrors[0]?.status ?? 503,
        message: "AI providers unavailable",
        detail: JSON.stringify(providerErrors).slice(0, 4000),
      },
    };
  }

  return { result: providerResult };
};
const deriveAspectLabel = (metadata = {}) => {
  if (typeof metadata.width !== "number" || typeof metadata.height !== "number") return "unknown";
  const ratio = metadata.width / metadata.height;
  if (ratio > 1.5) return "landscape";
  if (ratio < 0.7) return "portrait";
  return "square";
};
const buildFallbackAnalysis = ({ fileName = "", metadata = {} } = {}) => {
  const stem = String(fileName || "untitled image")
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
  const title = stem
    ? stem.replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Untitled Image";
  const aspect = deriveAspectLabel(metadata);
  const tags = normalizeTags([
    "image",
    "upload",
    aspect,
    metadata.fileType?.includes("svg") ? "vector" : null,
    metadata.make,
    metadata.model,
    typeof metadata.iso === "number" && metadata.iso > 800 ? "low-light" : null,
  ]);
  const sizeLabel =
    typeof metadata.width === "number" && typeof metadata.height === "number"
      ? `${metadata.width} × ${metadata.height}`
      : "unknown dimensions";
  const cameraLabel =
    metadata.make && metadata.model ? `${metadata.make} ${metadata.model}` : "camera metadata unavailable";

  return {
    title,
    description: `AI analysis is temporarily unavailable. ${sizeLabel} image with ${aspect} composition and ${cameraLabel}.`,
    caption: `A ${aspect} image named ${title.toLowerCase()}.`,
    tags,
    analysis: {
      scene: `A ${aspect} composition with basic metadata extraction only.`,
      mood: aspect === "landscape" ? "open" : aspect === "portrait" ? "focused" : "balanced",
      lighting:
        typeof metadata.iso === "number" && metadata.iso > 800
          ? "Likely low-light or high-sensitivity capture."
          : "Lighting could not be inferred without a vision model.",
      style: metadata.fileType?.includes("svg") ? "vector illustration" : "general image",
      objects: [],
      colors: [],
      text: "",
      quality:
        typeof metadata.width === "number" && typeof metadata.height === "number"
          ? `${metadata.width} × ${metadata.height} source image`
          : "unknown",
      improvements: [
        "Run a vision model when Gemini or a fallback provider is available.",
        "Add OCR or accessibility text if the image contains embedded text.",
      ],
    },
    metadata,
    confidence: 0.35,
    recommendations: [
      "Retry analysis when a model provider is configured.",
      "Review metadata for manual tagging and captioning.",
    ],
    fallback: true,
  };
};
const createCaptionFallback = () => ({
  caption: "A freshly uploaded image.",
  fallback: true,
});
const fetchWithTimeout = async (url, options = {}, timeoutMs = PROVIDER_CHECK_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
};
const readResponseBody = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const payload = await response.json().catch(() => null);
    return payload;
  }

  return await response.text().catch(() => "");
};
const toDetailString = (payload) => {
  if (typeof payload === "string") {
    return payload.slice(0, 300);
  }

  if (payload && typeof payload === "object") {
    return JSON.stringify(payload).slice(0, 300);
  }

  return "";
};
const providerStatusFromHttpCode = (statusCode) => {
  if (statusCode >= 200 && statusCode < 300) return "ok";
  if (statusCode === 401 || statusCode === 403) return "unauthorized";
  if (statusCode === 429) return "rate_limited";
  if (statusCode >= 500) return "provider_error";
  return "request_failed";
};
const checkProvider = async ({ id, enabled, fallbackModels, checker }) => {
  const checkedAt = new Date().toISOString();

  if (!enabled) {
    return {
      id,
      enabled: false,
      reachable: false,
      status: "missing_api_key",
      statusCode: null,
      latencyMs: null,
      checkedAt,
      models: fallbackModels,
    };
  }

  const startedAt = Date.now();

  try {
    const result = await checker();
    return {
      id,
      enabled: true,
      reachable: Boolean(result.reachable),
      status: result.status || "request_failed",
      statusCode: result.statusCode ?? null,
      latencyMs: Date.now() - startedAt,
      checkedAt,
      models: Array.isArray(result.models) && result.models.length ? result.models : fallbackModels,
      detail: result.detail || undefined,
    };
  } catch (error) {
    return {
      id,
      enabled: true,
      reachable: false,
      status: "request_failed",
      statusCode: null,
      latencyMs: Date.now() - startedAt,
      checkedAt,
      models: fallbackModels,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
};
const checkGeminiProvider = async (apiKey) => {
  const response = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1/models?key=${encodeURIComponent(apiKey)}`,
    {
      headers: { Accept: "application/json" },
    }
  );

  const payload = await readResponseBody(response);

  if (!response.ok) {
    return {
      reachable: false,
      status: providerStatusFromHttpCode(response.status),
      statusCode: response.status,
      detail: toDetailString(payload),
      models: GEMINI_MODELS,
    };
  }

  const discoveredModels = Array.isArray(payload?.models)
    ? payload.models
        .map((model) => String(model?.name || "").replace(/^models\//, ""))
        .filter((model) => model.includes("gemini"))
        .slice(0, 10)
    : [];

  return {
    reachable: true,
    status: "ok",
    statusCode: response.status,
    detail: `models_discovered=${discoveredModels.length}`,
    models: discoveredModels.length ? discoveredModels : GEMINI_MODELS,
  };
};
const checkOpenRouterProvider = async (apiKey) => {
  const response = await fetchWithTimeout("https://openrouter.ai/api/v1/models", {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const payload = await readResponseBody(response);

  if (!response.ok) {
    return {
      reachable: false,
      status: providerStatusFromHttpCode(response.status),
      statusCode: response.status,
      detail: toDetailString(payload),
      models: [OPENROUTER_MODEL],
    };
  }

  const discoveredModels = Array.isArray(payload?.data)
    ? payload.data
        .map((model) => String(model?.id || "").trim())
        .filter(Boolean)
        .slice(0, 10)
    : [];

  return {
    reachable: true,
    status: "ok",
    statusCode: response.status,
    detail: `models_discovered=${discoveredModels.length}`,
    models: discoveredModels.length ? discoveredModels : [OPENROUTER_MODEL],
  };
};
const checkHuggingFaceProvider = async (apiKey) => {
  const response = await fetchWithTimeout("https://huggingface.co/api/whoami-v2", {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const payload = await readResponseBody(response);

  if (!response.ok) {
    return {
      reachable: false,
      status: providerStatusFromHttpCode(response.status),
      statusCode: response.status,
      detail: toDetailString(payload),
      models: [HUGGINGFACE_VISION_MODEL],
    };
  }

  const accountName =
    typeof payload?.name === "string" && payload.name.trim()
      ? payload.name.trim()
      : "verified";

  return {
    reachable: true,
    status: "ok",
    statusCode: response.status,
    detail: `token_owner=${accountName}`,
    models: [HUGGINGFACE_VISION_MODEL],
  };
};

const authMiddleware = (req, res, next) => {
  const token = getTokenFromHeader(req.headers.authorization || "");

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.getUserById(payload.sub);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

const optionalAuthMiddleware = (req, _res, next) => {
  const token = getTokenFromHeader(req.headers.authorization || "");

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.getUserById(payload.sub);
    req.user = user || null;
  } catch {
    req.user = null;
  }

  next();
};

const adminMiddleware = (req, res, next) => {
  if (!req.user?.is_admin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  return next();
};

/* ------------------ HEALTH ------------------ */

app.get("/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

/* ------------------ AUTH ------------------ */

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

app.post("/auth/signup", async (req, res) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  const { email, password } = parsed.data;

  if (db.getUserByEmail(email)) {
    return res.status(409).json({ error: "Email already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = db.createUser({ email, passwordHash });
  const token = signToken(user);

  res.status(201).json({
    user: db.toClientUser(user),
    token,
  });
});

app.post("/auth/signin", async (req, res) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();
  const user = db.getUserByEmail(normalizedEmail);

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const updated = db.updateUser(user.id, {
    lastSignInAt: new Date().toISOString(),
  });

  res.json({
    user: db.toClientUser(updated),
    token: signToken(updated),
  });
});

app.get("/auth/me", authMiddleware, (req, res) => {
  res.json({ user: db.toClientUser(req.user) });
});

app.patch("/auth/profile", authMiddleware, (req, res) => {
  const schema = z.object({
    full_name: z.string().min(1).max(120).optional().nullable(),
    avatar_url: z.string().url().optional().nullable(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid profile data" });
  }

  const updated = db.updateUser(req.user.id, {
    fullName: parsed.data.full_name ?? undefined,
    avatarUrl: parsed.data.avatar_url ?? undefined,
  });

  res.json({ user: db.toClientUser(updated) });
});

app.post("/auth/signout", (_req, res) => {
  res.status(204).send();
});

/* ------------------ UPLOADS ------------------ */

app.post("/uploads", authMiddleware, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file provided" });
  }

  const url = `/uploads/${req.file.filename}`;

  return res.status(201).json({
    url,
    file_path: req.file.path,
  });
});

app.post("/uploads/sign-urls", authMiddleware, (req, res) => {
  const schema = z.object({
    paths: z.array(z.string().min(1)).default([]),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid upload paths" });
  }

  const urls = Object.fromEntries(
    parsed.data.paths
      .filter((pathValue) => pathValue.startsWith("/uploads/"))
      .map((pathValue) => [pathValue, pathValue])
  );

  return res.json({ urls });
});

/* ------------------ IMAGES ------------------ */

const imageSchema = z.object({
  name: z.string().min(1),
  url: z.string().min(1),
  file_path: z.string().nullable().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  caption: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

const imageUpdateSchema = imageSchema.partial();

app.get("/images", authMiddleware, (req, res) => {
  const images = db.listImagesByUser(req.user.id);
  res.json({ images });
});

app.post("/images", authMiddleware, (req, res) => {
  const parsed = imageSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid image payload" });
  }

  const image = db.createImage(req.user.id, parsed.data);
  return res.status(201).json({ image });
});

app.patch("/images/:id", authMiddleware, (req, res) => {
  const parsed = imageUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid image update payload" });
  }

  const image = db.updateImage(req.params.id, req.user.id, parsed.data);

  if (!image) {
    return res.status(404).json({ error: "Image not found" });
  }

  return res.json({ image });
});

app.delete("/images/:id", authMiddleware, (req, res) => {
  const deleted = db.deleteImage(req.params.id, req.user.id);

  if (!deleted) {
    return res.status(404).json({ error: "Image not found" });
  }

  return res.status(204).send();
});

app.post("/images/bulk-delete", authMiddleware, (req, res) => {
  const schema = z.object({
    ids: z.array(z.string()).optional(),
    all: z.boolean().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid bulk delete payload" });
  }

  const removed = db.bulkDeleteImages(
    req.user.id,
    parsed.data.ids ?? [],
    Boolean(parsed.data.all)
  );

  return res.json({ removed });
});

/* ------------------ FAVORITES ------------------ */

app.get("/favorites", authMiddleware, (req, res) => {
  const images = db.listFavorites(req.user.id);
  return res.json({ images });
});

app.post("/favorites/:imageId", authMiddleware, (req, res) => {
  const image = db.getImageById(req.params.imageId);

  if (!image || image.user_id !== req.user.id) {
    return res.status(404).json({ error: "Image not found" });
  }

  db.addFavorite(req.user.id, req.params.imageId);
  return res.status(204).send();
});

app.delete("/favorites/:imageId", authMiddleware, (req, res) => {
  db.removeFavorite(req.user.id, req.params.imageId);
  return res.status(204).send();
});

/* ------------------ SETTINGS ------------------ */

const settingsSchema = z.object({
  autoAnalyze: z.boolean().optional(),
  defaultSort: z.enum(["newest", "oldest", "title", "size"]).optional(),
  watermarkText: z.string().optional(),
  showMetadata: z.boolean().optional(),
});

app.get("/settings", authMiddleware, (req, res) => {
  const settings = db.getSettings(req.user.id);
  return res.json({ settings });
});

app.patch("/settings", authMiddleware, (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid settings payload" });
  }

  const settings = db.updateSettings(req.user.id, parsed.data);
  return res.json({ settings });
});

/* ------------------ LOGS ------------------ */

app.get("/logs", authMiddleware, (req, res) => {
  const limit = Number(req.query.limit || 100);
  const logs = db.listAiLogs({ userId: req.user.id, limit });
  return res.json({ logs });
});

/* ------------------ ADMIN ------------------ */

app.get("/admin/stats", authMiddleware, adminMiddleware, (_req, res) => {
  return res.json(db.getAdminStats());
});

app.get("/admin/users", authMiddleware, adminMiddleware, (req, res) => {
  const limit = Number(req.query.limit || 50);
  return res.json({ users: db.listUsers(limit) });
});

app.get("/admin/logs", authMiddleware, adminMiddleware, (req, res) => {
  const limit = Number(req.query.limit || 200);
  return res.json({ logs: db.listAiLogs({ limit }) });
});

/* ------------------ AI IMAGE ------------------ */
app.get("/ai/providers", optionalAuthMiddleware, async (req, res) => {
  const geminiKey = getGeminiKeyFromRequest(req);
  const openRouterKey = getOpenRouterKeyFromRequest(req);
  const huggingFaceKey = getHuggingFaceKeyFromRequest(req);

  const [gemini, openrouter, huggingface] = await Promise.all([
    checkProvider({
      id: "gemini",
      enabled: Boolean(geminiKey),
      fallbackModels: GEMINI_MODELS,
      checker: () => checkGeminiProvider(geminiKey),
    }),
    checkProvider({
      id: "openrouter",
      enabled: Boolean(openRouterKey),
      fallbackModels: [OPENROUTER_MODEL],
      checker: () => checkOpenRouterProvider(openRouterKey),
    }),
    checkProvider({
      id: "huggingface",
      enabled: Boolean(huggingFaceKey),
      fallbackModels: [HUGGINGFACE_VISION_MODEL],
      checker: () => checkHuggingFaceProvider(huggingFaceKey),
    }),
  ]);

  const providers = [
    gemini,
    openrouter,
    huggingface,
  ];

  res.json({ providers, checkedAt: new Date().toISOString() });
});

const analyzeSchema = z.object({
  imageBase64: z.string().min(1).optional(),
  type: z.enum(["analyze", "regenerate_caption"]).optional(),
  task: z.enum([
    "analysis",
    "caption",
    "alt_text",
    "tags",
    "ocr",
    "palette",
    "quality",
    "scene",
    "style",
    "prompt",
    "enhance_prompt",
  ]).optional(),
  prompt: z.string().optional(),
  fileName: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

app.post("/analyze-image", optionalAuthMiddleware, async (req, res) => {
  const parsed = analyzeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Image data is required" });
  }

  const { imageBase64, type = "analyze", task, prompt, fileName, metadata } = parsed.data;
  const normalizedTask =
    task || (type === "regenerate_caption" ? "caption" : "analysis");
  const runResult = await runAiTask({
    req,
    task: normalizedTask,
    imageBase64,
    prompt,
  });

  if (runResult.error) {
    db.createAiLog({
      userId: req.user?.id ?? null,
      type: task || type,
      statusCode: runResult.error.status,
      message: runResult.error.message,
      raw: runResult.error.detail || null,
    });

    if (normalizedTask === "analysis") {
      return res.json(buildFallbackAnalysis({ fileName, metadata }));
    }

    if (normalizedTask === "caption") {
      return res.json(createCaptionFallback());
    }

    return res.status(runResult.error.status).json({ error: runResult.error.message });
  }

  const result = runResult.result;

  if (!result) {
    return res.status(502).json({ error: "Empty AI response" });
  }

  if (normalizedTask === "analysis") {
    const analysis = {
      title: result.title || "Image",
      description: result.description || "",
      caption: result.caption || "",
      tags: normalizeTags(result.tags),
      metadata: result.metadata || {},
      analysis: result.analysis || {},
      confidence: typeof result.confidence === "number" ? result.confidence : 0.7,
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
      raw: result.raw || null,
    };

    return res.json(analysis);
  }

  if (normalizedTask === "caption") {
    return res.json({ caption: result.caption || result.prompt || "" });
  }

  return res.json(result);
});

app.post("/ai/workspace", optionalAuthMiddleware, async (req, res) => {
  const parsed = z.object({
    task: z.enum([
      "analysis",
      "caption",
      "alt_text",
      "tags",
      "ocr",
      "palette",
      "quality",
      "scene",
      "style",
      "prompt",
      "enhance_prompt",
    ]),
    imageBase64: z.string().min(1).optional(),
    prompt: z.string().optional(),
  }).safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid AI workspace payload" });
  }

  const runResult = await runAiTask({
    req,
    task: parsed.data.task,
    imageBase64: parsed.data.imageBase64,
    prompt: parsed.data.prompt,
  });

  if (runResult.error) {
    db.createAiLog({
      userId: req.user?.id ?? null,
      type: parsed.data.task,
      statusCode: runResult.error.status,
      message: runResult.error.message,
      raw: runResult.error.detail || null,
    });

    return res.status(runResult.error.status).json({ error: runResult.error.message });
  }

  return res.json(runResult.result);
});

/* ------------------ ERROR HANDLER ------------------ */

app.use((err, _req, res, _next) => {
  console.error("Server error:", err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  return res.status(500).json({ error: "Internal server error" });
});

/* ------------------ START ------------------ */

const server = app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});

server.on("error", (error) => {
  if (error?.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the process on that port or change PORT in server/.env.`
    );
    process.exit(1);
  }

  console.error("Failed to start backend:", error);
  process.exit(1);
});
