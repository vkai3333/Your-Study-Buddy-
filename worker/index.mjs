const GOOGLE_CLIENT_ID = "376424510756-mncplov3qh8rhesmagc2041lsp9telsc.apps.googleusercontent.com";
const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const SESSION_COOKIE = "ysb_google_session";
const MAX_PUBLISHED_PAYLOAD_BYTES = 700000;
const MAX_SYNC_PAYLOAD_BYTES = 5000000;
const MAX_ACCOUNT_ASSET_BYTES = 25 * 1024 * 1024;
const ACCOUNT_ASSET_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp", "image/gif"]);
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const REPORT_ACCOUNT_MIN_AGE_MS = 24 * 60 * 60 * 1000;
const ALLOWED_ORIGINS = new Set([
  "https://yourstudybuddy.net",
  "https://www.yourstudybuddy.net",
  "https://your-study-buddy.dominodude898.workers.dev",
]);

let cachedKeys = null;
let cachedKeysUntil = 0;
let schemaPromise = null;
const RESERVED_USERNAMES = new Set([
  "admin", "administrator", "api", "moderator", "root", "staff", "studybuddy", "support", "www", "yourstudybuddy",
]);

function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function securedAssetResponse(response) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  headers.set("Content-Security-Policy", [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "script-src 'self' https://accounts.google.com",
    "style-src 'self' 'unsafe-inline' https://accounts.google.com",
    "frame-src https://accounts.google.com",
    "connect-src 'self' https://accounts.google.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "worker-src 'self' blob:",
  ].join("; "));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function base64UrlBytes(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(normalized);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function decodeJwtJson(value) {
  return JSON.parse(new TextDecoder().decode(base64UrlBytes(value)));
}

async function googleKeys() {
  if (cachedKeys && Date.now() < cachedKeysUntil) return cachedKeys;
  const response = await fetch(GOOGLE_JWKS_URL, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Google signing keys are unavailable");
  const data = await response.json();
  const cacheControl = response.headers.get("Cache-Control") || "";
  const maxAge = Number(cacheControl.match(/max-age=(\d+)/i)?.[1] || 1800);
  cachedKeys = Array.isArray(data.keys) ? data.keys : [];
  cachedKeysUntil = Date.now() + Math.max(60, maxAge) * 1000;
  return cachedKeys;
}

async function verifyGoogleCredential(token) {
  if (typeof token !== "string" || token.length > 12000) throw new Error("Invalid credential");
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid credential");
  const header = decodeJwtJson(parts[0]);
  const payload = decodeJwtJson(parts[1]);
  if (header.alg !== "RS256" || !header.kid) throw new Error("Unsupported credential");
  const keyData = (await googleKeys()).find((key) => key.kid === header.kid && key.kty === "RSA");
  if (!keyData) throw new Error("Unknown signing key");
  const key = await crypto.subtle.importKey(
    "jwk",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const validSignature = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    base64UrlBytes(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  if (!validSignature) throw new Error("Invalid signature");
  const now = Math.floor(Date.now() / 1000);
  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audiences.includes(GOOGLE_CLIENT_ID)) throw new Error("Wrong audience");
  if (audiences.length > 1 && payload.azp !== GOOGLE_CLIENT_ID) throw new Error("Wrong authorized party");
  if (!["accounts.google.com", "https://accounts.google.com"].includes(payload.iss)) throw new Error("Wrong issuer");
  if (!Number.isFinite(payload.exp) || payload.exp <= now) throw new Error("Expired credential");
  if (payload.nbf && payload.nbf > now + 60) throw new Error("Credential is not active");
  if (!payload.sub || payload.email_verified !== true) throw new Error("Unverified account");
  return {
    id: payload.sub,
    email: payload.email || "",
    name: payload.name || payload.given_name || "Google user",
    givenName: payload.given_name || "",
    picture: payload.picture || "",
    expiresAt: payload.exp,
  };
}

function cookieValue(request, name) {
  const cookies = request.headers.get("Cookie") || "";
  for (const cookie of cookies.split(";")) {
    const separator = cookie.indexOf("=");
    if (separator < 0) continue;
    if (cookie.slice(0, separator).trim() === name) return cookie.slice(separator + 1).trim();
  }
  return "";
}

function allowedMutation(request) {
  const origin = request.headers.get("Origin");
  return Boolean(origin && ALLOWED_ORIGINS.has(origin));
}

function accountAssetId(pathname) {
  const prefix = "/api/account/assets/";
  if (!pathname.startsWith(prefix)) return "";
  const id = decodeURIComponent(pathname.slice(prefix.length));
  return /^[a-z0-9][a-z0-9._-]{0,159}$/i.test(id) ? id : "";
}

async function accountAsset(request, env, id) {
  const user = await progressAccount(request, env);
  if (!user) return json({ error: "Please log in again." }, { status: 401 });
  if (!env.NOTE_ASSETS) return json({ error: "Note attachment storage is not connected yet." }, { status: 503 });
  const key = `${user.id}/${id}`;
  if (request.method === "GET") {
    const object = await env.NOTE_ASSETS.get(key);
    if (!object) return json({ error: "Attachment not found." }, { status: 404 });
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("ETag", object.httpEtag);
    headers.set("Cache-Control", "private, max-age=3600");
    headers.set("X-Content-Type-Options", "nosniff");
    return new Response(object.body, { headers });
  }
  if (!allowedMutation(request)) return json({ error: "Origin not allowed" }, { status: 403 });
  if (request.method === "DELETE") {
    await env.NOTE_ASSETS.delete(key);
    return json({ ok: true });
  }
  const contentType = String(request.headers.get("Content-Type") || "").split(";")[0].toLowerCase();
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (!ACCOUNT_ASSET_TYPES.has(contentType)) return json({ error: "Unsupported attachment type." }, { status: 415 });
  if (contentLength > MAX_ACCOUNT_ASSET_BYTES) return json({ error: "Attachments must be 25 MB or smaller." }, { status: 413 });
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > MAX_ACCOUNT_ASSET_BYTES) return json({ error: "Attachments must be 25 MB or smaller." }, { status: 413 });
  await env.NOTE_ASSETS.put(key, bytes, { httpMetadata: { contentType }, customMetadata: { updatedAt: String(Date.now()) } });
  return json({ ok: true, id, size: bytes.byteLength });
}

async function ensureUserSchema(env) {
  if (!env.DB) return false;
  if (!schemaPromise) {
    schemaPromise = env.DB.exec(`
      CREATE TABLE IF NOT EXISTS users (
        google_sub TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        display_name TEXT NOT NULL DEFAULT '',
        picture_url TEXT NOT NULL DEFAULT '',
        username TEXT COLLATE NOCASE UNIQUE,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users(username COLLATE NOCASE);
      CREATE TABLE IF NOT EXISTS published_items (
        id TEXT PRIMARY KEY,
        author_sub TEXT NOT NULL,
        author_username TEXT COLLATE NOCASE NOT NULL,
        author_display_name TEXT NOT NULL,
        kind TEXT NOT NULL CHECK (kind IN ('study_set', 'note')),
        source_id TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT NOT NULL DEFAULT '',
        card_count INTEGER NOT NULL DEFAULT 0,
        question_count INTEGER NOT NULL DEFAULT 0,
        feynman_count INTEGER NOT NULL DEFAULT 0,
        payload_json TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(author_sub, kind, source_id)
      );
      CREATE INDEX IF NOT EXISTS published_items_updated_idx ON published_items(updated_at DESC);
      CREATE INDEX IF NOT EXISTS published_items_kind_idx ON published_items(kind, updated_at DESC);
      CREATE TABLE IF NOT EXISTS published_ratings (
        item_id TEXT NOT NULL,
        user_sub TEXT NOT NULL,
        reviewer_username TEXT COLLATE NOCASE NOT NULL,
        reviewer_display_name TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        review TEXT NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY(item_id, user_sub)
      );
      CREATE INDEX IF NOT EXISTS published_ratings_item_idx ON published_ratings(item_id, updated_at DESC);
      CREATE TABLE IF NOT EXISTS published_add_counts (
        item_id TEXT PRIMARY KEY,
        add_count INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS published_add_counts_popular_idx ON published_add_counts(add_count DESC);
      CREATE TABLE IF NOT EXISTS published_reports (
        item_id TEXT NOT NULL,
        reporter_sub TEXT NOT NULL,
        reason TEXT NOT NULL,
        details TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'open',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY(item_id, reporter_sub)
      );
      CREATE INDEX IF NOT EXISTS published_reports_status_idx ON published_reports(status, updated_at DESC);
      CREATE TABLE IF NOT EXISTS community_moderation (
        item_id TEXT PRIMARY KEY,
        status TEXT NOT NULL DEFAULT 'removed',
        trigger TEXT NOT NULL,
        report_count INTEGER NOT NULL DEFAULT 0,
        save_count INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS community_moderation_status_idx ON community_moderation(status, updated_at DESC);
      CREATE TABLE IF NOT EXISTS user_progress (
        google_sub TEXT PRIMARY KEY,
        version INTEGER NOT NULL DEFAULT 0,
        data_json TEXT NOT NULL DEFAULT '{}',
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS auth_sessions (
        token_hash TEXT PRIMARY KEY,
        google_sub TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS auth_sessions_user_idx ON auth_sessions(google_sub);
      CREATE INDEX IF NOT EXISTS auth_sessions_expiry_idx ON auth_sessions(expires_at);
      CREATE TABLE IF NOT EXISTS published_saves (
        item_id TEXT NOT NULL,
        user_sub TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY(item_id, user_sub)
      );
      CREATE INDEX IF NOT EXISTS published_saves_user_idx ON published_saves(user_sub, created_at DESC);
    `).then(async () => {
      try {
        await env.DB.exec("ALTER TABLE users ADD COLUMN profile_public INTEGER NOT NULL DEFAULT 1;");
      } catch (error) {
        if (!/duplicate column|already exists/i.test(String(error?.message || error))) throw error;
      }
    }).catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
  return true;
}

function sessionToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sessionTokenHash(token) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(token || "")));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function storedAccount(row) {
  if (!row) return null;
  return {
    id: row.google_sub,
    email: row.email || "",
    name: row.display_name || "",
    displayName: row.display_name || "",
    username: row.username || "",
    picture: row.picture_url || "",
    profilePublic: Number(row.profile_public) !== 0,
    createdAt: Number(row.created_at) || 0,
    usernameStorageReady: true,
  };
}

async function accountUser(env, verifiedUser) {
  if (!env.DB) return { ...verifiedUser, displayName: "", username: "", usernameStorageReady: false };
  try {
    await ensureUserSchema(env);
    const now = Date.now();
    await env.DB.prepare(`
      INSERT INTO users (google_sub, email, display_name, picture_url, username, created_at, updated_at)
      VALUES (?, ?, ?, ?, NULL, ?, ?)
      ON CONFLICT(google_sub) DO UPDATE SET
        email = excluded.email,
        picture_url = excluded.picture_url,
        updated_at = excluded.updated_at
    `).bind(verifiedUser.id, verifiedUser.email, verifiedUser.name, verifiedUser.picture, now, now).run();
    const row = await env.DB.prepare("SELECT display_name, username, profile_public FROM users WHERE google_sub = ?").bind(verifiedUser.id).first();
    return {
      ...verifiedUser,
      name: row?.display_name || verifiedUser.name,
      displayName: row?.display_name || "",
      username: row?.username || "",
      profilePublic: Number(row?.profile_public) !== 0,
      usernameStorageReady: true,
    };
  } catch (error) {
    console.error("Account storage is unavailable", error?.message || error);
    return { ...verifiedUser, displayName: "", username: "", usernameStorageReady: false };
  }
}

async function sessionAccount(request, env) {
  const token = cookieValue(request, SESSION_COOKIE);
  if (!token || !env.DB) return null;
  await ensureUserSchema(env);
  const tokenHash = await sessionTokenHash(token);
  const row = await env.DB.prepare(`
    SELECT u.google_sub, u.email, u.display_name, u.picture_url, u.username, u.profile_public, u.created_at
    FROM auth_sessions s JOIN users u ON u.google_sub = s.google_sub
    WHERE s.token_hash = ? AND s.expires_at > ?
  `).bind(tokenHash, Date.now()).first();
  return storedAccount(row);
}

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

function usernameError(username) {
  if (!/^[a-z][a-z0-9_]{2,23}$/.test(username)) {
    return "Use 3–24 characters, start with a letter, and use only letters, numbers, or underscores.";
  }
  if (RESERVED_USERNAMES.has(username)) return "That username is reserved. Choose another one.";
  return "";
}

function normalizeDisplayName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function displayNameError(displayName) {
  if (!displayName || displayName.length > 40) return "Use a name between 1 and 40 characters.";
  if(/[\u0000-\u001F\u007F]/.test(displayName)) return "That name contains unsupported characters.";
  return "";
}

async function signIn(request, env) {
  if (!allowedMutation(request)) return json({ error: "Origin not allowed" }, { status: 403 });
  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.includes("application/json")) return json({ error: "JSON required" }, { status: 415 });
  const body = await request.json().catch(() => null);
  const verifiedUser = await verifyGoogleCredential(body?.credential);
  if (!env.DB) return json({ error: "Account storage is not connected yet." }, { status: 503 });
  const user = await accountUser(env, verifiedUser);
  if (!user.usernameStorageReady) return json({ error: "Account storage is not available." }, { status: 503 });
  const token = sessionToken();
  const tokenHash = await sessionTokenHash(token);
  const now = Date.now();
  const expiresAt = now + SESSION_MAX_AGE_SECONDS * 1000;
  await env.DB.batch([
    env.DB.prepare("DELETE FROM auth_sessions WHERE expires_at <= ?").bind(now),
    env.DB.prepare("INSERT INTO auth_sessions (token_hash, google_sub, created_at, expires_at) VALUES (?, ?, ?, ?)")
      .bind(tokenHash, user.id, now, expiresAt),
  ]);
  return json({ user }, {
    headers: { "Set-Cookie": `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}` },
  });
}

async function currentUser(request, env) {
  try {
    const user = await sessionAccount(request, env);
    if (!user) throw new Error("Session expired");
    return json({ user });
  } catch (_) {
    return json({ user: null }, {
      status: 401,
      headers: { "Set-Cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` },
    });
  }
}

async function signOut(request, env) {
  if (!allowedMutation(request)) return json({ error: "Origin not allowed" }, { status: 403 });
  const token = cookieValue(request, SESSION_COOKIE);
  if (token && env.DB) {
    await ensureUserSchema(env);
    await env.DB.prepare("DELETE FROM auth_sessions WHERE token_hash = ?").bind(await sessionTokenHash(token)).run();
  }
  return json({ ok: true }, {
    headers: { "Set-Cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` },
  });
}

async function checkUsername(request, env) {
  let user;
  try { user = await sessionAccount(request, env); }
  catch (_) { return json({ error: "Please log in again." }, { status: 401 }); }
  if (!user) return json({ error: "Please log in first." }, { status: 401 });
  if (!user.usernameStorageReady) return json({ error: "Username storage is not connected yet." }, { status: 503 });
  const username = normalizeUsername(new URL(request.url).searchParams.get("username"));
  const validationError = usernameError(username);
  if (validationError) return json({ error: validationError }, { status: 400 });
  const row = await env.DB.prepare("SELECT google_sub FROM users WHERE username = ? COLLATE NOCASE").bind(username).first();
  return json({ username, available: !row || row.google_sub === user.id });
}

async function createProfile(request, env) {
  if (!allowedMutation(request)) return json({ error: "Origin not allowed" }, { status: 403 });
  if (!(request.headers.get("Content-Type") || "").includes("application/json")) return json({ error: "JSON required" }, { status: 415 });
  let user;
  try { user = await sessionAccount(request, env); }
  catch (_) { return json({ error: "Please log in again." }, { status: 401 }); }
  if (!user) return json({ error: "Please log in first." }, { status: 401 });
  if (!user.usernameStorageReady) return json({ error: "Username storage is not connected yet." }, { status: 503 });
  if (user.username) return json({ error: "Your username has already been created." }, { status: 409 });
  const body = await request.json().catch(() => null);
  const displayName = normalizeDisplayName(body?.displayName);
  const username = normalizeUsername(body?.username);
  const nameValidationError = displayNameError(displayName);
  if (nameValidationError) return json({ error: nameValidationError }, { status: 400 });
  const validationError = usernameError(username);
  if (validationError) return json({ error: validationError }, { status: 400 });
  try {
    const result = await env.DB.prepare("UPDATE users SET display_name = ?, username = ?, updated_at = ? WHERE google_sub = ? AND username IS NULL")
      .bind(displayName, username, Date.now(), user.id).run();
    if (!result.meta?.changes) return json({ error: "Your username has already been created." }, { status: 409 });
  } catch (error) {
    if (/unique|constraint/i.test(String(error?.message || error))) return json({ error: `@${username} is already taken.` }, { status: 409 });
    throw error;
  }
  return json({ user: { ...user, name: displayName, displayName, username, profilePublic: true, usernameStorageReady: true } });
}

async function updateProfilePrivacy(request, env) {
  if (!allowedMutation(request)) return json({ error: "Origin not allowed" }, { status: 403 });
  if (!(request.headers.get("Content-Type") || "").includes("application/json")) return json({ error: "JSON required" }, { status: 415 });
  let user;
  try { user = await sessionAccount(request, env); }
  catch (_) { return json({ error: "Please log in again." }, { status: 401 }); }
  if (!user?.username) return json({ error: "Finish creating your profile first." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (typeof body?.profilePublic !== "boolean") return json({ error: "Choose public or private profile visibility." }, { status: 400 });
  await env.DB.prepare("UPDATE users SET profile_public = ?, updated_at = ? WHERE google_sub = ?")
    .bind(body.profilePublic ? 1 : 0, Date.now(), user.id).run();
  return json({ user: { ...user, profilePublic: body.profilePublic } });
}

async function progressAccount(request, env) {
  try { return await sessionAccount(request, env); }
  catch (_) { return null; }
}

async function getSyncedProgress(request, env) {
  const user = await progressAccount(request, env);
  if (!user) return json({ error: "Please log in again." }, { status: 401 });
  await ensureUserSchema(env);
  const row = await env.DB.prepare("SELECT version, data_json, updated_at FROM user_progress WHERE google_sub = ?")
    .bind(user.id).first();
  if (!row) return json({ version: 0, updatedAt: 0, data: { records: {} } });
  let data = { records: {} };
  try { data = JSON.parse(row.data_json || "{}"); } catch (_) {}
  return json({ version: Number(row.version) || 0, updatedAt: Number(row.updated_at) || 0, data });
}

async function saveSyncedProgress(request, env) {
  if (!allowedMutation(request)) return json({ error: "Origin not allowed" }, { status: 403 });
  if (!(request.headers.get("Content-Type") || "").includes("application/json")) return json({ error: "JSON required" }, { status: 415 });
  const user = await progressAccount(request, env);
  if (!user) return json({ error: "Please log in again." }, { status: 401 });
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_SYNC_PAYLOAD_BYTES) {
    return json({ error: "Your synced progress is too large. Export a backup and remove unused personal sets." }, { status: 413 });
  }
  let body;
  try { body = JSON.parse(raw); } catch (_) { return json({ error: "Invalid sync data." }, { status: 400 }); }
  const records = body?.data?.records;
  if (!records || typeof records !== "object" || Array.isArray(records) || Object.keys(records).length > 80) {
    return json({ error: "Invalid sync data." }, { status: 400 });
  }
  for (const [key, record] of Object.entries(records)) {
    if (!/^(?:your-study-buddy|study-desk)-[a-z0-9-]{1,80}$/i.test(key)
      || (record?.deleted === true ? record?.value != null : typeof record?.value !== "string")
      || !Number.isFinite(Number(record?.updatedAt))) return json({ error: "Invalid sync record." }, { status: 400 });
  }
  await ensureUserSchema(env);
  const current = await env.DB.prepare("SELECT version FROM user_progress WHERE google_sub = ?").bind(user.id).first();
  const currentVersion = Number(current?.version) || 0;
  const expectedVersion = Math.max(0, Number(body.version) || 0);
  if (current && expectedVersion !== currentVersion) {
    return json({ error: "Progress changed on another device.", version: currentVersion }, { status: 409 });
  }
  const version = currentVersion + 1;
  const now = Date.now();
  const dataJson = JSON.stringify({ records });
  await env.DB.prepare(`
    INSERT INTO user_progress (google_sub, version, data_json, updated_at) VALUES (?, ?, ?, ?)
    ON CONFLICT(google_sub) DO UPDATE SET version = excluded.version, data_json = excluded.data_json, updated_at = excluded.updated_at
  `).bind(user.id, version, dataJson, now).run();
  return json({ ok: true, version, updatedAt: now });
}

async function deleteAccount(request, env) {
  if (!allowedMutation(request)) return json({ error: "Origin not allowed" }, { status: 403 });
  const user = await progressAccount(request, env);
  if (!user) return json({ error: "Please log in again." }, { status: 401 });
  await ensureUserSchema(env);
  const authored = await env.DB.prepare("SELECT id FROM published_items WHERE author_sub = ?").bind(user.id).all();
  for (const item of authored.results || []) {
    await env.DB.batch([
      env.DB.prepare("DELETE FROM published_ratings WHERE item_id = ?").bind(item.id),
      env.DB.prepare("DELETE FROM published_reports WHERE item_id = ?").bind(item.id),
      env.DB.prepare("DELETE FROM published_saves WHERE item_id = ?").bind(item.id),
      env.DB.prepare("DELETE FROM published_add_counts WHERE item_id = ?").bind(item.id),
      env.DB.prepare("DELETE FROM community_moderation WHERE item_id = ?").bind(item.id),
      env.DB.prepare("DELETE FROM published_items WHERE id = ?").bind(item.id),
    ]);
  }
  await env.DB.batch([
    env.DB.prepare("DELETE FROM published_ratings WHERE user_sub = ?").bind(user.id),
    env.DB.prepare("DELETE FROM published_reports WHERE reporter_sub = ?").bind(user.id),
    env.DB.prepare("DELETE FROM published_saves WHERE user_sub = ?").bind(user.id),
    env.DB.prepare("DELETE FROM auth_sessions WHERE google_sub = ?").bind(user.id),
    env.DB.prepare("DELETE FROM user_progress WHERE google_sub = ?").bind(user.id),
    env.DB.prepare("DELETE FROM users WHERE google_sub = ?").bind(user.id),
  ]);
  if (env.NOTE_ASSETS) {
    let cursor;
    do {
      const page = await env.NOTE_ASSETS.list({ prefix: `${user.id}/`, cursor });
      if (page.objects.length) await env.NOTE_ASSETS.delete(page.objects.map((object) => object.key));
      cursor = page.truncated ? page.cursor : undefined;
    } while (cursor);
  }
  return json({ ok: true }, {
    headers: { "Set-Cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` },
  });
}

function cleanPublishedText(value, maximumLength) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maximumLength);
}

const AUTO_HIDE_MIN_REPORTS = 8;
const AUTO_HIDE_REPORT_SAVE_RATIO = 0.35;
const MAX_PUBLISHED_ITEMS_PER_ACCOUNT = 100;
const MAX_NEW_PUBLICATIONS_PER_HOUR = 20;

function publicationText(value, output = [], depth = 0) {
  if (depth > 8 || output.join(" ").length > 750000) return output;
  if (typeof value === "string") {
    if (!value.startsWith("data:image/")) output.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => publicationText(item, output, depth + 1));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((item) => publicationText(item, output, depth + 1));
  }
  return output;
}

function publicationModerationIssue(body) {
  const text = publicationText({ title: body?.title, summary: body?.summary, payload: body?.payload }).join(" ").replace(/\s+/g, " ").toLowerCase();
  const prohibited = [
    /\b(?:csam|child sexual abuse material)\b/,
    /\b(?:child|minor|underage)\b.{0,50}\b(?:sexual|nude|pornographic|explicit)\b/,
    /\b(?:buy|sell|ship|vendor|dealer|traffic|cook|manufacture|synthesize)\b.{0,70}\b(?:cocaine|heroin|fentanyl|methamphetamine|crystal meth|mdma|controlled substance)\b/,
    /\b(?:how to|instructions? for|steps to|recipe for|build|make|manufacture|buy|sell)\b.{0,70}\b(?:bomb(?!\s+calorimeter)|explosive device|ghost gun|illegal firearm|weapon)\b/,
    /\b(?:steal|phish|buy|sell)\b.{0,60}\b(?:passwords?|logins?|credit cards?|social security numbers?|bank accounts?)\b/,
    /\b(?:buy|sell|share|trade)\b.{0,60}\b(?:nudes?|pornography|sexually explicit material)\b/,
  ];
  return prohibited.some((pattern) => pattern.test(text)) ? "This publication appears to promote or facilitate prohibited illicit material." : "";
}

async function itemIsModerated(env, itemId) {
  const row = await env.DB.prepare("SELECT item_id FROM community_moderation WHERE item_id = ? AND status IN ('removed', 'pending_review')").bind(itemId).first();
  return Boolean(row);
}

function publishedCounts(kind, payload) {
  if (kind === "note") return {};
  return {
    cards: Array.isArray(payload?.cards) ? payload.cards.length : 0,
    questions: Array.isArray(payload?.questions) ? payload.questions.length : 0,
    feynmanPrompts: Array.isArray(payload?.feynmanPrompts) ? payload.feynmanPrompts.length : 0,
  };
}

function ratingStatistics(values) {
  const ratings = values.map(Number).filter((rating) => Number.isFinite(rating) && rating >= 1 && rating <= 5).sort((a, b) => a - b);
  const count = ratings.length;
  if (!count) return { average: 0, mean: 0, median: 0, count: 0 };
  const mean = ratings.reduce((sum, rating) => sum + rating, 0) / count;
  const middle = Math.floor(count / 2);
  const median = count % 2 ? ratings[middle] : (ratings[middle - 1] + ratings[middle]) / 2;
  return { average: count >= 5 ? (mean + median) / 2 : 0, mean, median, count };
}

function publishedSummary(row, rating = ratingStatistics([])) {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    summary: row.summary || "",
    author: { username: row.author_username, displayName: row.author_display_name },
    counts: { cards: row.card_count || 0, questions: row.question_count || 0, feynmanPrompts: row.feynman_count || 0 },
    rating,
    addCount: Number(row.add_count) || 0,
    updatedAt: row.updated_at,
  };
}

async function recentPublishedReviews(env, itemId) {
  const result = await env.DB.prepare(`
    SELECT rating
    FROM published_ratings WHERE item_id = ?
    ORDER BY updated_at DESC LIMIT 20
  `).bind(itemId).all();
  return (result.results || []).map((row) => ({ rating: row.rating }));
}

async function publishedRating(env, itemId) {
  const result = await env.DB.prepare("SELECT rating FROM published_ratings WHERE item_id = ?").bind(itemId).all();
  return ratingStatistics((result.results || []).map((row) => row.rating));
}

async function listPublishedItems(request, env) {
  if (!env.DB) return json({ error: "Community storage is not connected yet." }, { status: 503 });
  await ensureUserSchema(env);
  const url = new URL(request.url);
  const kind = ["study_set", "note"].includes(url.searchParams.get("kind")) ? url.searchParams.get("kind") : "";
  const query = cleanPublishedText(url.searchParams.get("q"), 60).toLowerCase();
  const like = `%${query}%`;
  const result = await env.DB.prepare(`
    SELECT p.id, p.author_username, p.author_display_name, p.kind, p.title, p.summary, p.card_count, p.question_count, p.feynman_count, p.updated_at,
      COALESCE(a.add_count, 0) AS add_count
    FROM published_items p LEFT JOIN published_add_counts a ON a.item_id = p.id
      LEFT JOIN community_moderation m ON m.item_id = p.id AND m.status IN ('removed', 'pending_review')
    WHERE (? = '' OR p.kind = ?)
      AND m.item_id IS NULL
      AND (? = '' OR lower(p.title) LIKE ? OR lower(p.summary) LIKE ? OR lower(p.author_username) LIKE ? OR lower(p.author_display_name) LIKE ?)
    ORDER BY p.updated_at DESC
    LIMIT 200
  `).bind(kind, kind, query, like, like, like, like).all();
  const rows = result.results || [];
  if (!rows.length) return json({ items: [] });
  const ids = rows.map((row) => row.id);
  const ratingsByItem = new Map();
  for (let offset = 0; offset < ids.length; offset += 80) {
    const batch = ids.slice(offset, offset + 80);
    const placeholders = batch.map(() => "?").join(",");
    const ratingsResult = await env.DB.prepare(`SELECT item_id, rating FROM published_ratings WHERE item_id IN (${placeholders})`).bind(...batch).all();
    for (const row of ratingsResult.results || []) {
      if (!ratingsByItem.has(row.item_id)) ratingsByItem.set(row.item_id, []);
      ratingsByItem.get(row.item_id).push(row.rating);
    }
  }
  return json({ items: rows.map((row) => publishedSummary(row, ratingStatistics(ratingsByItem.get(row.id) || []))) });
}

async function listMyPublishedItems(request, env) {
  if (!env.DB) return json({ error: "Community storage is not connected yet." }, { status: 503 });
  let user;
  try { user = await sessionAccount(request, env); }
  catch (_) { return json({ error: "Please log in again." }, { status: 401 }); }
  if (!user) return json({ error: "Please log in first." }, { status: 401 });
  await ensureUserSchema(env);
  const result = await env.DB.prepare(`
    SELECT p.id, p.author_username, p.author_display_name, p.kind, p.title, p.summary, p.card_count, p.question_count, p.feynman_count, p.updated_at,
      COALESCE(a.add_count, 0) AS add_count
    FROM published_items p LEFT JOIN published_add_counts a ON a.item_id = p.id
      LEFT JOIN community_moderation m ON m.item_id = p.id
    WHERE p.author_sub = ?
    ORDER BY p.updated_at DESC
    LIMIT 200
  `).bind(user.id).all();
  const rows = result.results || [];
  const items = [];
  for (const row of rows) items.push(publishedSummary(row, await publishedRating(env, row.id)));
  return json({ items });
}

async function getCommunityProfile(request, env, requestedUsername) {
  if (!env.DB) return json({ error: "Community storage is not connected yet." }, { status: 503 });
  await ensureUserSchema(env);
  const username = normalizeUsername(requestedUsername);
  if (!username) return json({ error: "This profile was not found." }, { status: 404 });
  const profile = await env.DB.prepare("SELECT google_sub, display_name, username, profile_public FROM users WHERE username = ? COLLATE NOCASE")
    .bind(username).first();
  if (!profile) return json({ error: "This profile was not found." }, { status: 404 });
  const isPublic = Number(profile.profile_public) !== 0;
  const profileSummary = { displayName: profile.display_name || "Student", username: profile.username, public: isPublic };
  if (!isPublic) return json({ profile: profileSummary, items: [] });
  const result = await env.DB.prepare(`
    SELECT p.id, p.author_username, p.author_display_name, p.kind, p.title, p.summary, p.card_count, p.question_count, p.feynman_count, p.updated_at,
      COALESCE(a.add_count, 0) AS add_count
    FROM published_items p LEFT JOIN published_add_counts a ON a.item_id = p.id
      LEFT JOIN community_moderation m ON m.item_id = p.id AND m.status IN ('removed', 'pending_review')
    WHERE p.author_sub = ? AND m.item_id IS NULL
    ORDER BY p.updated_at DESC
    LIMIT 200
  `).bind(profile.google_sub).all();
  const items = [];
  for (const row of result.results || []) items.push(publishedSummary(row, await publishedRating(env, row.id)));
  return json({ profile: profileSummary, items });
}

async function unpublishItem(request, env, itemId) {
  if (!allowedMutation(request)) return json({ error: "Origin not allowed" }, { status: 403 });
  if (!env.DB) return json({ error: "Community storage is not connected yet." }, { status: 503 });
  let user;
  try { user = await sessionAccount(request, env); }
  catch (_) { return json({ error: "Please log in again." }, { status: 401 }); }
  if (!user) return json({ error: "Please log in first." }, { status: 401 });
  await ensureUserSchema(env);
  const item = await env.DB.prepare("SELECT id FROM published_items WHERE id = ? AND author_sub = ?").bind(itemId, user.id).first();
  if (!item) return json({ error: "This published item was not found in your public library." }, { status: 404 });
  await env.DB.prepare("DELETE FROM published_ratings WHERE item_id = ?").bind(itemId).run();
  await env.DB.prepare("DELETE FROM published_reports WHERE item_id = ?").bind(itemId).run();
  await env.DB.prepare("DELETE FROM published_saves WHERE item_id = ?").bind(itemId).run();
  await env.DB.prepare("DELETE FROM published_add_counts WHERE item_id = ?").bind(itemId).run();
  await env.DB.prepare("DELETE FROM community_moderation WHERE item_id = ?").bind(itemId).run();
  await env.DB.prepare("DELETE FROM published_items WHERE id = ? AND author_sub = ?").bind(itemId, user.id).run();
  return json({ ok: true });
}

async function getPublishedItem(request, env, itemId) {
  if (!env.DB) return json({ error: "Community storage is not connected yet." }, { status: 503 });
  await ensureUserSchema(env);
  const row = await env.DB.prepare(`
    SELECT p.id, p.author_username, p.author_display_name, p.kind, p.title, p.summary, p.card_count, p.question_count, p.feynman_count, p.payload_json, p.updated_at,
      COALESCE(a.add_count, 0) AS add_count
    FROM published_items p LEFT JOIN published_add_counts a ON a.item_id = p.id
      LEFT JOIN community_moderation m ON m.item_id = p.id AND m.status IN ('removed', 'pending_review')
    WHERE p.id = ? AND m.item_id IS NULL
  `).bind(itemId).first();
  if (!row) return json({ error: "This published item was not found." }, { status: 404 });
  let payload;
  try { payload = JSON.parse(row.payload_json); }
  catch (_) { return json({ error: "This published item is damaged." }, { status: 500 }); }
  return json({ item: { ...publishedSummary(row, await publishedRating(env, itemId)), payload, reviews: await recentPublishedReviews(env, itemId) } });
}

async function recordPublishedAdd(request, env, itemId) {
  if (!allowedMutation(request)) return json({ error: "Origin not allowed" }, { status: 403 });
  if (!env.DB) return json({ error: "Community storage is not connected yet." }, { status: 503 });
  const authentication = await feedbackUser(request, env);
  if (authentication.error) return authentication.error;
  await ensureUserSchema(env);
  const item = await env.DB.prepare("SELECT id FROM published_items WHERE id = ?").bind(itemId).first();
  if (item && await itemIsModerated(env, itemId)) return json({ error: "This published item is no longer available." }, { status: 410 });
  if (!item) return json({ error: "This published item was not found." }, { status: 404 });
  const now = Date.now();
  const saved = await env.DB.prepare("INSERT OR IGNORE INTO published_saves (item_id, user_sub, created_at) VALUES (?, ?, ?)")
    .bind(itemId, authentication.user.id, now).run();
  const countRow = await env.DB.prepare("SELECT COUNT(*) AS count FROM published_saves WHERE item_id = ?").bind(itemId).first();
  const addCount = Number(countRow?.count) || 0;
  await env.DB.prepare(`
    INSERT INTO published_add_counts (item_id, add_count, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(item_id) DO UPDATE SET add_count = excluded.add_count, updated_at = excluded.updated_at
  `).bind(itemId, addCount, now).run();
  return json({ addCount, counted: Boolean(saved.meta?.changes) });
}

async function feedbackUser(request, env) {
  let user;
  try { user = await sessionAccount(request, env); }
  catch (_) { return { error: json({ error: "Please log in again." }, { status: 401 }) }; }
  if (!user) return { error: json({ error: "Please log in first." }, { status: 401 }) };
  if (!user.username || !user.displayName) return { error: json({ error: "Finish creating your profile first." }, { status: 403 }) };
  return { user };
}

async function reviewPublishedItem(request, env, itemId) {
  if (!allowedMutation(request)) return json({ error: "Origin not allowed" }, { status: 403 });
  if (!(request.headers.get("Content-Type") || "").includes("application/json")) return json({ error: "JSON required" }, { status: 415 });
  const authentication = await feedbackUser(request, env);
  if (authentication.error) return authentication.error;
  await ensureUserSchema(env);
  const item = await env.DB.prepare("SELECT author_sub FROM published_items WHERE id = ?").bind(itemId).first();
  if (!item) return json({ error: "This published item was not found." }, { status: 404 });
  if (await itemIsModerated(env, itemId)) return json({ error: "This published item is no longer available." }, { status: 410 });
  if (item.author_sub === authentication.user.id) return json({ error: "You cannot review your own published item." }, { status: 400 });
  const saved = await env.DB.prepare("SELECT 1 AS saved FROM published_saves WHERE item_id = ? AND user_sub = ?")
    .bind(itemId, authentication.user.id).first();
  if (!saved) return json({ error: "Save this item before rating it." }, { status: 403 });
  const body = await request.json().catch(() => null);
  const rating = Number(body?.rating);
  const review = "";
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return json({ error: "Choose a rating from 1 to 5 stars." }, { status: 400 });
  const now = Date.now();
  await env.DB.prepare(`
    INSERT INTO published_ratings (item_id, user_sub, reviewer_username, reviewer_display_name, rating, review, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(item_id, user_sub) DO UPDATE SET
      reviewer_username = excluded.reviewer_username,
      reviewer_display_name = excluded.reviewer_display_name,
      rating = excluded.rating,
      review = excluded.review,
      updated_at = excluded.updated_at
  `).bind(itemId, authentication.user.id, authentication.user.username, authentication.user.displayName, rating, review, now, now).run();
  return json({ rating: await publishedRating(env, itemId), reviews: await recentPublishedReviews(env, itemId) });
}

async function reportPublishedItem(request, env, itemId) {
  if (!allowedMutation(request)) return json({ error: "Origin not allowed" }, { status: 403 });
  if (!(request.headers.get("Content-Type") || "").includes("application/json")) return json({ error: "JSON required" }, { status: 415 });
  const authentication = await feedbackUser(request, env);
  if (authentication.error) return authentication.error;
  await ensureUserSchema(env);
  const item = await env.DB.prepare("SELECT author_sub FROM published_items WHERE id = ?").bind(itemId).first();
  if (!item) return json({ error: "This published item was not found." }, { status: 404 });
  if (await itemIsModerated(env, itemId)) return json({ error: "This published item is no longer available." }, { status: 410 });
  if (item.author_sub === authentication.user.id) return json({ error: "You cannot report your own published item." }, { status: 400 });
  if (Date.now() - Number(authentication.user.createdAt || 0) < REPORT_ACCOUNT_MIN_AGE_MS) {
    return json({ error: "New accounts can report Community items after 24 hours." }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const reason = cleanPublishedText(body?.reason, 40);
  const details = cleanPublishedText(body?.details, 500);
  if (!["spam", "copyright", "inappropriate", "dangerous", "other"].includes(reason)) return json({ error: "Choose a report reason." }, { status: 400 });
  const now = Date.now();
  await env.DB.prepare(`
    INSERT INTO published_reports (item_id, reporter_sub, reason, details, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'open', ?, ?)
    ON CONFLICT(item_id, reporter_sub) DO UPDATE SET reason = excluded.reason, details = excluded.details, status = 'open', updated_at = excluded.updated_at
  `).bind(itemId, authentication.user.id, reason, details, now, now).run();
  const reportRow = await env.DB.prepare("SELECT COUNT(*) AS count FROM published_reports WHERE item_id = ? AND status = 'open'").bind(itemId).first();
  const saveRow = await env.DB.prepare("SELECT COUNT(*) AS count FROM published_saves WHERE item_id = ?").bind(itemId).first();
  const reportCount = Number(reportRow?.count) || 0;
  const saveCount = Number(saveRow?.count) || 0;
  const reportSaveRatio = reportCount / Math.max(1, saveCount);
  const hiddenForReview = reportCount >= AUTO_HIDE_MIN_REPORTS && reportSaveRatio >= AUTO_HIDE_REPORT_SAVE_RATIO;
  if (hiddenForReview) {
    await env.DB.prepare(`
      INSERT INTO community_moderation (item_id, status, trigger, report_count, save_count, updated_at)
      VALUES (?, 'pending_review', 'report_ratio', ?, ?, ?)
      ON CONFLICT(item_id) DO UPDATE SET status = 'pending_review', trigger = 'report_ratio', report_count = excluded.report_count, save_count = excluded.save_count, updated_at = excluded.updated_at
    `).bind(itemId, reportCount, saveCount, now).run();
  }
  return json({ ok: true, removed: false, hiddenForReview, reportCount, saveCount });
}

async function publishItem(request, env) {
  if (!allowedMutation(request)) return json({ error: "Origin not allowed" }, { status: 403 });
  if (!(request.headers.get("Content-Type") || "").includes("application/json")) return json({ error: "JSON required" }, { status: 415 });
  const announcedSize = Number(request.headers.get("Content-Length") || 0);
  if (announcedSize > MAX_PUBLISHED_PAYLOAD_BYTES + 20000) return json({ error: "This item is too large to publish." }, { status: 413 });
  let user;
  try { user = await sessionAccount(request, env); }
  catch (_) { return json({ error: "Please log in again." }, { status: 401 }); }
  if (!user) return json({ error: "Please log in first." }, { status: 401 });
  if (!user.username || !user.displayName) return json({ error: "Finish creating your profile before publishing." }, { status: 403 });
  const body = await request.json().catch(() => null);
  const kind = body?.kind;
  if (!["study_set", "note"].includes(kind)) return json({ error: "Unsupported published item type." }, { status: 400 });
  const sourceId = cleanPublishedText(body?.sourceId, 120);
  const title = cleanPublishedText(body?.title, 100);
  if (typeof body?.summary === "string" && body.summary.length > 280) return json({ error: "Keep the description at 280 characters or fewer." }, { status: 400 });
  const summary = cleanPublishedText(body?.summary, 280);
  if (!sourceId || !title || !body?.payload || typeof body.payload !== "object" || Array.isArray(body.payload)) return json({ error: "This item is missing required information." }, { status: 400 });
  if (kind === "study_set" && ![body.payload.cards, body.payload.questions, body.payload.feynmanPrompts].some((items) => Array.isArray(items) && items.length)) return json({ error: "A study set must contain study material." }, { status: 400 });
  if (kind === "note" && !["drawing", "word"].includes(body.payload?.note?.type)) return json({ error: "Only editable page and open notes can be published." }, { status: 400 });
  const moderationIssue = publicationModerationIssue(body);
  if (moderationIssue) return json({ error: moderationIssue }, { status: 422 });
  const payloadJson = JSON.stringify(body.payload);
  if (new TextEncoder().encode(payloadJson).byteLength > MAX_PUBLISHED_PAYLOAD_BYTES) return json({ error: "This item is too large to publish." }, { status: 413 });
  await ensureUserSchema(env);
  const now = Date.now();
  const existing = await env.DB.prepare("SELECT id FROM published_items WHERE author_sub = ? AND kind = ? AND source_id = ?")
    .bind(user.id, kind, sourceId).first();
  if (!existing) {
    const usage = await env.DB.prepare(`
      SELECT COUNT(*) AS total,
        SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS recent
      FROM published_items WHERE author_sub = ?
    `).bind(now - 60 * 60 * 1000, user.id).first();
    if ((Number(usage?.total) || 0) >= MAX_PUBLISHED_ITEMS_PER_ACCOUNT) return json({ error: "You have reached the public-library item limit." }, { status: 429 });
    if ((Number(usage?.recent) || 0) >= MAX_NEW_PUBLICATIONS_PER_HOUR) return json({ error: "Too many new publications. Please try again later." }, { status: 429 });
  }
  const id = crypto.randomUUID();
  const counts = publishedCounts(kind, body.payload);
  await env.DB.prepare(`
    INSERT INTO published_items (id, author_sub, author_username, author_display_name, kind, source_id, title, summary, card_count, question_count, feynman_count, payload_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(author_sub, kind, source_id) DO UPDATE SET
      author_username = excluded.author_username,
      author_display_name = excluded.author_display_name,
      title = excluded.title,
      summary = excluded.summary,
      card_count = excluded.card_count,
      question_count = excluded.question_count,
      feynman_count = excluded.feynman_count,
      payload_json = excluded.payload_json,
      updated_at = excluded.updated_at
  `).bind(id, user.id, user.username, user.displayName, kind, sourceId, title, summary, counts.cards || 0, counts.questions || 0, counts.feynmanPrompts || 0, payloadJson, now, now).run();
  const row = await env.DB.prepare("SELECT id FROM published_items WHERE author_sub = ? AND kind = ? AND source_id = ?").bind(user.id, kind, sourceId).first();
  return json({ item: { id: row?.id || id, kind, title, updatedAt: now } }, { status: 201 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/auth/google" && request.method === "POST") return await signIn(request, env);
      if (url.pathname === "/api/auth/me" && request.method === "GET") return await currentUser(request, env);
      if (url.pathname === "/api/auth/logout" && request.method === "POST") return await signOut(request, env);
      if (url.pathname === "/api/account/username/check" && request.method === "GET") return await checkUsername(request, env);
      if (url.pathname === "/api/account/profile" && request.method === "POST") return await createProfile(request, env);
      if (url.pathname === "/api/account/profile/privacy" && request.method === "POST") return await updateProfilePrivacy(request, env);
      if (url.pathname === "/api/account/progress" && request.method === "GET") return await getSyncedProgress(request, env);
      if (url.pathname === "/api/account/progress" && request.method === "PUT") return await saveSyncedProgress(request, env);
      const assetId = accountAssetId(url.pathname);
      if (assetId && ["GET", "PUT", "DELETE"].includes(request.method)) return await accountAsset(request, env, assetId);
      if (url.pathname === "/api/account" && request.method === "DELETE") return await deleteAccount(request, env);
      if (url.pathname.startsWith("/api/community/profiles/") && request.method === "GET") return await getCommunityProfile(request, env, decodeURIComponent(url.pathname.slice("/api/community/profiles/".length)));
      if (url.pathname === "/api/community/items" && request.method === "GET") return await listPublishedItems(request, env);
      if (url.pathname === "/api/community/mine" && request.method === "GET") return await listMyPublishedItems(request, env);
      if (url.pathname.match(/^\/api\/community\/items\/[^/]+\/add$/) && request.method === "POST") return await recordPublishedAdd(request, env, decodeURIComponent(url.pathname.split("/")[4]));
      if (url.pathname.match(/^\/api\/community\/items\/[^/]+\/review$/) && request.method === "POST") return await reviewPublishedItem(request, env, decodeURIComponent(url.pathname.split("/")[4]));
      if (url.pathname.match(/^\/api\/community\/items\/[^/]+\/report$/) && request.method === "POST") return await reportPublishedItem(request, env, decodeURIComponent(url.pathname.split("/")[4]));
      if (url.pathname.match(/^\/api\/community\/items\/[^/]+$/) && request.method === "DELETE") return await unpublishItem(request, env, decodeURIComponent(url.pathname.split("/")[4]));
      if (url.pathname.startsWith("/api/community/items/") && request.method === "GET") return await getPublishedItem(request, env, decodeURIComponent(url.pathname.slice("/api/community/items/".length)));
      if (url.pathname === "/api/community/publish" && request.method === "POST") return await publishItem(request, env);
      if (url.pathname.startsWith("/api/")) return json({ error: "Not found" }, { status: 404 });
      return securedAssetResponse(await env.ASSETS.fetch(request));
    } catch (error) {
      console.error("Account request failed", error?.message || error);
      return json({ error: "The account service is temporarily unavailable." }, { status: 500 });
    }
  },
};
