"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./EmptyState";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface DataTableColumn<T> {
  /** Stable key — also used as React key. */
  id: string;
  /** Header label. Pass null to skip the header cell. */
  header: React.ReactNode;
  /** Cell renderer. Receives the row value. */
  cell: (row: T) => React.ReactNode;
  /** Tailwind classes applied to <td> AND <th>. */
  className?: string;
  /** Right-align numeric columns. */
  align?: "left" | "right" | "center";
  /** Hide on small viewports. */
  hideOnMobile?: boolean;
}

export interface PaginationState {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  isError?: boolean;
  /** Renders inside the EmptyState when rows.length === 0. */
  empty?: {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
  };
  pagination?: PaginationState;
  onPageChange?: (page: number) => void;
  /** How many skeleton rows to render while loading. */
  skeletonRows?: number;
}

const alignClass: Record<NonNullable<DataTableColumn<unknown>["align"]>, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  isLoading = false,
  isError = false,
  empty,
  pagination,
  onPageChange,
  skeletonRows = 6,
}: DataTableProps<T>) {
  // Loading skeleton — reuses the same column count so the layout
  // stays put when real data lands.
  if (isLoading && rows.length === 0) {
    return (
      <div className="overflow-hidden rounded-[14px] border border-border-soft bg-surface">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((col) => (
                <TableHead
                  key={col.id}
                  className={cn(
                    "caption-14 font-semibold text-foreground-muted",
                    col.hideOnMobile && "hidden md:table-cell",
                    col.align && alignClass[col.align],
                    col.className,
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: skeletonRows }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell
                    key={col.id}
                    className={cn(col.hideOnMobile && "hidden md:table-cell")}
                  >
                    <Skeleton className="h-4 w-full max-w-[140px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="Impossible de charger les données"
        description="Une erreur est survenue. Réessayez dans un instant."
      />
    );
  }

  if (rows.length === 0 && empty) {
    return (
      <EmptyState
        icon={empty.icon}
        title={empty.title}
        description={empty.description}
        action={empty.action}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-[14px] border border-border-soft bg-surface">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border-soft hover:bg-transparent">
              {columns.map((col) => (
                <TableHead
                  key={col.id}
                  className={cn(
                    "caption-14 h-11 font-semibold text-foreground-muted",
                    col.hideOnMobile && "hidden md:table-cell",
                    col.align && alignClass[col.align],
                    col.className,
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-border-soft last:border-b-0",
                  onRowClick && "cursor-pointer hover:bg-background-soft",
                )}
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.id}
                    className={cn(
                      "py-3 text-[14px] text-foreground",
                      col.hideOnMobile && "hidden md:table-cell",
                      col.align && alignClass[col.align],
                      col.className,
                    )}
                  >
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between px-1 py-1">
          <p className="caption-14 text-foreground-muted">
            Page {pagination.page + 1} sur {pagination.totalPages} —{" "}
            {pagination.totalElements} résultats
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={pagination.page === 0}
              onClick={() => onPageChange?.(pagination.page - 1)}
              aria-label="Page précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={pagination.page >= pagination.totalPages - 1}
              onClick={() => onPageChange?.(pagination.page + 1)}
              aria-label="Page suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
