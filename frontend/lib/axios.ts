import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  persistTokens,
} from "./auth";
import type { AuthTokens, ApiError } from "@/types/api";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081";

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// ─────────────────────────────────────────────────────────────────
// Request — attach Bearer if we have one client-side.
// ─────────────────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// ─────────────────────────────────────────────────────────────────
// Response — refresh-token queue: on 401, refresh once and replay
// every request that failed during the refresh.
// ─────────────────────────────────────────────────────────────────
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function flushQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error || !token) reject(error);
    else resolve(token);
  });
  pendingQueue = [];
}

async function refreshAccessToken(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error("No refresh token");

  // Backend reads the refresh token from `Authorization: Bearer ...`
  // (NOT a request body). We use a bare axios call to bypass our own
  // request interceptor that would otherwise stick the access token in.
  const { data } = await axios.post<AuthTokens>(
    `${API_URL}/api/auth/refresh-token`,
    null,
    {
      withCredentials: true,
      headers: { Authorization: `Bearer ${refresh}` },
    },
  );
  persistTokens(data.access_token, data.refresh_token);
  return data.access_token;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const original = error.config as RetryableConfig | undefined;
    const status = error.response?.status;

    // Don't try to refresh on auth endpoints themselves — that loop is unwinnable.
    const url = original?.url ?? "";
    const isAuthEndpoint =
      url.includes("/api/auth/login") ||
      url.includes("/api/auth/refresh-token") ||
      url.includes("/api/auth/register");

    if (status === 401 && original && !original._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (token) => {
              original.headers.set("Authorization", `Bearer ${token}`);
              original._retry = true;
              resolve(api(original));
            },
            reject,
          });
        });
      }

      original._retry = true;
      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        flushQueue(null, newToken);
        original.headers.set("Authorization", `Bearer ${newToken}`);
        return api(original);
      } catch (refreshError) {
        flushQueue(refreshError, null);
        clearTokens();
        if (typeof window !== "undefined") {
          // Hard redirect — we lost the session.
          window.location.assign("/login");
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// ─────────────────────────────────────────────────────────────────
// Convenience helper — turn an Axios error into a user-friendly string.
// ─────────────────────────────────────────────────────────────────
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.message) return data.message;
    if (error.response?.status === 401) return "Session expirée, veuillez vous reconnecter.";
    if (error.response?.status === 403) return "Accès refusé.";
    if (error.response?.status === 404) return "Ressource introuvable.";
    if (!error.response) return "Connexion au serveur impossible.";
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Une erreur est survenue.";
}
