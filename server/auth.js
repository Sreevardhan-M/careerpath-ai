// Password hashing (scrypt), opaque session tokens (stored hashed) and a small login rate limiter.
import { scryptSync, randomBytes, timingSafeEqual, createHash } from 'node:crypto';

const SESSION_DAYS = 30;
export const COOKIE = 'cp_session';

export function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, salt, expectedHex) {
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

const sha = (t) => createHash('sha256').update(t).digest('hex');

export function createSession(db, userId) {
  const token = randomBytes(32).toString('base64url');
  const expires = Date.now() + SESSION_DAYS * 86400000;
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(sha(token), userId, expires);
  return { token, maxAge: SESSION_DAYS * 86400 };
}

export function userFromToken(db, token) {
  if (!token) return null;
  const row = db.prepare('SELECT s.user_id, s.expires_at, u.email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?').get(sha(token));
  if (!row) return null;
  if (row.expires_at < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha(token));
    return null;
  }
  return { id: row.user_id, email: row.email };
}

export function destroySession(db, token) {
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha(token));
}

export function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function cookieHeader(token, maxAge, secure) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

// Fixed-window limiter: 10 attempts per 15 minutes per key.
const attempts = new Map();
export function tooManyAttempts(key) {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || rec.reset < now) { attempts.set(key, { n: 1, reset: now + 15 * 60000 }); return false; }
  rec.n += 1;
  return rec.n > 10;
}
export function clearAttempts(key) { attempts.delete(key); }
