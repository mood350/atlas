"use client";

import { Bell, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { useUIStore } from "@/stores/ui.store";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

/**
 * SaaS top header. Sticky, 64px tall, blurred translucent background.
 * Holds: mobile hamburger, current page title, ⌘K trigger, bell, theme toggle.
 */
export function Header({ className }: HeaderProps) {
  const pageTitle = useUIStore((s) => s.pageTitle);
  const pageDescription = useUIStore((s) => s.pageDescription);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border-soft bg-background/80 px-4 backdrop-blur-xl md:px-6",
        className,
      )}
    >
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Ouvrir le menu"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Page title */}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[17px] font-semibold tracking-tight text-foreground">
          {pageTitle}
        </h1>
        {pageDescription ? (
          <p className="caption-14 truncate text-foreground-muted">
            {pageDescription}
          </p>
        ) : null}
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-1">
        {/* Search trigger — opens ⌘K */}
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          aria-label="Rechercher (Ctrl+K)"
          className={cn(
            "hidden h-9 items-center gap-2 rounded-full border border-border bg-surface px-3 text-[13px] text-foreground-muted",
            "transition-colors hover:bg-background-muted hover:text-foreground",
            "sm:flex md:min-w-[220px]",
          )}
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Rechercher...</span>
          <kbd className="hidden items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] text-foreground-muted md:flex">
            <span className="text-[12px]">⌘</span>K
          </kbd>
        </button>

        {/* Mobile search icon */}
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          aria-label="Rechercher"
          onClick={() => setCommandOpen(true)}
        >
          <Search className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {/* Unread dot — wired in Phase 6 */}
          <span
            className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary"
            aria-hidden
          />
        </Button>

        <ThemeToggle />
      </div>
    </header>
  );
}
