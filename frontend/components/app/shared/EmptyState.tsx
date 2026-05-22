import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Standard empty state — used wherever a list/table/board has no data.
 * Centered icon + title + 1-line description + optional CTA.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[18px] border border-dashed border-border-soft bg-background-soft px-6 py-12 text-center",
        className,
      )}
    >
      {Icon ? (
        <div
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-background-muted text-foreground-muted"
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <h3 className="text-[17px] font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      {description ? (
        <p className="caption-14 mt-1 max-w-sm text-foreground-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
