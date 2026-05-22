import { api } from "../axios";
import type { AnalyticsDashboard, RevenueMetrics } from "@/types/api";

export async function getAnalyticsDashboard(
  agencyId: number,
  days = 30,
): Promise<AnalyticsDashboard> {
  const { data } = await api.get<AnalyticsDashboard>(
    `/api/agencies/${agencyId}/analytics/dashboard`,
    { params: { days } },
  );
  return data;
}

export async function getRevenueMetrics(
  agencyId: number,
  days = 30,
): Promise<RevenueMetrics> {
  const { data } = await api.get<RevenueMetrics>(
    `/api/agencies/${agencyId}/analytics/revenue`,
    { params: { days } },
  );
  return data;
}

export async function downloadAnalyticsCsv(
  agencyId: number,
  days = 30,
): Promise<Blob> {
  const { data } = await api.get<Blob>(
    `/api/agencies/${agencyId}/analytics/export`,
    { params: { days }, responseType: "blob" },
  );
  return data;
}
