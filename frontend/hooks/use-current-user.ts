"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "@/lib/api/auth";
import { getAccessToken } from "@/lib/auth";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Subscribes to the current user. Fires `/api/me` once when there's a
 * token but no user in the store (typical on hard refresh). Keeps the
 * Zustand store in sync with the server's view of the session.
 */
export function useCurrentUser() {
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);

  const hasToken = typeof window !== "undefined" && !!getAccessToken();

  const query = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    enabled: hasToken && !user,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (query.data) setSession(query.data);
  }, [query.data, setSession]);

  return {
    user: user ?? query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
