/**
 * Cookie-based auth token helpers.
 *
 * Tokens are stored as `httpOnly`-flagged cookies set by the backend on login,
 * but for the optimistic intercept (read access token to set the Authorization
 * header on the next request) we also keep a non-sensitive copy in a readable
 * cookie. The backend-set httpOnly cookie remains the source of truth.
 */

export const ACCESS_TOKEN_COOKIE = "atlas_access";
export const REFRESH_TOKEN_COOKIE = "atlas_refresh";

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.substring(name.length + 1)) : null;
}

export function setCookie(
  name: string,
  value: string,
  options: { maxAgeSeconds?: number; path?: string; secure?: boolean } = {},
) {
  if (typeof document === "undefined") return;
  const { maxAgeSeconds, path = "/", secure = false } = options;
  const parts = [`${name}=${encodeURIComponent(value)}`, `path=${path}`, "SameSite=Lax"];
  if (maxAgeSeconds !== undefined) parts.push(`max-age=${maxAgeSeconds}`);
  if (secure) parts.push("Secure");
  document.cookie = parts.join("; ");
}

export function clearCookie(name: string, path = "/") {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=${path}; max-age=0; SameSite=Lax`;
}

export function getAccessToken(): string | null {
  return getCookie(ACCESS_TOKEN_COOKIE);
}

export function getRefreshToken(): string | null {
  return getCookie(REFRESH_TOKEN_COOKIE);
}

export function persistTokens(access: string, refresh: string) {
  // Access token: 15 min TTL on backend — match here.
  setCookie(ACCESS_TOKEN_COOKIE, access, { maxAgeSeconds: 15 * 60 });
  // Refresh token: 7 days TTL on backend — match here.
  setCookie(REFRESH_TOKEN_COOKIE, refresh, { maxAgeSeconds: 7 * 24 * 60 * 60 });
}

export function clearTokens() {
  clearCookie(ACCESS_TOKEN_COOKIE);
  clearCookie(REFRESH_TOKEN_COOKIE);
}

interface JwtPayload {
  sub?: string;
  exp?: number;
  iat?: number;
  agencyId?: number;
  roles?: string[];
  [key: string]: unknown;
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(normalized);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string | null, skewSeconds = 30): boolean {
  if (!token) return true;
  const payload = decodeJwt(token);
  if (!payload?.exp) return true;
  const nowSec = Math.floor(Date.now() / 1000);
  return payload.exp - skewSeconds <= nowSec;
}
