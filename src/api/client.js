/**
 * الأولوية: VITE_API_URL إن وُجد صحيحًا.
 * على localhost بدون عنوان صريح: توجيه مباشر إلى الباكند (يتجاوز تعطل بروكسي Vite أحيانًا على ويندوز/OneDrive).
 */
function normalizeApiBase() {
  const raw = String(import.meta.env.VITE_API_URL || '')
    .trim()
    .replace(/\/$/, '');
  if (!raw) return '';
  if (typeof window !== 'undefined') {
    try {
      if (new URL(raw).origin === window.location.origin) {
        return '';
      }
    } catch {
      return '';
    }
  }
  return raw;
}

const API_BASE = normalizeApiBase();

export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (API_BASE) return `${API_BASE}${p}`;
  if (typeof window !== 'undefined') {
    const custom = String(import.meta.env.VITE_LOCAL_BACKEND_ORIGIN || '')
      .trim()
      .replace(/\/$/, '');
    if (custom) return `${custom}${p}`;
    const port = String(import.meta.env.VITE_LOCAL_BACKEND_PORT || '4000').trim();
    const host = window.location.hostname;
    // أثناء التطوير (Vite): الباكند على نفس اسم المضيف والمنفذ 4000 (localhost أو IP الشبكة)
    if (import.meta.env.DEV) {
      return `http://${host}:${port}${p}`;
    }
    if (host === 'localhost' || host === '127.0.0.1') {
      return `http://${host}:${port}${p}`;
    }
  }
  return p;
}

function getAdminToken() {
  return localStorage.getItem('adminToken');
}

function getUserToken() {
  return localStorage.getItem('userToken');
}

/**
 * @param {string} path
 * @param {RequestInit & { admin?: boolean }} options
 */
export async function apiFetch(path, options = {}) {
  const { admin = false, headers = {}, ...rest } = options;
  const h = new Headers(headers);
  const token = admin ? getAdminToken() : getUserToken();
  if (token) {
    h.set('Authorization', `Bearer ${token}`);
  }
  if (rest.body && !(rest.body instanceof FormData)) {
    if (!h.has('Content-Type')) h.set('Content-Type', 'application/json');
  }
  const res = await fetch(apiUrl(path), { ...rest, headers: h });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json.message || json.error || `HTTP ${res.status}`;
    const err = new Error(msg);
    if (json && typeof json === 'object') {
      /** @type {any} */ (err).details = json.errors || null;
      /** @type {any} */ (err).status = res.status;
    }
    throw err;
  }
  if (json.success === false) {
    throw new Error(json.message || 'خطأ من الخادم');
  }
  return json.data !== undefined ? json.data : json;
}
