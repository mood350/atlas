"use client";

import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Download,
  FileText,
  FolderKanban,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/use-page-title";
import { useAnalyticsDashboard } from "@/hooks/use-analytics";
import { requireAgencyId } from "@/hooks/use-agency";
import { downloadAnalyticsCsv } from "@/lib/api/analytics";
import { formatCurrency, formatNumber } from "@/lib/format";
import { extractErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import type { MonthlyRevenue } from "@/types/api";

const PERIODS = [
  { label: "7 j", value: 7 },
  { label: "30 j", value: 30 },
  { label: "90 j", value: 90 },
  { label: "365 j", value: 365 },
] as const;

const MONTH_LABELS = [
  "", "Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
  "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc",
];

function KpiCard({
  label,
  value,
  hint,
  icon,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  trend?: { direction: "up" | "down"; value: string };
}) {
  return (
    <Card className="rounded-[18px] border-border-soft">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          {trend ? (
            <span
              className={cn(
                "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-medium",
                trend.direction === "up"
                  ? "bg-success-bg text-success"
                  : "bg-danger-bg text-danger",
              )}
            >
              {trend.direction === "up" ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {trend.value}
            </span>
          ) : null}
        </div>
        <div className="mt-4 space-y-1">
          <p className="caption-14 text-foreground-muted">{label}</p>
          <p className="text-[28px] font-semibold leading-none tracking-tight text-foreground">
            {value}
          </p>
          {hint ? (
            <p className="caption-14 text-foreground-subtle">{hint}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function RevenueChart({ months }: { months: MonthlyRevenue[] }) {
  if (months.length === 0) {
    return (
      <p className="py-8 text-center caption-14 text-foreground-muted">
        Aucune donnée de revenus pour cette période.
      </p>
    );
  }

  const max = Math.max(...months.map((m) => m.amount));
  const display = months.slice(-12);

  return (
    <div className="flex h-[200px] items-end gap-1.5">
      {display.map((m, i) => {
        const height = max > 0 ? (m.amount / max) * 100 : 0;
        return (
          <div key={i} className="group flex flex-1 flex-col items-center gap-1">
            <div className="w-full flex-1 flex items-end">
              <div
                className="w-full rounded-t-md bg-primary/70 transition-all group-hover:bg-primary"
                style={{ height: `${height}%`, minHeight: height > 0 ? 4 : 0 }}
                title={`${MONTH_LABELS[m.month]} ${m.year} : ${formatCurrency(m.amount, "XOF")}`}
              />
            </div>
            <span className="text-[10px] text-foreground-subtle">
              {MONTH_LABELS[m.month]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  usePageTitle("Analytics", "Performance de votre agence");

  const [days, setDays] = useState(30);
  const { data, isLoading } = useAnalyticsDashboard(days);

  async function handleExport() {
    try {
      const agencyId = requireAgencyId();
      const blob = await downloadAnalyticsCsv(agencyId, days);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${days}j.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setDays(p.value)}
              className={cn(
                "rounded-full px-3 py-1 text-[13px] font-medium transition-colors",
                days === p.value
                  ? "bg-foreground text-background"
                  : "text-foreground-muted hover:bg-background-muted hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          onClick={handleExport}
          className="rounded-full active:scale-95 transition-transform"
        >
          <Download className="mr-2 h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Revenue KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-[18px] border-border-soft">
              <CardContent className="p-6">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="mt-4 h-6 w-24" />
                <Skeleton className="mt-1 h-8 w-32" />
              </CardContent>
            </Card>
          ))
        ) : data ? (
          <>
            <KpiCard
              label="MRR"
              value={formatCurrency(data.revenue.mrr, "XOF")}
              hint="Revenus mensuels récurrents"
              icon={<Banknote className="h-5 w-5" />}
            />
            <KpiCard
              label="CA encaissé"
              value={formatCurrency(data.revenue.totalPaidInPeriod, "XOF")}
              hint={`Sur les ${days} derniers jours`}
              icon={<Banknote className="h-5 w-5" />}
            />
            <KpiCard
              label="En attente"
              value={formatCurrency(data.revenue.totalPending, "XOF")}
              hint="Factures non réglées"
              icon={<FileText className="h-5 w-5" />}
            />
            <KpiCard
              label="Taux de conversion"
              value={
                data.quotes.conversionRate != null
                  ? `${data.quotes.conversionRate.toFixed(0)} %`
                  : "—"
              }
              hint={`${data.quotes.acceptedInPeriod} devis acceptés`}
              icon={<FileText className="h-5 w-5" />}
            />
          </>
        ) : null}
      </section>

      {/* Charts row */}
      <section className="grid gap-4 lg:grid-cols-5">
        <Card className="rounded-[18px] border-border-soft lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-[17px] font-semibold tracking-tight">
              CA mensuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[220px] w-full rounded-md" />
            ) : data ? (
              <RevenueChart months={data.revenue.revenueByMonth} />
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-[18px] border-border-soft lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-[17px] font-semibold tracking-tight">
              Pipeline CRM
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[220px] w-full rounded-md" />
            ) : data ? (
              <div className="space-y-3 pt-2">
                {[
                  {
                    label: "Deals ouverts",
                    value: formatNumber(data.deals.open),
                    sub: `${formatCurrency(data.deals.forecastAmount, "XOF")} prévisionnel`,
                  },
                  {
                    label: "Deals gagnés",
                    value: formatNumber(data.deals.won),
                    sub: formatCurrency(data.deals.wonAmount, "XOF"),
                  },
                  {
                    label: "Deals perdus",
                    value: formatNumber(data.deals.lost),
                    sub: data.deals.conversionRate != null
                      ? `${data.deals.conversionRate.toFixed(0)} % de conv.`
                      : "",
                  },
                  {
                    label: "Cycle moyen",
                    value: data.deals.avgSalesCycleDays != null
                      ? `${data.deals.avgSalesCycleDays.toFixed(0)} j`
                      : "—",
                    sub: "jours pour closer",
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-foreground">{item.label}</p>
                      {item.sub ? (
                        <p className="text-[12px] text-foreground-muted">{item.sub}</p>
                      ) : null}
                    </div>
                    <span className="text-[18px] font-semibold tabular-nums text-foreground">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      {/* Clients + Projects */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-[18px] border-border-soft">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-[17px] font-semibold tracking-tight">
              <Users className="h-4 w-4 text-foreground-muted" />
              Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-40 w-full rounded-md" />
            ) : data ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] text-foreground-muted">Total clients</p>
                  <span className="font-semibold tabular-nums">{formatNumber(data.clients.total)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[13px] text-foreground-muted">Actifs</p>
                  <span className="font-semibold tabular-nums text-success">{formatNumber(data.clients.active)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[13px] text-foreground-muted">Prospects</p>
                  <span className="font-semibold tabular-nums text-info">{formatNumber(data.clients.prospects)}</span>
                </div>
                {data.clients.topClients.length > 0 ? (
                  <div className="mt-4 border-t border-border pt-3">
                    <p className="caption-14 mb-2 text-foreground-muted">Top clients</p>
                    <ul className="space-y-2">
                      {data.clients.topClients.slice(0, 3).map((c) => (
                        <li key={c.clientId} className="flex items-center justify-between">
                          <span className="text-[13px] font-medium text-foreground truncate">
                            {c.clientName}
                          </span>
                          <span className="ml-4 shrink-0 text-[13px] tabular-nums text-foreground-muted">
                            {formatCurrency(c.totalRevenue, "XOF")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-[18px] border-border-soft">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-[17px] font-semibold tracking-tight">
              <FolderKanban className="h-4 w-4 text-foreground-muted" />
              Projets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-40 w-full rounded-md" />
            ) : data ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] text-foreground-muted">Total projets</p>
                  <span className="font-semibold tabular-nums">{formatNumber(data.projects.total)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[13px] text-foreground-muted">En cours</p>
                  <span className="font-semibold tabular-nums text-info">{formatNumber(data.projects.inProgress)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[13px] text-foreground-muted">En retard</p>
                  <span className="font-semibold tabular-nums text-danger">{formatNumber(data.projects.overdue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[13px] text-foreground-muted">Terminés</p>
                  <span className="font-semibold tabular-nums text-success">{formatNumber(data.projects.done)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <p className="text-[13px] text-foreground-muted">Budget total</p>
                  <span className="font-semibold tabular-nums">
                    {formatCurrency(data.projects.totalBudget, "XOF")}
                  </span>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
