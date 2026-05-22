"use client";

import { useEffect } from "react";
import { useUIStore } from "@/stores/ui.store";

/**
 * Set the page title shown in the SaaS header. Call once at the top of
 * each (app) page. Optionally pass a one-line description.
 */
export function usePageTitle(title: string, description?: string | null) {
  const setPageTitle = useUIStore((s) => s.setPageTitle);
  useEffect(() => {
    setPageTitle(title, description ?? null);
  }, [title, description, setPageTitle]);
}
