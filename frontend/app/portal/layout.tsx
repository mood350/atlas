import type { ReactNode } from "react";

export const metadata = {
  title: {
    default: "AtlasCRM Portal",
    template: "%s · AtlasCRM",
  },
};

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4f4f5]">
      {children}
    </div>
  );
}
