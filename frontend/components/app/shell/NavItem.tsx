"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: string | number;
  exact?: boolean;
  onNavigate?: () => void;
}

export function NavItem({
  href,
  icon: Icon,
  label,
  badge,
  exact = false,
  onNavigate,
}: NavItemProps) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group/nav relative flex items-center gap-3 rounded-md px-3 py-2 text-[14px] font-medium transition-colors",
        "hover:bg-sidebar-hover",
        active
          ? "bg-sidebar-active text-sidebar-active-foreground"
          : "text-foreground-muted hover:text-foreground",
      )}
    >
      {/* Active border-left signal */}
      {active ? (
        <span
          className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-sidebar-active-border"
          aria-hidden
        />
      ) : null}
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined ? (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none",
            active
              ? "bg-primary/10 text-primary"
              : "bg-background-muted text-foreground-muted",
          )}
        >
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
