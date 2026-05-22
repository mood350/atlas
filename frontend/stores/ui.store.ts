import { create } from "zustand";

interface UIState {
  pageTitle: string;
  pageDescription: string | null;
  sidebarOpen: boolean;
  commandOpen: boolean;
  setPageTitle: (title: string, description?: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setCommandOpen: (open: boolean) => void;
  toggleCommand: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  pageTitle: "Tableau de bord",
  pageDescription: null,
  sidebarOpen: false,
  commandOpen: false,
  setPageTitle: (title, description = null) =>
    set({ pageTitle: title, pageDescription: description }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setCommandOpen: (open) => set({ commandOpen: open }),
  toggleCommand: () => set((s) => ({ commandOpen: !s.commandOpen })),
}));
