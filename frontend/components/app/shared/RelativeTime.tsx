"use client";

import { useEffect, useState } from "react";
import { formatRelativeTime, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface RelativeTimeProps {
  date: string | Date | null | undefined;
  className?: string;
  /** Refresh cadence in ms. Defaults to 60s — fine for "il y a 3 min". */
  refreshIntervalMs?: number;
}

/**
 * Renders a relative timestamp ("il y a 3 jours") that refreshes
 * itself on a timer. Falls back to "—" if the date is invalid.
 * Hydration-safe: server and first client render produce the same
 * label using the same date input.
 */
export function RelativeTime({
  date,
  className,
  refreshIntervalMs = 60_000,
}: RelativeTimeProps) {
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), refreshIntervalMs);
    return () => clearInterval(id);
  }, [refreshIntervalMs]);

  return (
    <time
      dateTime={typeof date === "string" ? date : date?.toISOString()}
      title={formatDateTime(date)}
      className={cn(className)}
    >
      {formatRelativeTime(date)}
    </time>
  );
}
