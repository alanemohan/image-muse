import Database from "better-sqlite3";
import { randomUUID } from "crypto";

const DEFAULT_SETTINGS = {
  autoAnalyze: true,
  defaultSort: "newest",
  watermarkText: "",
  showMetadata: true,
};
const VALID_SORTS = new Set(["newest", "oldest", "title", "size"]);

const parseJson = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const mapImage = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    title: row.title,
    description: row.description,
    caption: row.caption,
    url: row.url,
    file_path: row.file_path,
    metadata: parseJson(row.metadata_json, {}),
    tags: parseJson(row.tags_json, []),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

export const createDatabase = (dbPath, options = {}) => {
  const db = new Database(dbPath);
  const adminEmails = new Set((options.adminEmails ?? []).map((email) => email.toLowerCase()));

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      avatar_url TEXT,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      last_sign_in_at TEXT
    );

    CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      caption TEXT NOT NULL,
      url TEXT NOT NULL,
      file_path TEXT,
      metadata_json TEXT,
      tags_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS favorites (
      user_id TEXT NOT NULL,
      image_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, image_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(image_id) REFERENCES images(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      auto_analyze INTEGER NOT NULL DEFAULT 1,
      default_sort TEXT NOT NULL DEFAULT 'newest',
      watermark_text TEXT NOT NULL DEFAULT '',
      show_metadata INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

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
    CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
    CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON ai_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON ai_logs(created_at DESC);
  `);

  const tableExists = (tableName) =>
    Boolean(
      db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?"
        )
        .get(tableName)
    );

  const getColumnNames = (tableName) => {
    if (!tableExists(tableName)) return new Set();
    const rows = db.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set(rows.map((row) => row.name));
  };

  const addColumnIfMissing = (tableName, columnName, definition) => {
    const columns = getColumnNames(tableName);
    if (columns.has(columnName)) return;
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  };

  const normalizeSort = (value) =>
    typeof value === "string" && VALID_SORTS.has(value)
      ? value
      : DEFAULT_SETTINGS.defaultSort;

  const normalizeSettings = (settings = {}) => ({
    autoAnalyze: Boolean(settings.autoAnalyze),
    defaultSort: normalizeSort(settings.defaultSort),
    watermarkText:
      typeof settings.watermarkText === "string"
        ? settings.watermarkText
        : DEFAULT_SETTINGS.watermarkText,
    showMetadata: Boolean(settings.showMetadata),
  });

  const toLegacyPrefsJson = (settings) =>
    JSON.stringify({
      autoAnalyze: Boolean(settings.autoAnalyze),
      defaultSort: normalizeSort(settings.defaultSort),
      watermarkText:
        typeof settings.watermarkText === "string"
          ? settings.watermarkText
          : DEFAULT_SETTINGS.watermarkText,
      showMetadata: Boolean(settings.showMetadata),
    });

  const migrateUsersTable = () => {
    addColumnIfMissing("users", "is_admin", "INTEGER NOT NULL DEFAULT 0");
  };

  const migrateImagesTable = () => {
    addColumnIfMissing("images", "file_path", "TEXT");
    addColumnIfMissing("images", "metadata_json", "TEXT");
    addColumnIfMissing("images", "tags_json", "TEXT");

    const columns = getColumnNames("images");
    const hasLegacyMetadata = columns.has("metadata");
    const hasLegacyTags = columns.has("tags");

    const selectColumns = ["id", "metadata_json", "tags_json"];
    if (hasLegacyMetadata) selectColumns.push("metadata");
    if (hasLegacyTags) selectColumns.push("tags");

    const rows = db
      .prepare(`SELECT ${selectColumns.join(", ")} FROM images`)
      .all();

    if (!rows.length) return;

    const updateStatement = db.prepare(
      `
      UPDATE images
      SET metadata_json = ?, tags_json = ?
      WHERE id = ?
      `
    );

    const migrateRows = db.transaction((records) => {
      for (const row of records) {
        const metadataSource =
          row.metadata_json ?? (hasLegacyMetadata ? row.metadata : null);
        const tagsSource = row.tags_json ?? (hasLegacyTags ? row.tags : null);
        const metadataJson = JSON.stringify(parseJson(metadataSource, {}));
        const parsedTags = parseJson(tagsSource, []);
        const tagsJson = JSON.stringify(Array.isArray(parsedTags) ? parsedTags : []);

        updateStatement.run(metadataJson, tagsJson, row.id);
      }
    });

    migrateRows(rows);
  };

  const migrateUserSettingsTable = () => {
    addColumnIfMissing("user_settings", "auto_analyze", "INTEGER NOT NULL DEFAULT 1");
    addColumnIfMissing("user_settings", "default_sort", "TEXT NOT NULL DEFAULT 'newest'");
    addColumnIfMissing("user_settings", "watermark_text", "TEXT NOT NULL DEFAULT ''");
    addColumnIfMissing("user_settings", "show_metadata", "INTEGER NOT NULL DEFAULT 1");
    addColumnIfMissing("user_settings", "updated_at", "TEXT NOT NULL DEFAULT ''");

    const columns = getColumnNames("user_settings");
    const hasLegacyPrefs = columns.has("prefs");

    const selectColumns = [
      "user_id",
      "auto_analyze",
      "default_sort",
      "watermark_text",
      "show_metadata",
      "updated_at",
    ];
    if (hasLegacyPrefs) selectColumns.push("prefs");

    const rows = db
      .prepare(`SELECT ${selectColumns.join(", ")} FROM user_settings`)
      .all();

    if (!rows.length) return;

    const updateStatement = db.prepare(
      `
      UPDATE user_settings
      SET
        auto_analyze = ?,
        default_sort = ?,
        watermark_text = ?,
        show_metadata = ?,
        updated_at = ?
      WHERE user_id = ?
      `
    );

    const migrateRows = db.transaction((records) => {
      for (const row of records) {
        const legacyPrefs = hasLegacyPrefs ? parseJson(row.prefs, {}) : {};

        const autoAnalyze =
          typeof legacyPrefs.autoAnalyze === "boolean"
            ? legacyPrefs.autoAnalyze
            : Boolean(
                row.auto_analyze ?? (DEFAULT_SETTINGS.autoAnalyze ? 1 : 0)
              );
        const defaultSort = normalizeSort(
          typeof legacyPrefs.defaultSort === "string"
            ? legacyPrefs.defaultSort
            : row.default_sort
        );
        const watermarkText =
          typeof legacyPrefs.watermarkText === "string"
            ? legacyPrefs.watermarkText
            : typeof row.watermark_text === "string"
              ? row.watermark_text
              : DEFAULT_SETTINGS.watermarkText;
        const showMetadata =
          typeof legacyPrefs.showMetadata === "boolean"
            ? legacyPrefs.showMetadata
            : Boolean(
                row.show_metadata ?? (DEFAULT_SETTINGS.showMetadata ? 1 : 0)
              );
        const updatedAt =
          typeof row.updated_at === "string" && row.updated_at
            ? row.updated_at
            : new Date().toISOString();

        updateStatement.run(
          autoAnalyze ? 1 : 0,
          defaultSort,
          watermarkText,
          showMetadata ? 1 : 0,
          updatedAt,
          row.user_id
        );
      }
    });

    migrateRows(rows);
  };

  migrateUsersTable();
  migrateImagesTable();
  migrateUserSettingsTable();
  const userSettingsColumns = getColumnNames("user_settings");
  const userSettingsHasPrefs = userSettingsColumns.has("prefs");
  const userSettingsHasCreatedAt = userSettingsColumns.has("created_at");

  const ensureSettings = (userId) => {
    const existing = db
      .prepare("SELECT user_id FROM user_settings WHERE user_id = ?")
      .get(userId);

    if (existing) return;

    const now = new Date().toISOString();
    const defaults = normalizeSettings(DEFAULT_SETTINGS);
    const columns = ["user_id"];
    const values = [userId];

    if (userSettingsHasPrefs) {
      columns.push("prefs");
      values.push(toLegacyPrefsJson(defaults));
    }

    if (userSettingsHasCreatedAt) {
      columns.push("created_at");
      values.push(now);
    }

    columns.push(
      "auto_analyze",
      "default_sort",
      "watermark_text",
      "show_metadata",
      "updated_at"
    );
    values.push(
      defaults.autoAnalyze ? 1 : 0,
      defaults.defaultSort,
      defaults.watermarkText,
      defaults.showMetadata ? 1 : 0,
      now
    );

    const placeholders = columns.map(() => "?").join(", ");
    db.prepare(
      `INSERT INTO user_settings (${columns.join(", ")}) VALUES (${placeholders})`
    ).run(...values);
  };

  const getUserById = (id) => {
    if (!id) return null;
    return db.prepare("SELECT * FROM users WHERE id = ?").get(id) || null;
  };

  const getUserByEmail = (email) => {
    if (!email) return null;
    return db.prepare("SELECT * FROM users WHERE email = ?").get(email) || null;
  };

  const createUser = ({ email, passwordHash }) => {
    if (!email || !passwordHash) {
      throw new Error("Email and passwordHash are required");
    }

    const now = new Date().toISOString();
    const normalizedEmail = email.toLowerCase();

    const user = {
      id: randomUUID(),
      email: normalizedEmail,
      password_hash: passwordHash,
      full_name: null,
      avatar_url: null,
      is_admin: adminEmails.has(normalizedEmail) ? 1 : 0,
      created_at: now,
      last_sign_in_at: now,
    };

    db.prepare(
      `
      INSERT INTO users (
        id,
        email,
        password_hash,
        full_name,
        avatar_url,
        is_admin,
        created_at,
        last_sign_in_at
      )
      VALUES (
        @id,
        @email,
        @password_hash,
        @full_name,
        @avatar_url,
        @is_admin,
        @created_at,
        @last_sign_in_at
      )
      `
    ).run(user);

    ensureSettings(user.id);

    return user;
  };

  const updateUser = (id, updates = {}) => {
    const existing = getUserById(id);
    if (!existing) return null;

    const updated = {
      id: existing.id,
      full_name: updates.fullName ?? existing.full_name,
      avatar_url: updates.avatarUrl ?? existing.avatar_url,
      last_sign_in_at: updates.lastSignInAt ?? existing.last_sign_in_at,
      is_admin:
        typeof updates.isAdmin === "boolean"
          ? updates.isAdmin
            ? 1
            : 0
          : existing.is_admin,
    };

    db.prepare(
      `
      UPDATE users
      SET
        full_name = @full_name,
        avatar_url = @avatar_url,
        last_sign_in_at = @last_sign_in_at,
        is_admin = @is_admin
      WHERE id = @id
      `
    ).run(updated);

    return getUserById(id);
  };

  /* -----------------------------
     Client-safe mapping
  ------------------------------ */

  const toClientUser = (user) => {
    if (!user) return null;

    ensureSettings(user.id);

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      is_admin: Boolean(user.is_admin),
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
    };
  };

  const listImagesByUser = (userId) => {
    const rows = db
      .prepare("SELECT * FROM images WHERE user_id = ? ORDER BY created_at DESC")
      .all(userId);
    return rows.map(mapImage);
  };

  const getImageById = (id) => {
    const row = db.prepare("SELECT * FROM images WHERE id = ?").get(id);
    return mapImage(row);
  };

  const createImage = (userId, payload) => {
    const now = new Date().toISOString();
    const image = {
      id: randomUUID(),
      user_id: userId,
      name: payload.name,
      title: payload.title ?? payload.name,
      description: payload.description ?? "",
      caption: payload.caption ?? "",
      url: payload.url,
      file_path: payload.file_path ?? null,
      metadata_json: JSON.stringify(payload.metadata ?? {}),
      tags_json: JSON.stringify(payload.tags ?? []),
      created_at: now,
      updated_at: now,
    };

    db.prepare(
      `
      INSERT INTO images (
        id, user_id, name, title, description, caption,
        url, file_path, metadata_json, tags_json, created_at, updated_at
      ) VALUES (
        @id, @user_id, @name, @title, @description, @caption,
        @url, @file_path, @metadata_json, @tags_json, @created_at, @updated_at
      )
      `
    ).run(image);

    return getImageById(image.id);
  };

  const updateImage = (id, userId, updates) => {
    const existing = db
      .prepare("SELECT * FROM images WHERE id = ? AND user_id = ?")
      .get(id, userId);

    if (!existing) return null;

    const merged = {
      id,
      user_id: userId,
      name: updates.name ?? existing.name,
      title: updates.title ?? existing.title,
      description: updates.description ?? existing.description,
      caption: updates.caption ?? existing.caption,
      url: updates.url ?? existing.url,
      file_path:
        updates.file_path === undefined
          ? existing.file_path
          : updates.file_path,
      metadata_json:
        updates.metadata === undefined
          ? existing.metadata_json
          : JSON.stringify(updates.metadata ?? {}),
      tags_json:
        updates.tags === undefined
          ? existing.tags_json
          : JSON.stringify(updates.tags ?? []),
      updated_at: new Date().toISOString(),
    };

    db.prepare(
      `
      UPDATE images
      SET
        name = @name,
        title = @title,
        description = @description,
        caption = @caption,
        url = @url,
        file_path = @file_path,
        metadata_json = @metadata_json,
        tags_json = @tags_json,
        updated_at = @updated_at
      WHERE id = @id AND user_id = @user_id
      `
    ).run(merged);

    return getImageById(id);
  };

  const deleteImage = (id, userId) => {
    const result = db
      .prepare("DELETE FROM images WHERE id = ? AND user_id = ?")
      .run(id, userId);
    return result.changes > 0;
  };

  const bulkDeleteImages = (userId, ids = [], all = false) => {
    if (all) {
      const result = db.prepare("DELETE FROM images WHERE user_id = ?").run(userId);
      return result.changes;
    }

    if (!ids.length) return 0;

    const placeholders = ids.map(() => "?").join(",");
    const result = db
      .prepare(`DELETE FROM images WHERE user_id = ? AND id IN (${placeholders})`)
      .run(userId, ...ids);

    return result.changes;
  };

  const listFavorites = (userId) => {
    const rows = db
      .prepare(
        `
        SELECT i.*
        FROM favorites f
        JOIN images i ON i.id = f.image_id
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC
        `
      )
      .all(userId);

    return rows.map(mapImage);
  };

  const addFavorite = (userId, imageId) => {
    db.prepare(
      `
      INSERT OR IGNORE INTO favorites (user_id, image_id, created_at)
      VALUES (?, ?, ?)
      `
    ).run(userId, imageId, new Date().toISOString());
  };

  const removeFavorite = (userId, imageId) => {
    db.prepare("DELETE FROM favorites WHERE user_id = ? AND image_id = ?").run(
      userId,
      imageId
    );
  };

  const getSettings = (userId) => {
    ensureSettings(userId);

    const row = db
      .prepare("SELECT * FROM user_settings WHERE user_id = ?")
      .get(userId);

    if (!row) {
      return { ...DEFAULT_SETTINGS };
    }

    return {
      autoAnalyze:
        row.auto_analyze === null
          ? DEFAULT_SETTINGS.autoAnalyze
          : Boolean(row.auto_analyze),
      defaultSort: normalizeSort(row.default_sort),
      watermarkText:
        typeof row.watermark_text === "string"
          ? row.watermark_text
          : DEFAULT_SETTINGS.watermarkText,
      showMetadata:
        row.show_metadata === null
          ? DEFAULT_SETTINGS.showMetadata
          : Boolean(row.show_metadata),
    };
  };

  const updateSettings = (userId, updates) => {
    ensureSettings(userId);

    const current = getSettings(userId);
    const next = {
      ...current,
      ...updates,
    };
    const normalized = normalizeSettings(next);
    const now = new Date().toISOString();

    if (userSettingsHasPrefs) {
      db.prepare(
        `
        UPDATE user_settings
        SET
          prefs = ?,
          auto_analyze = ?,
          default_sort = ?,
          watermark_text = ?,
          show_metadata = ?,
          updated_at = ?
        WHERE user_id = ?
        `
      ).run(
        toLegacyPrefsJson(normalized),
        normalized.autoAnalyze ? 1 : 0,
        normalized.defaultSort,
        normalized.watermarkText,
        normalized.showMetadata ? 1 : 0,
        now,
        userId
      );
    } else {
      db.prepare(
        `
        UPDATE user_settings
        SET
          auto_analyze = ?,
          default_sort = ?,
          watermark_text = ?,
          show_metadata = ?,
          updated_at = ?
        WHERE user_id = ?
        `
      ).run(
        normalized.autoAnalyze ? 1 : 0,
        normalized.defaultSort,
        normalized.watermarkText,
        normalized.showMetadata ? 1 : 0,
        now,
        userId
      );
    }

    return normalized;
  };

  const createAiLog = ({ userId = null, type, statusCode = null, message = null, raw = null }) => {
    db.prepare(
      `
      INSERT INTO ai_logs (id, user_id, type, status_code, message, raw, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `
    ).run(
      randomUUID(),
      userId,
      type,
      statusCode,
      message,
      raw,
      new Date().toISOString()
    );
  };

  const listAiLogs = ({ userId = null, limit = 100 }) => {
    const safeLimit = Math.max(1, Math.min(500, Number(limit) || 100));

    const rows = userId
      ? db
          .prepare(
            "SELECT * FROM ai_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?"
          )
          .all(userId, safeLimit)
      : db
          .prepare("SELECT * FROM ai_logs ORDER BY created_at DESC LIMIT ?")
          .all(safeLimit);

    return rows;
  };

  const getAdminStats = () => {
    const users = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
    const images = db.prepare("SELECT COUNT(*) AS count FROM images").get().count;
    const favorites = db.prepare("SELECT COUNT(*) AS count FROM favorites").get().count;
    const ai_logs = db.prepare("SELECT COUNT(*) AS count FROM ai_logs").get().count;

    return {
      users,
      images,
      favorites,
      ai_logs,
    };
  };

  const listUsers = (limit = 50) => {
    const safeLimit = Math.max(1, Math.min(500, Number(limit) || 50));
    return db
      .prepare("SELECT * FROM users ORDER BY created_at DESC LIMIT ?")
      .all(safeLimit)
      .map(toClientUser);
  };

  return {
    getUserById,
    getUserByEmail,
    createUser,
    updateUser,
    toClientUser,
    listImagesByUser,
    getImageById,
    createImage,
    updateImage,
    deleteImage,
    bulkDeleteImages,
    listFavorites,
    addFavorite,
    removeFavorite,
    getSettings,
    updateSettings,
    createAiLog,
    listAiLogs,
    getAdminStats,
    listUsers,
  };
};
