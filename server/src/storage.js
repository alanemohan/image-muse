import Database from "better-sqlite3";
import { randomUUID } from "crypto";

export const createDatabase = (dbPath) => {
  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");

  const ensureColumn = (table, column, definition) => {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all();
    if (!columns.some((col) => col.name === column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  };

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      avatar_url TEXT,
      created_at TEXT NOT NULL,
      last_sign_in_at TEXT,
      is_admin INTEGER DEFAULT 0
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      caption TEXT NOT NULL,
      url TEXT NOT NULL,
      file_path TEXT,
      metadata TEXT,
      tags TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      user_id TEXT NOT NULL,
      image_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, image_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(image_id) REFERENCES images(id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      prefs TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      type TEXT NOT NULL,
      status_code INTEGER,
      message TEXT,
      raw TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON ai_logs(user_id);
  `);

  ensureColumn("users", "is_admin", "INTEGER DEFAULT 0");
  ensureColumn("images", "file_path", "TEXT");

  const getUserById = (id) =>
    db.prepare("SELECT * FROM users WHERE id = ?").get(id);

  const getUserByEmail = (email) =>
    db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  const createUser = ({ email, passwordHash, createdAt, lastSignInAt }) => {
    const user = {
      id: randomUUID(),
      email,
      password_hash: passwordHash,
      full_name: null,
      avatar_url: null,
      created_at: createdAt,
      last_sign_in_at: lastSignInAt,
      is_admin: 0,
    };

    db.prepare(
      `INSERT INTO users (id, email, password_hash, full_name, avatar_url, created_at, last_sign_in_at)
       VALUES (@id, @email, @password_hash, @full_name, @avatar_url, @created_at, @last_sign_in_at)`
    ).run(user);

    return user;
  };

  const updateUser = (id, { fullName, avatarUrl, lastSignInAt, isAdmin }) => {
    const existing = getUserById(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      full_name: fullName !== undefined ? fullName : existing.full_name,
      avatar_url: avatarUrl !== undefined ? avatarUrl : existing.avatar_url,
      last_sign_in_at: lastSignInAt ?? existing.last_sign_in_at,
      is_admin: isAdmin !== undefined ? (isAdmin ? 1 : 0) : existing.is_admin,
    };

    db.prepare(
      `UPDATE users
       SET full_name = @full_name,
           avatar_url = @avatar_url,
           last_sign_in_at = @last_sign_in_at,
           is_admin = @is_admin
       WHERE id = @id`
    ).run(updated);

    return updated;
  };

  const toClientUser = (user) => ({
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    avatar_url: user.avatar_url,
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at,
    is_admin: Boolean(user.is_admin),
  });

  const SETTINGS_DEFAULTS = {
    autoAnalyze: true,
    defaultSort: "newest",
    watermarkText: "",
    showMetadata: true,
  };

  const safeJsonParse = (value, fallback) => {
    if (!value) return fallback;
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  };

  const toClientImage = (image) => ({
    id: image.id,
    name: image.name,
    title: image.title,
    description: image.description,
    caption: image.caption,
    url: image.url,
    metadata: safeJsonParse(image.metadata, {}),
    tags: safeJsonParse(image.tags, []),
    created_at: image.created_at,
    updated_at: image.updated_at,
  });

  const listImages = (userId) =>
    db
      .prepare("SELECT * FROM images WHERE user_id = ? ORDER BY created_at DESC")
      .all(userId)
      .map(toClientImage);

  const getImageById = (userId, id) =>
    db
      .prepare("SELECT * FROM images WHERE user_id = ? AND id = ?")
      .get(userId, id);

  const createImage = (userId, payload) => {
    const now = new Date().toISOString();
    const image = {
      id: randomUUID(),
      user_id: userId,
      name: payload.name,
      title: payload.title,
      description: payload.description,
      caption: payload.caption,
      url: payload.url,
      file_path: payload.file_path ?? null,
      metadata: JSON.stringify(payload.metadata || {}),
      tags: JSON.stringify(payload.tags || []),
      created_at: now,
      updated_at: now,
    };

    db.prepare(
      `INSERT INTO images (id, user_id, name, title, description, caption, url, file_path, metadata, tags, created_at, updated_at)
       VALUES (@id, @user_id, @name, @title, @description, @caption, @url, @file_path, @metadata, @tags, @created_at, @updated_at)`
    ).run(image);

    return image;
  };

  const updateImage = (userId, id, updates) => {
    const existing = getImageById(userId, id);
    if (!existing) return null;

    const updated = {
      ...existing,
      name: updates.name ?? existing.name,
      title: updates.title ?? existing.title,
      description: updates.description ?? existing.description,
      caption: updates.caption ?? existing.caption,
      url: updates.url ?? existing.url,
      file_path: updates.file_path ?? existing.file_path,
      metadata:
        updates.metadata !== undefined
          ? JSON.stringify(updates.metadata || {})
          : existing.metadata,
      tags:
        updates.tags !== undefined
          ? JSON.stringify(updates.tags || [])
          : existing.tags,
      updated_at: new Date().toISOString(),
    };

    db.prepare(
      `UPDATE images
       SET name = @name,
           title = @title,
           description = @description,
           caption = @caption,
           url = @url,
           file_path = @file_path,
           metadata = @metadata,
           tags = @tags,
           updated_at = @updated_at
       WHERE id = @id AND user_id = @user_id`
    ).run(updated);

    return updated;
  };

  const deleteImage = (userId, id) => {
    const result = db
      .prepare("DELETE FROM images WHERE id = ? AND user_id = ?")
      .run(id, userId);
    return result.changes > 0;
  };

  const listImagesByIds = (userId, ids) => {
    if (!ids.length) return [];
    const placeholders = ids.map(() => "?").join(",");
    return db
      .prepare(
        `SELECT * FROM images WHERE user_id = ? AND id IN (${placeholders})`
      )
      .all(userId, ...ids);
  };

  const listImageFilesByUser = (userId) =>
    db
      .prepare("SELECT id, file_path FROM images WHERE user_id = ?")
      .all(userId);

  const deleteImagesByIds = (userId, ids) => {
    if (!ids.length) return 0;
    const placeholders = ids.map(() => "?").join(",");
    const result = db
      .prepare(
        `DELETE FROM images WHERE user_id = ? AND id IN (${placeholders})`
      )
      .run(userId, ...ids);
    return result.changes;
  };

  const deleteAllImages = (userId) => {
    const result = db
      .prepare(`DELETE FROM images WHERE user_id = ?`)
      .run(userId);
    return result.changes;
  };

  const listFavorites = (userId) =>
    db
      .prepare(
        `SELECT images.*
         FROM favorites
         JOIN images ON favorites.image_id = images.id
         WHERE favorites.user_id = ?
         ORDER BY favorites.created_at DESC`
      )
      .all(userId)
      .map(toClientImage);

  const addFavorite = (userId, imageId) => {
    const now = new Date().toISOString();
    db.prepare(
      `INSERT OR IGNORE INTO favorites (user_id, image_id, created_at)
       VALUES (?, ?, ?)`
    ).run(userId, imageId, now);
  };

  const removeFavorite = (userId, imageId) => {
    db.prepare("DELETE FROM favorites WHERE user_id = ? AND image_id = ?").run(
      userId,
      imageId
    );
  };

  const getSettings = (userId) => {
    const row = db
      .prepare("SELECT prefs FROM user_settings WHERE user_id = ?")
      .get(userId);
    if (!row) return SETTINGS_DEFAULTS;
    const parsed = safeJsonParse(row.prefs, {});
    return { ...SETTINGS_DEFAULTS, ...parsed };
  };

  const updateSettings = (userId, updates) => {
    const merged = { ...getSettings(userId), ...updates };
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO user_settings (user_id, prefs, created_at, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET prefs = excluded.prefs, updated_at = excluded.updated_at`
    ).run(userId, JSON.stringify(merged), now, now);
    return merged;
  };

  const createAiLog = ({ userId, type, statusCode, message, raw }) => {
    const log = {
      id: randomUUID(),
      user_id: userId ?? null,
      type,
      status_code: statusCode ?? null,
      message: message ?? null,
      raw: raw ?? null,
      created_at: new Date().toISOString(),
    };

    db.prepare(
      `INSERT INTO ai_logs (id, user_id, type, status_code, message, raw, created_at)
       VALUES (@id, @user_id, @type, @status_code, @message, @raw, @created_at)`
    ).run(log);

    return log;
  };

  const listAiLogs = (userId, limit = 100) =>
    db
      .prepare(
        `SELECT * FROM ai_logs
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ?`
      )
      .all(userId, limit);

  const listAllAiLogs = (limit = 200) =>
    db
      .prepare(
        `SELECT * FROM ai_logs
         ORDER BY created_at DESC
         LIMIT ?`
      )
      .all(limit);

  const countUsers = () =>
    db.prepare("SELECT COUNT(*) as count FROM users").get().count;

  const countImages = () =>
    db.prepare("SELECT COUNT(*) as count FROM images").get().count;

  const countFavorites = () =>
    db.prepare("SELECT COUNT(*) as count FROM favorites").get().count;

  const countAiLogs = () =>
    db.prepare("SELECT COUNT(*) as count FROM ai_logs").get().count;

  const listUsers = (limit = 50) =>
    db
      .prepare(
        `SELECT id, email, full_name, avatar_url, created_at, last_sign_in_at, is_admin
         FROM users
         ORDER BY created_at DESC
         LIMIT ?`
      )
      .all(limit);

  return {
    getUserById,
    getUserByEmail,
    createUser,
    updateUser,
    toClientUser,
    listImages,
    getImageById,
    createImage,
    updateImage,
    deleteImage,
    listImagesByIds,
    deleteImagesByIds,
    deleteAllImages,
    listImageFilesByUser,
    toClientImage,
    listFavorites,
    addFavorite,
    removeFavorite,
    getSettings,
    updateSettings,
    createAiLog,
    listAiLogs,
    listAllAiLogs,
    countUsers,
    countImages,
    countFavorites,
    countAiLogs,
    listUsers,
  };
};
