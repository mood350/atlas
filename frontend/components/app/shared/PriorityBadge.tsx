import type { DealPriority } from "@/types/api";
import { cn } from "@/lib/utils";

const priorityStyles: Record<
  DealPriority,
  { label: string; chip: string; dot: string; border: string }
> = {
  LOW: {
    label: "Faible",
    chip: "bg-background-muted text-foreground-muted",
    dot: "bg-foreground-subtle",
    border: "border-l-foreground-subtle/40",
  },
  MEDIUM: {
    label: "Moyenne",
    chip: "bg-info-bg text-info",
    dot: "bg-info",
    border: "border-l-info",
  },
  HIGH: {
    label: "Haute",
    chip: "bg-warning-bg text-warning",
    dot: "bg-warning",
    border: "border-l-warning",
  },
  URGENT: {
    label: "Urgente",
    chip: "bg-danger-bg text-danger",
    dot: "bg-danger",
    border: "border-l-danger",
  },
};

interface PriorityBadgeProps {
  priority: DealPriority;
  variant?: "chip" | "dot";
  className?: string;
}

export function PriorityBadge({
  priority,
  variant = "chip",
  className,
}: PriorityBadgeProps) {
  const styles = priorityStyles[priority];

  if (variant === "dot") {
    return (
      <span
        className={cn("inline-flex items-center gap-1.5", className)}
        aria-label={`Priorité ${styles.label.toLowerCase()}`}
      >
        <span className={cn("h-2 w-2 rounded-full", styles.dot)} aria-hidden />
        <span className="caption-14 text-foreground-muted">{styles.label}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        styles.chip,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} aria-hidden />
      {styles.label}
    </span>
  );
}

/** Returns the Tailwind class for the deal-card border-left signal. */
export function priorityBorderClass(priority: DealPriority): string {
  return priorityStyles[priority].border;
}
