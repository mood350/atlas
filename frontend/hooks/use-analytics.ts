"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAnalyticsDashboard,
  getRevenueMetrics,
} from "@/lib/api/analytics";
import { useAgencyId } from "./use-agency";

export function useAnalyticsDashboard(days = 30) {
  const agencyId = useAgencyId();
  return useQuery({
    queryKey: ["analytics-dashboard", agencyId, days],
    queryFn: () => getAnalyticsDashboard(agencyId!, days),
    enabled: !!agencyId,
    staleTime: 5 * 60_000,
  });
}

export function useRevenueMetrics(days = 30) {
  const agencyId = useAgencyId();
  return useQuery({
    queryKey: ["analytics-revenue", agencyId, days],
    queryFn: () => getRevenueMetrics(agencyId!, days),
    enabled: !!agencyId,
    staleTime: 5 * 60_000,
  });
}
