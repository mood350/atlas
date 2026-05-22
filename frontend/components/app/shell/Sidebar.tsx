"use client";

import {
  Calendar,
  FileSignature,
  FileText,
  FolderKanban,
  HelpCircle,
  Kanban,
  LayoutDashboard,
  Receipt,
  Settings,
  Users,
} from "lucide-react";
import { useUIStore } from "@/stores/ui.store";
import { Logo } from "./Logo";
import { NavItem } from "./NavItem";
import { AgencyBadge } from "./AgencyBadge";
import { UserMenu } from "./UserMenu";
import { Separator } from "@/components/ui/separator";

const primaryNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord", exact: true },
  { href: "/pipeline", icon: Kanban, label: "Pipeline CRM" },
  { href: "/clients", icon: Users, label: "Clients" },
  { href: "/quotes", icon: FileText, label: "Devis" },
  { href: "/contracts", icon: FileSignature, label: "Contrats" },
  { href: "/invoices", icon: Receipt, label: "Factures" },
  { href: "/projects", icon: FolderKanban, label: "Projets" },
  { href: "/appointments", icon: Calendar, label: "Rendez-vous" },
] as const;

const secondaryNav = [
  { href: "/settings", icon: Settings, label: "Paramètres" },
  { href: "/support", icon: HelpCircle, label: "Support" },
] as const;

interface SidebarProps {
  inDrawer?: boolean;
}

/**
 * Renders the SaaS sidebar. Used both as the desktop fixed rail and
 * as the content of the mobile Sheet drawer (`inDrawer`). Closing the
 * drawer is delegated to the parent via the UI store.
 */
export function Sidebar({ inDrawer = false }: SidebarProps) {
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const closeDrawer = inDrawer ? () => setSidebarOpen(false) : undefined;

  return (
    <aside
      className="flex h-full w-full flex-col bg-sidebar text-foreground"
      aria-label="Navigation principale"
    >
      {/* Header — logo + agency switcher */}
      <div className="flex flex-col gap-3 px-4 pb-4 pt-5">
        <Logo size="md" />
        <AgencyBadge />
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Primary nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {primaryNav.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            exact={"exact" in item ? item.exact : false}
            onNavigate={closeDrawer}
          />
        ))}
      </nav>

      {/* Footer — secondary nav + user menu */}
      <div className="space-y-0.5 px-2 pb-3 pt-2">
        <Separator className="mb-3 bg-sidebar-border" />
        {secondaryNav.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            onNavigate={closeDrawer}
          />
        ))}
        <div className="pt-3">
          <UserMenu />
        </div>
      </div>
    </aside>
  );
}
