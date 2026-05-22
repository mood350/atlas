"use client";

import { useAuthStore } from "@/stores/auth.store";

/**
 * Returns the current agency id. Returns null until the auth store
 * has hydrated — guards against the brief gap between mount and
 * `/api/me` resolving. Components should treat null as "not yet
 * ready" and short-circuit their queries via React Query's `enabled`.
 */
export function useAgencyId(): number | null {
  const agency = useAuthStore((s) => s.agency);
  return agency?.id ?? null;
}

/**
 * Strict variant — throws if no agency is in scope. Use only inside
 * mutation handlers or event callbacks where we know the agency must
 * exist (the caller is wrapped in AuthGuard).
 */
export function requireAgencyId(): number {
  const id = useAuthStore.getState().agency?.id;
  if (!id) throw new Error("No agency in scope");
  return id;
}
