"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getAccessToken } from "@/lib/auth";
import { useAuthStore } from "@/stores/auth.store";
import { useCurrentUser } from "@/hooks/use-current-user";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const { isLoading, isError } = useCurrentUser();

  useEffect(() => {
    // No token at all → straight to login (preserve return path).
    if (typeof window === "undefined") return;
    const token = getAccessToken();
    if (!token) {
      const back = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/login?back=${back}`);
      return;
    }
    if (isError) {
      const back = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/login?back=${back}`);
    }
  }, [pathname, router, isError]);

  if (!user) {
    if (isLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-foreground-muted" />
        </div>
      );
    }
    // No user yet, no token → redirect already fired in effect.
    return null;
  }

  return <>{children}</>;
}
