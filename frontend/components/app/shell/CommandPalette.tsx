"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  FileSignature,
  FileText,
  FolderKanban,
  Kanban,
  LayoutDashboard,
  Receipt,
  Settings,
  Users,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useUIStore } from "@/stores/ui.store";

const navItems = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { label: "Pipeline CRM", href: "/pipeline", icon: Kanban },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Devis", href: "/quotes", icon: FileText },
  { label: "Contrats", href: "/contracts", icon: FileSignature },
  { label: "Factures", href: "/invoices", icon: Receipt },
  { label: "Projets", href: "/projects", icon: FolderKanban },
  { label: "Rendez-vous", href: "/appointments", icon: Calendar },
];

const actions = [
  { label: "Nouveau client", href: "/clients/new" },
  { label: "Nouveau deal", href: "/pipeline?new=true" },
  { label: "Nouveau devis", href: "/quotes/new" },
];

const settings = [
  { label: "Paramètres de l'agence", href: "/settings/agency", icon: Settings },
  { label: "Membres", href: "/settings/members", icon: Settings },
  { label: "Facturation", href: "/settings/billing", icon: Settings },
];

/**
 * Global ⌘K command palette. Opens with Ctrl/Cmd+K.
 * Phase 2 stub — wires the keyboard shortcut and navigation only.
 * Phase 3+ will plug in fuzzy search across clients/deals/quotes via /api/search.
 */
export function CommandPalette() {
  const router = useRouter();
  const open = useUIStore((s) => s.commandOpen);
  const setOpen = useUIStore((s) => s.setCommandOpen);

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Rechercher un client, un devis, une page..." />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {navItems.map((item) => (
            <CommandItem
              key={item.href}
              value={item.label}
              onSelect={() => go(item.href)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions rapides">
          {actions.map((item) => (
            <CommandItem
              key={item.href}
              value={item.label}
              onSelect={() => go(item.href)}
            >
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Paramètres">
          {settings.map((item) => (
            <CommandItem
              key={item.href}
              value={item.label}
              onSelect={() => go(item.href)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
