"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/app/shell/Sidebar";
import { Header } from "@/components/app/shell/Header";
import { CommandPalette } from "@/components/app/shell/CommandPalette";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useUIStore } from "@/stores/ui.store";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        {/* Desktop sidebar — fixed 240px rail */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-sidebar-border md:block">
          <Sidebar />
        </aside>

        {/* Mobile sidebar — Sheet drawer */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent
            side="left"
            className="w-[260px] !max-w-[260px] bg-sidebar p-0"
          >
            <Sidebar inDrawer />
          </SheetContent>
        </Sheet>

        {/* Main column — header + content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>

        {/* Global ⌘K palette */}
        <CommandPalette />
      </div>
    </AuthGuard>
  );
}
