"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  FileText,
  FolderKanban,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/use-page-title";
import { useAnalyticsDashboard } from "@/hooks/use-analytics";
import { useAuthStore } from "@/stores/auth.store";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  hint: string;
  trend?: { direction: "up" | "down"; value: string };
  icon: React.ReactNode;
  loading?: boolean;
}

function KpiCard({ label, value, hint, trend, icon, loading }: KpiCardProps) {
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
          {loading ? (
            <Skeleton className="h-7 w-24" />
          ) : (
            <p className="text-[28px] font-semibold leading-none tracking-tight text-foreground">
              {value}
            </p>
          )}
          <p className="caption-14 text-foreground-subtle">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  usePageTitle(
    "Tableau de bord",
    user ? `Bonjour ${user.firstName}, voici votre activité du jour.` : null,
  );

  const { data, isLoading } = useAnalyticsDashboard(30);
  const currency = "XOF";

  const revenue = data?.revenue;
  const quotes  = data?.quotes;
  const deals   = data?.deals;
  const projects = data?.projects;
  const clients = data?.clients;

  const conversionRate = quotes?.conversionRate;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="CA encaissé (30j)"
          value={formatCurrency(revenue?.totalPaidInPeriod ?? 0, currency)}
          hint={
            revenue && revenue.totalPending > 0
              ? `${formatCurrency(revenue.totalPending, currency)} en attente`
              : "Aucun paiement en attente"
          }
          icon={<Banknote className="h-5 w-5" />}
          loading={isLoading}
        />
        <KpiCard
          label="Devis envoyés (30j)"
          value={formatNumber(quotes?.sentInPeriod ?? 0)}
          hint={
            quotes && quotes.acceptedInPeriod > 0
              ? `${quotes.acceptedInPeriod} accepté${quotes.acceptedInPeriod > 1 ? "s" : ""}`
              : "Aucun devis accepté ce mois"
          }
          icon={<FileText className="h-5 w-5" />}
          loading={isLoading}
        />
        <KpiCard
          label="Projets actifs"
          value={formatNumber(projects?.inProgress ?? 0)}
          hint={
            projects && projects.overdue > 0
              ? `${projects.overdue} en retard`
              : "Tout est dans les temps"
          }
          icon={<FolderKanban className="h-5 w-5" />}
          loading={isLoading}
        />
        <KpiCard
          label="Taux de conversion"
          value={conversionRate != null ? `${Math.round(conversionRate * 100)} %` : "—"}
          hint={
            deals
              ? `${deals.won} gagné${deals.won > 1 ? "s" : ""} · ${deals.lost} perdu${deals.lost > 1 ? "s" : ""}`
              : "Devis acceptés / envoyés"
          }
          icon={<TrendingUp className="h-5 w-5" />}
          loading={isLoading}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <Card className="rounded-[18px] border-border-soft lg:col-span-3">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[17px] font-semibold tracking-tight">
                Chiffre d&apos;affaires — 12 derniers mois
              </h2>
              <span className="caption-14 text-foreground-subtle">
                Total :{" "}
                <span className="font-semibold text-foreground">
                  {formatCurrency(
                    revenue?.revenueByMonth?.reduce((s, m) => s + m.amount, 0) ?? 0,
                    currency,
                  )}
                </span>
              </span>
            </div>
            {isLoading ? (
              <Skeleton className="h-[260px] w-full rounded-md" />
            ) : revenue?.revenueByMonth && revenue.revenueByMonth.length > 0 ? (
              <RevenueChart data={revenue.revenueByMonth} currency={currency} />
            ) : (
              <div className="flex h-[260px] items-center justify-center rounded-md bg-background-muted">
                <p className="caption-14 text-foreground-subtle">
                  Aucun encaissement enregistré sur les 12 derniers mois.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[18px] border-border-soft lg:col-span-2">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[17px] font-semibold tracking-tight">Deals</h2>
              <span className="caption-14 text-foreground-subtle">Pipeline CRM</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-[260px] w-full rounded-md" />
            ) : (
              <div className="space-y-3">
                <StatRow label="Ouverts"       value={formatNumber(deals?.open ?? 0)} />
                <StatRow label="Gagnés"        value={formatNumber(deals?.won ?? 0)} accent="success" />
                <StatRow label="Perdus"        value={formatNumber(deals?.lost ?? 0)} accent="danger" />
                <div className="border-t border-border my-3" />
                <StatRow
                  label="CA gagné"
                  value={formatCurrency(deals?.wonAmount ?? 0, currency)}
                />
                <StatRow
                  label="Prévisionnel"
                  value={formatCurrency(deals?.forecastAmount ?? 0, currency)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-[18px] border-border-soft">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[17px] font-semibold tracking-tight">Clients</h2>
              <Users className="h-4 w-4 text-foreground-muted" />
            </div>
            {isLoading ? (
              <Skeleton className="h-24 w-full rounded-md" />
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <MiniStat label="Total"     value={formatNumber(clients?.total ?? 0)} />
                <MiniStat label="Actifs"    value={formatNumber(clients?.active ?? 0)} />
                <MiniStat label="Prospects" value={formatNumber(clients?.prospects ?? 0)} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[18px] border-border-soft">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[17px] font-semibold tracking-tight">Top clients</h2>
              <span className="caption-14 text-foreground-subtle">Par CA encaissé</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-24 w-full rounded-md" />
            ) : clients?.topClients && clients.topClients.length > 0 ? (
              <ul className="space-y-2">
                {clients.topClients.slice(0, 5).map((c) => (
                  <li key={c.clientId} className="flex items-center justify-between text-[13px]">
                    <span className="line-clamp-1 text-foreground">{c.clientName}</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {formatCurrency(c.totalRevenue, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="caption-14 text-foreground-muted">
                Pas encore de revenus enregistrés.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StatRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "success" | "danger";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="caption-14 text-foreground-muted">{label}</span>
      <span
        className={cn(
          "text-[14px] font-semibold tabular-nums",
          accent === "success" && "text-success",
          accent === "danger" && "text-danger",
          !accent && "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background-muted p-3">
      <p className="caption-14 text-foreground-muted">{label}</p>
      <p className="mt-1 text-[20px] font-semibold tracking-tight text-foreground">{value}</p>
    </div>
  );
}

function RevenueChart({
  data,
  currency,
}: {
  data: { year: number; month: number; amount: number }[];
  currency: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.amount));
  const monthLabel = (m: number) =>
    ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"][m - 1] ?? "";

  return (
    <div className="flex h-[260px] items-end gap-1.5">
      {data.map((d, i) => {
        const heightPct = (d.amount / max) * 100;
        return (
          <div key={`${d.year}-${d.month}-${i}`} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className="w-full rounded-t bg-primary/80 transition-colors hover:bg-primary"
              style={{ height: `${Math.max(heightPct, 1)}%` }}
              title={`${monthLabel(d.month)} ${d.year} — ${formatCurrency(d.amount, currency)}`}
              aria-label={`${monthLabel(d.month)} ${d.year}: ${formatCurrency(d.amount, currency)}`}
            />
            <span className="text-[10px] text-foreground-subtle">{monthLabel(d.month)}</span>
          </div>
        );
      })}
    </div>
  );
}
