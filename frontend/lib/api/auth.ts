import { api } from "../axios";
import { persistTokens, clearTokens } from "../auth";
import type { AuthTokens, User } from "@/types/api";

// ─── Registration ─────────────────────────────────────────────────────
//
// Backend `RegistrationRequest` field names:
//   firstname / lastname  (single-word lowercase, NOT camelCase)
//   email / password
//   phoneNumber           (E.164: +225XXXXXXXX, validated by @Pattern)
//   agencyName            (when creating a new agency)
//   inviteToken           (when joining an existing agency, mutually
//                          exclusive with agencyName)
//   timezone              (Intl.DateTimeFormat().resolvedOptions().timeZone)
//   preferredLanguage     ("fr" by default)
//
// Returns 202 No Content. The user must confirm their email via the
// link they receive before they can log in.

export interface RegisterPayload {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  phoneNumber?: string;
  agencyName?: string;
  inviteToken?: string;
  timezone?: string;
  preferredLanguage?: string;
}

export async function register(payload: RegisterPayload): Promise<void> {
  await api.post("/api/auth/register", payload);
}

export async function confirmAccount(token: string): Promise<string> {
  const { data } = await api.get<string>("/api/auth/confirm", {
    params: { token },
  });
  return data;
}

// ─── Login ────────────────────────────────────────────────────────────
//
// Backend returns `{ access_token, refresh_token }` (snake_case via
// @JsonProperty). The user record is NOT inlined — we fetch /api/me
// separately so the auth store stays in sync with the server.

export interface LoginPayload {
  email: string;
  password: string;
}

export async function login(payload: LoginPayload): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>("/api/auth/login", payload);
  persistTokens(data.access_token, data.refresh_token);
  return data;
}

// ─── Logout ───────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  try {
    await api.post("/api/auth/logout");
  } finally {
    clearTokens();
  }
}

// ─── Me ───────────────────────────────────────────────────────────────

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<User>("/api/me");
  return data;
}

// ─── Forgot / reset password ──────────────────────────────────────────
//
// Backend exposes:
//   POST /api/auth/forgot-password?email=...        → 202
//   POST /api/auth/reset-password?token=X&newPassword=Y  → 200 (text)
//
// The reset flow goes through email: the user submits their address,
// receives an email with a link `/reset-password?token=...`, clicks
// it, and lands on the matching frontend page that calls the second
// endpoint with the new password.

export async function forgotPassword(email: string): Promise<void> {
  await api.post("/api/auth/forgot-password", null, { params: { email } });
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  await api.post("/api/auth/reset-password", null, {
    params: { token, newPassword },
  });
}
