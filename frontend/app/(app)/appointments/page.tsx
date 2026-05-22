"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  MoreHorizontal,
  Plus,
  Trash2,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, type DataTableColumn } from "@/components/app/shared/DataTable";
import { StatusBadge } from "@/components/app/shared/StatusBadge";
import { usePageTitle } from "@/hooks/use-page-title";
import {
  useAppointments,
  useAppointmentStats,
  useConfirmAppointment,
  useCompleteAppointment,
  useCancelAppointment,
  useDeleteAppointment,
} from "@/hooks/use-appointments";
import { formatDate } from "@/lib/format";
import { extractErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import type { AppointmentSummary, AppointmentStatus } from "@/types/api";

const statusTabs: { value: AppointmentStatus | null; label: string }[] = [
  { value: null,        label: "Tous" },
  { value: "PENDING",   label: "En attente" },
  { value: "CONFIRMED", label: "Confirmés" },
  { value: "COMPLETED", label: "Terminés" },
  { value: "CANCELLED", label: "Annulés" },
];

const typeLabels: Record<string, string> = {
  DISCOVERY:   "Découverte",
  FOLLOW_UP:   "Suivi",
  DEMO:        "Démo",
  ONBOARDING:  "Onboarding",
  REVIEW:      "Bilan",
  OTHER:       "Autre",
};

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-5 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="caption-14 text-foreground-muted">{label}</p>
        <p className="mt-0.5 text-[20px] font-semibold tabular-nums text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default function AppointmentsPage() {
  usePageTitle("Rendez-vous", "Gérez vos réunions et appels clients");

  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | null>(null);
  const [page, setPage] = useState(0);

  const params = useMemo(
    () => ({ page, size: 20, status: statusFilter ?? undefined }),
    [page, statusFilter],
  );

  const { data, isLoading, isError } = useAppointments(params);
  const { data: stats } = useAppointmentStats();
  const confirmAppt = useConfirmAppointment();
  const completeAppt = useCompleteAppointment();
  const cancelAppt = useCancelAppointment();
  const deleteAppt = useDeleteAppointment();

  const rows = data?.content ?? [];

  async function handleConfirm(appt: AppointmentSummary) {
    try {
      await confirmAppt.mutateAsync(appt.id);
      toast.success("Rendez-vous confirmé");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleComplete(appt: AppointmentSummary) {
    try {
      await completeAppt.mutateAsync(appt.id);
      toast.success("Rendez-vous marqué comme terminé");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleCancel(appt: AppointmentSummary) {
    if (!confirm("Annuler ce rendez-vous ?")) return;
    try {
      await cancelAppt.mutateAsync({ appointmentId: appt.id });
      toast.success("Rendez-vous annulé");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleDelete(appt: AppointmentSummary) {
    if (!confirm("Supprimer ce rendez-vous définitivement ?")) return;
    try {
      await deleteAppt.mutateAsync(appt.id);
      toast.success("Rendez-vous supprimé");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  const columns: DataTableColumn<AppointmentSummary>[] = [
    {
      id: "title",
      header: "Rendez-vous",
      cell: (appt) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">{appt.title}</div>
          <div className="flex items-center gap-1.5 text-[12px] text-foreground-subtle">
            <span>{typeLabels[appt.type] ?? appt.type}</span>
            {appt.clientOrGuestName ? (
              <>
                <span>·</span>
                <span>{appt.clientOrGuestName}</span>
              </>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      id: "member",
      header: "Membre",
      hideOnMobile: true,
      cell: (appt) => (
        <span className="text-[13px] text-foreground-muted">{appt.memberName}</span>
      ),
    },
    {
      id: "datetime",
      header: "Date & heure",
      cell: (appt) => (
        <div>
          <div className="text-[13px] font-medium text-foreground">
            {formatDate(appt.startTime, "EEE d MMM")}
          </div>
          <div className="flex items-center gap-1 text-[12px] text-foreground-muted">
            <Clock className="h-3 w-3" />
            <span>
              {formatDate(appt.startTime, "HH:mm")} — {formatDate(appt.endTime, "HH:mm")}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: "meeting",
      header: "Lien",
      hideOnMobile: true,
      cell: (appt) =>
        appt.meetingUrl ? (
          <a
            href={appt.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[13px] text-primary hover:underline"
          >
            <Video className="h-3.5 w-3.5" />
            Rejoindre
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-[13px] text-foreground-subtle">—</span>
        ),
    },
    {
      id: "status",
      header: "Statut",
      cell: (appt) => <StatusBadge status={appt.status} />,
    },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      cell: (appt) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            onClick={(e) => e.stopPropagation()}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-foreground-muted hover:bg-background-muted hover:text-foreground"
            aria-label="Actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            {appt.status === "PENDING" ? (
              <DropdownMenuItem onClick={() => handleConfirm(appt)}>
                <CheckCircle className="mr-2 h-3.5 w-3.5" />
                Confirmer
              </DropdownMenuItem>
            ) : null}
            {appt.status === "CONFIRMED" ? (
              <DropdownMenuItem onClick={() => handleComplete(appt)}>
                <CheckCircle className="mr-2 h-3.5 w-3.5 text-success" />
                Marquer terminé
              </DropdownMenuItem>
            ) : null}
            {appt.status === "PENDING" || appt.status === "CONFIRMED" ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-danger"
                  onClick={() => handleCancel(appt)}
                >
                  Annuler le RDV
                </DropdownMenuItem>
              </>
            ) : null}
            {appt.status === "CANCELLED" ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-danger"
                  onClick={() => handleDelete(appt)}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Supprimer
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {stats ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Cette semaine"
            value={stats.upcomingThisWeek}
            icon={<Calendar className="h-5 w-5" />}
          />
          <StatCard
            label="En attente"
            value={stats.pending}
            icon={<Clock className="h-5 w-5" />}
          />
          <StatCard
            label="Confirmés"
            value={stats.confirmed}
            icon={<CheckCircle className="h-5 w-5" />}
          />
          <StatCard
            label="Total"
            value={stats.total}
            icon={<Video className="h-5 w-5" />}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => { setStatusFilter(tab.value); setPage(0); }}
              className={cn(
                "rounded-full px-3 py-1 text-[13px] font-medium transition-colors",
                statusFilter === tab.value
                  ? "bg-foreground text-background"
                  : "text-foreground-muted hover:bg-background-muted hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => router.push("/appointments/new")}
          className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-1.5 text-[13px] font-medium text-background hover:opacity-90 transition-opacity active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          Nouveau RDV
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(appt) => appt.id}
        onRowClick={(appt) => router.push(`/appointments/${appt.id}`)}
        isLoading={isLoading}
        isError={isError}
        empty={{
          icon: Calendar,
          title: "Aucun rendez-vous",
          description: "Les rendez-vous pris via votre lien de booking apparaîtront ici.",
        }}
        pagination={
          data
            ? {
                page: data.number,
                size: data.size,
                totalPages: data.totalPages,
                totalElements: data.totalElements,
              }
            : undefined
        }
        onPageChange={setPage}
      />
    </div>
  );
}
