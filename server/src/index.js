import express from "express";
import cors from "cors";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import multer from "multer";
import { createDatabase } from "./storage.js";

const envPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.env"
);
dotenv.config({ path: envPath });

const app = express();
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === "change-me") {
  console.error("FATAL: JWT_SECRET must be set to a secure random value. Generate one with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"");
  process.exit(1);
}

if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set. /analyze-image will return 503.");
}

const db = createDatabase(process.env.DB_PATH || "./data.db");

const validateOrigin = (origin) => {
  if (origin === "*") return false;
  try {
    const url = new URL(origin);
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
      console.warn(`CORS: Rejecting non-HTTPS origin in production: ${origin}`);
      return false;
    }
    return true;
  } catch {
    console.warn(`CORS: Rejecting invalid origin: ${origin}`);
    return false;
  }
};

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean).filter(validateOrigin)
  : ["http://localhost:8080", "http://localhost:5173", "http://localhost:3000"];

if (corsOrigins.length === 0) {
  console.error("FATAL: No valid CORS origins configured. Set CORS_ORIGIN env var.");
  process.exit(1);
}

console.log("CORS enabled for origins:", corsOrigins);

app.use(
  cors({
    origin: corsOrigins,
  })
);

// Rate limiters for sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: "Too many authentication attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn("Rate limit exceeded:", { ip: req.ip, path: req.path });
    res.status(429).json({ error: "Too many authentication attempts. Please try again later." });
  },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  message: { error: "Rate limit exceeded for AI services. Please try again shortly." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn("AI rate limit exceeded:", { ip: req.ip, path: req.path });
    res.status(429).json({ error: "Rate limit exceeded for AI services. Please try again shortly." });
  },
});

const uploadRoot = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

const uploadStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const userId = req.user?.id || "anonymous";
    const userDir = path.join(uploadRoot, userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const safeName = `${crypto.randomBytes(32).toString("hex")}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image uploads are allowed."));
    }
  },
});

// Serve uploads with short-lived, file-specific signed tokens
app.get("/uploads/:userId/:filename", (req, res) => {
  const { userId, filename } = req.params;
  const token = req.query.token;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Verify the token is a file-specific token for this exact path
  const expectedFile = `${userId}/${filename}`;
  if (payload.file !== expectedFile) {
    return res.status(403).json({ error: "Access denied" });
  }

  const safeName = path.basename(filename);
  const filePath = path.join(uploadRoot, userId, safeName);

  if (!filePath.startsWith(uploadRoot)) {
    return res.status(400).json({ error: "Invalid file path" });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.sendFile(filePath);
});

// Endpoint to generate short-lived signed URLs for images
app.post("/uploads/sign-urls", authMiddleware, (req, res) => {
  const { paths } = req.body;
  if (!Array.isArray(paths)) {
    return res.status(400).json({ error: "paths array is required" });
  }

  const signed = {};
  for (const filePath of paths) {
    if (typeof filePath !== "string") continue;
    // Extract userId from path like "/uploads/userId/filename"
    const match = filePath.match(/^\/uploads\/([^/]+)\/([^/]+)$/);
    if (!match) continue;
    const [, fileUserId, fileName] = match;
    // Only sign URLs for files the user owns (or admin)
    if (req.user.id !== fileUserId && !req.user.is_admin) continue;
    const fileToken = jwt.sign(
      { sub: req.user.id, file: `${fileUserId}/${fileName}` },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    signed[filePath] = `/uploads/${fileUserId}/${fileName}?token=${encodeURIComponent(fileToken)}`;
  }

  return res.json({ urls: signed });
});

const signToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.getUserById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

const tryGetUserFromAuth = (req) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return db.getUserById(payload.sub);
  } catch {
    return null;
  }
};

const adminMiddleware = (req, res, next) => {
  if (!req.user?.is_admin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  return next();
};

app.get("/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

app.post("/auth/signup", authLimiter, async (req, res) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  const { email, password } = parsed.data;
  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: "Email already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();

  const user = db.createUser({
    email,
    passwordHash,
    createdAt: now,
    lastSignInAt: now,
  });

  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const finalUser =
    adminEmails.length > 0 && adminEmails.includes(email.toLowerCase())
      ? db.updateUser(user.id, { isAdmin: true })
      : user;

  const token = signToken(finalUser);

  return res.status(201).json({
    user: db.toClientUser(finalUser),
    token,
  });
});

app.post("/auth/signin", authLimiter, async (req, res) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  const { email, password } = parsed.data;
  const user = db.getUserByEmail(email);
  // Always run bcrypt compare to prevent timing-based user enumeration
  const hash = user?.password_hash || "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012";
  const isValid = await bcrypt.compare(password, hash);

  if (!user || !isValid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const updated = db.updateUser(user.id, {
    lastSignInAt: new Date().toISOString(),
  });

  const token = signToken(updated);
  return res.json({
    user: db.toClientUser(updated),
    token,
  });
});

app.get("/auth/me", authMiddleware, (req, res) => {
  return res.json({ user: db.toClientUser(req.user) });
});

const profileSchema = z.object({
  full_name: z.string().min(1).max(120).optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
});

app.patch("/auth/profile", authMiddleware, (req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid profile data" });
  }

  const updated = db.updateUser(req.user.id, {
    fullName: parsed.data.full_name ?? undefined,
    avatarUrl: parsed.data.avatar_url ?? undefined,
  });

  return res.json({ user: db.toClientUser(updated) });
});

app.post("/auth/signout", (_req, res) => {
  return res.status(204).send();
});

app.post("/uploads", authMiddleware, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Image file is required" });
  }

  const relative = path
    .relative(uploadRoot, req.file.path)
    .split(path.sep)
    .join("/");
  const url = `/uploads/${relative}`;

  return res.status(201).json({
    url,
    file_path: req.file.path,
    name: req.file.originalname,
    size: req.file.size,
    mime_type: req.file.mimetype,
  });
});

const getGeminiKey = (req) => {
  const headerKey = req.headers["x-gemini-key"];
  if (typeof headerKey === "string" && headerKey.trim()) {
    return headerKey.trim();
  }
  return process.env.GEMINI_API_KEY;
};

const logAiError = (req, { type, statusCode, message, raw }) => {
  const user = tryGetUserFromAuth(req);
  db.createAiLog({
    userId: user?.id ?? null,
    type,
    statusCode,
    message,
    raw,
  });
};

const analyzeSchema = z.object({
  imageBase64: z.string().min(1),
  type: z.enum(["analyze", "regenerate_caption"]).optional(),
});

app.post("/analyze-image", authMiddleware, aiLimiter, async (req, res) => {
  const parsed = analyzeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Image data is required" });
  }

  const { imageBase64, type = "analyze" } = parsed.data;

  // Validate base64 image size (max ~10MB)
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
  if (imageBase64.length > MAX_IMAGE_SIZE) {
    return res.status(400).json({ error: "Image too large. Maximum size is 10MB." });
  }

  // Validate base64 image format
  const base64FormatRegex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
  if (imageBase64.includes(",") && !base64FormatRegex.test(imageBase64)) {
    return res.status(400).json({ error: "Invalid image format." });
  }

  const geminiKey = getGeminiKey(req);

  if (!geminiKey) {
    logAiError(req, {
      type: "analyze-image",
      statusCode: 503,
      message: "GEMINI_API_KEY is not configured",
    });
    return res.status(503).json({
      error: "GEMINI_API_KEY is not configured",
      fallback: true,
    });
  }

  let systemPrompt = "";
  let userPrompt = "";

  if (type === "analyze") {
    systemPrompt = `You are an expert image analyst. Analyze the provided image and return a JSON object with these fields:
- title: A short, catchy title for the image (max 8 words)
- description: A detailed description of what's in the image (2-3 sentences)
- caption: A creative caption suitable for social media (1 sentence)
- tags: An array of 3-6 relevant tags describing the content
- metadata: An object with any of these keys if inferable: iso, fNumber, shutterSpeed, camera, lens, dimensions, dateTime
- analysis: An object with keys: composition, sentiment

Return ONLY valid JSON, no markdown formatting.`;
    userPrompt = "Analyze this image and provide the title, description, caption, and tags.";
  } else {
    systemPrompt =
      "You are a creative caption writer. Generate a fresh, engaging caption for social media based on the image. Return ONLY the caption text, nothing else.";
    userPrompt = "Generate a new creative caption for this image.";
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: `${systemPrompt}\n\n${userPrompt}` },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: imageBase64.includes(",")
                    ? imageBase64.split(",")[1]
                    : imageBase64,
                },
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI gateway error:", response.status, errorText);
    logAiError(req, {
      type: "analyze-image",
      statusCode: response.status,
      message: "AI gateway error",
      raw: errorText,
    });

    return res.status(503).json({
      error: "Analysis service temporarily unavailable. Please try again later.",
    });
  }

  const data = await response.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    return res.status(502).json({ error: "No response from AI service" });
  }

  if (type === "analyze") {
    try {
      let cleaned = String(content).trim();
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.slice(7);
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.slice(3);
      }
      if (cleaned.endsWith("```")) {
        cleaned = cleaned.slice(0, -3);
      }
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      const jsonSlice =
        start !== -1 && end !== -1 ? cleaned.slice(start, end + 1) : cleaned;
      const result = JSON.parse(jsonSlice.trim());
      return res.json(result);
    } catch (error) {
      return res.json({
        title: "Image Analysis",
        description: content,
        caption: String(content).split(".")[0] + ".",
        tags: ["photo", "image"],
        metadata: {},
        analysis: {},
      });
    }
  }

  return res.json({ caption: String(content).trim() });
});

const imageCreateSchema = z.object({
  name: z.string().min(1),
  url: z.string().min(1),
  file_path: z.string().optional().nullable(),
  title: z.string().optional(),
  description: z.string().optional(),
  caption: z.string().optional(),
  metadata: z.record(z.any()).optional().nullable(),
  tags: z.array(z.string()).optional(),
});

const imageUpdateSchema = z.object({
  name: z.string().optional(),
  url: z.string().optional(),
  file_path: z.string().optional().nullable(),
  title: z.string().optional(),
  description: z.string().optional(),
  caption: z.string().optional(),
  metadata: z.record(z.any()).optional().nullable(),
  tags: z.array(z.string()).optional(),
});

app.get("/images", authMiddleware, (req, res) => {
  const images = db.listImages(req.user.id);
  return res.json({ images });
});

app.get("/images/:id", authMiddleware, (req, res) => {
  const image = db.getImageById(req.user.id, req.params.id);
  if (!image) {
    return res.status(404).json({ error: "Image not found" });
  }
  return res.json({ image: db.toClientImage(image) });
});

app.post("/images", authMiddleware, (req, res) => {
  const parsed = imageCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid image payload" });
  }

  const { name, url, file_path, title, description, caption, metadata, tags } =
    parsed.data;

  const image = db.createImage(req.user.id, {
    name,
    url,
    file_path: file_path ?? null,
    title: title ?? name,
    description: description ?? "No description available.",
    caption: caption ?? "",
    metadata: metadata ?? {},
    tags: tags ?? [],
  });

  return res.status(201).json({ image: db.toClientImage(image) });
});

app.patch("/images/:id", authMiddleware, (req, res) => {
  const parsed = imageUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid image payload" });
  }

  const updated = db.updateImage(req.user.id, req.params.id, parsed.data);
  if (!updated) {
    return res.status(404).json({ error: "Image not found" });
  }

  return res.json({ image: db.toClientImage(updated) });
});

app.delete("/images/:id", authMiddleware, (req, res) => {
  const image = db.getImageById(req.user.id, req.params.id);
  if (!image) {
    return res.status(404).json({ error: "Image not found" });
  }
  db.deleteImage(req.user.id, req.params.id);
  if (image.file_path && fs.existsSync(image.file_path)) {
    try {
      fs.unlinkSync(image.file_path);
    } catch (error) {
      console.error("Failed to delete file:", error);
    }
  }
  return res.status(204).send();
});

const settingsSchema = z.object({
  autoAnalyze: z.boolean().optional(),
  defaultSort: z.enum(["newest", "oldest", "title", "size"]).optional(),
  watermarkText: z.string().max(120).optional(),
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

const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).optional(),
  all: z.boolean().optional(),
});

app.post("/images/bulk-delete", authMiddleware, (req, res) => {
  const parsed = bulkDeleteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid bulk delete payload" });
  }

  const { ids = [], all = false } = parsed.data;
  let targetImages = [];

  if (all) {
    targetImages = db.listImageFilesByUser(req.user.id);
    db.deleteAllImages(req.user.id);
  } else if (ids.length) {
    targetImages = db.listImagesByIds(req.user.id, ids).map((img) => ({
      id: img.id,
      file_path: img.file_path,
    }));
    db.deleteImagesByIds(req.user.id, ids);
  } else {
    return res.status(400).json({ error: "No images selected for deletion" });
  }

  targetImages.forEach((img) => {
    if (img.file_path && fs.existsSync(img.file_path)) {
      try {
        fs.unlinkSync(img.file_path);
      } catch (error) {
        console.error("Failed to delete file:", error);
      }
    }
  });

  return res.status(204).send();
});

app.get("/favorites", authMiddleware, (req, res) => {
  const images = db.listFavorites(req.user.id);
  return res.json({ images });
});

app.post("/favorites/:imageId", authMiddleware, (req, res) => {
  const image = db.getImageById(req.user.id, req.params.imageId);
  if (!image) {
    return res.status(404).json({ error: "Image not found" });
  }
  db.addFavorite(req.user.id, req.params.imageId);
  return res.status(204).send();
});

app.delete("/favorites/:imageId", authMiddleware, (req, res) => {
  db.removeFavorite(req.user.id, req.params.imageId);
  return res.status(204).send();
});

app.get("/logs", authMiddleware, (req, res) => {
  const limit = Number(req.query.limit || 100);
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 500) : 100;
  const logs = db.listAiLogs(req.user.id, safeLimit);
  return res.json({ logs });
});

app.get("/admin/stats", authMiddleware, adminMiddleware, (_req, res) => {
  return res.json({
    users: db.countUsers(),
    images: db.countImages(),
    favorites: db.countFavorites(),
    ai_logs: db.countAiLogs(),
  });
});

app.get("/admin/users", authMiddleware, adminMiddleware, (req, res) => {
  const limit = Number(req.query.limit || 50);
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : 50;
  const users = db.listUsers(safeLimit);
  return res.json({ users });
});

app.get("/admin/logs", authMiddleware, adminMiddleware, (req, res) => {
  const limit = Number(req.query.limit || 200);
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 500) : 200;
  const logs = db.listAllAiLogs(safeLimit);
  return res.json({ logs });
});

const chatSchema = z.object({
  message: z.string().min(1),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "ai"]),
        content: z.string().min(1),
      })
    )
    .optional(),
});

app.post("/ai-chat", authMiddleware, aiLimiter, async (req, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid chat payload" });
  }

  const geminiKey = getGeminiKey(req);
  if (!geminiKey) {
    logAiError(req, {
      type: "ai-chat",
      statusCode: 503,
      message: "GEMINI_API_KEY is not configured",
    });
    return res.status(503).json({
      error: "GEMINI_API_KEY is not configured",
      fallback: true,
    });
  }

  const systemPrompt =
    "You are Image Muse, a friendly AI assistant for an image gallery app. Be concise, helpful, and practical.";

  const history = parsed.data.history ?? [];
  const contents = history.map((msg) => ({
    role: msg.role === "ai" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  contents.push({
    role: "user",
    parts: [{ text: parsed.data.message }],
  });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: systemPrompt }],
          },
          ...contents,
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI gateway error:", response.status, errorText);
    logAiError(req, {
      type: "ai-chat",
      statusCode: response.status,
      message: "AI gateway error",
      raw: errorText,
    });

    return res.status(503).json({
      error: "AI service temporarily unavailable. Please try again later.",
    });
  }

  const data = await response.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    logAiError(req, {
      type: "ai-chat",
      statusCode: 502,
      message: "No response from AI service",
    });
    return res.status(502).json({ error: "No response from AI service" });
  }

  return res.json({ reply: String(content).trim() });
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled server error:", err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  return res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
