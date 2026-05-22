import { cn } from "@/lib/utils";
import type {
  AppointmentStatus,
  ClientStatus,
  ContractStatus,
  DealStatus,
  InvoiceStatus,
  ProjectStatus,
  QuoteStatus,
} from "@/types/api";

type AnyStatus =
  | ClientStatus
  | DealStatus
  | QuoteStatus
  | ContractStatus
  | InvoiceStatus
  | ProjectStatus
  | AppointmentStatus;

const map: Record<AnyStatus, { label: string; className: string }> = {
  // ─── Client ──────────────────────────────────────────────
  PROSPECT: { label: "Prospect", className: "bg-info-bg text-info" },
  ACTIVE: { label: "Actif", className: "bg-success-bg text-success" },
  INACTIVE: {
    label: "Inactif",
    className: "bg-background-muted text-foreground-muted",
  },

  // ─── Deal ────────────────────────────────────────────────
  OPEN: { label: "En cours", className: "bg-info-bg text-info" },
  WON: { label: "Gagné", className: "bg-success-bg text-success" },
  LOST: { label: "Perdu", className: "bg-danger-bg text-danger" },

  // ─── Quote ───────────────────────────────────────────────
  DRAFT: {
    label: "Brouillon",
    className: "bg-background-muted text-foreground-muted",
  },
  SENT: { label: "Envoyé", className: "bg-info-bg text-info" },
  VIEWED: { label: "Vu", className: "bg-info-bg text-info" },
  NEGOTIATING: { label: "En négociation", className: "bg-warning-bg text-warning" },
  ACCEPTED: { label: "Accepté", className: "bg-success-bg text-success" },
  REJECTED: { label: "Refusé", className: "bg-danger-bg text-danger" },
  EXPIRED: {
    label: "Expiré",
    className: "bg-background-muted text-foreground-muted",
  },
  INVOICED: { label: "Facturé", className: "bg-success-bg text-success" },

  // ─── Contract ────────────────────────────────────────────
  SIGNED: { label: "Signé", className: "bg-success-bg text-success" },
  CANCELLED: { label: "Annulé", className: "bg-danger-bg text-danger" },

  // ─── Invoice ─────────────────────────────────────────────
  PARTIALLY_PAID: { label: "Partielle", className: "bg-warning-bg text-warning" },
  PAID: { label: "Payée", className: "bg-success-bg text-success" },
  OVERDUE: { label: "En retard", className: "bg-danger-bg text-danger" },

  // ─── Project ─────────────────────────────────────────────
  PLANNING: { label: "Planification", className: "bg-info-bg text-info" },
  IN_PROGRESS: { label: "En cours", className: "bg-info-bg text-info" },
  ON_HOLD: { label: "En pause", className: "bg-warning-bg text-warning" },
  DELIVERED: { label: "Livré", className: "bg-success-bg text-success" },
  REVIEW: { label: "En révision", className: "bg-warning-bg text-warning" },
  DONE: { label: "Terminé", className: "bg-success-bg text-success" },

  // ─── Appointment ─────────────────────────────────────────
  PENDING: { label: "En attente", className: "bg-warning-bg text-warning" },
  CONFIRMED: { label: "Confirmé", className: "bg-info-bg text-info" },
  COMPLETED: { label: "Terminé", className: "bg-success-bg text-success" },
  NO_SHOW: { label: "Absent", className: "bg-danger-bg text-danger" },
};

interface StatusBadgeProps {
  status: AnyStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const entry = map[status];
  if (!entry) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        entry.className,
        className,
      )}
    >
      {entry.label}
    </span>
  );
}
