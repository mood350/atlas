"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  FileText,
  FolderKanban,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/use-page-title";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  hint: string;
  trend?: { direction: "up" | "down"; value: string };
  icon: React.ReactNode;
}

function KpiCard({ label, value, hint, trend, icon }: KpiCardProps) {
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

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="CA ce mois"
          value="—"
          hint="Données disponibles après le premier paiement"
          icon={<Banknote className="h-5 w-5" />}
        />
        <KpiCard
          label="Devis en attente"
          value="0"
          hint="Aucun devis envoyé"
          icon={<FileText className="h-5 w-5" />}
        />
        <KpiCard
          label="Projets actifs"
          value="0"
          hint="Démarrer un projet depuis un devis accepté"
          icon={<FolderKanban className="h-5 w-5" />}
        />
        <KpiCard
          label="Taux de conversion"
          value="—"
          hint="Calculé automatiquement"
          icon={<TrendingUp className="h-5 w-5" />}
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
                Bientôt disponible
              </span>
            </div>
            <Skeleton className="h-[260px] w-full rounded-md" />
          </CardContent>
        </Card>

        <Card className="rounded-[18px] border-border-soft lg:col-span-2">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[17px] font-semibold tracking-tight">
                Deals par étape
              </h2>
              <span className="caption-14 text-foreground-subtle">Pipeline CRM</span>
            </div>
            <Skeleton className="h-[260px] w-full rounded-md" />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-[18px] border-border-soft">
          <CardContent className="p-6">
            <h2 className="mb-4 text-[17px] font-semibold tracking-tight">
              Derniers devis
            </h2>
            <p className="caption-14 text-foreground-muted">
              Vous n&apos;avez pas encore de devis. Créez votre premier devis depuis le
              menu latéral.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[18px] border-border-soft">
          <CardContent className="p-6">
            <h2 className="mb-4 text-[17px] font-semibold tracking-tight">
              Deals inactifs
            </h2>
            <p className="caption-14 text-foreground-muted">
              Aucun deal sans activité. Tout est sous contrôle.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
