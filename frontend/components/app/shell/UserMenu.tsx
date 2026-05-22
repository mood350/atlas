"use client";

import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon, Settings as SettingsIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth.store";
import { logout as logoutRequest } from "@/lib/api/auth";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/axios";

function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function UserMenu() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logoutLocal = useAuthStore((s) => s.logout);

  if (!user) {
    return (
      <div className="flex items-center gap-2 px-2">
        <div className="h-8 w-8 animate-pulse rounded-full bg-foreground/10" />
        <div className="h-3 flex-1 animate-pulse rounded bg-foreground/10" />
      </div>
    );
  }

  async function handleLogout() {
    try {
      await logoutRequest();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      logoutLocal();
      router.replace("/login");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-sidebar-hover">
        <Avatar className="h-8 w-8">
          {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
          <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
            {initials(user.firstName, user.lastName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-foreground">
            {user.firstName} {user.lastName}
          </div>
          <div className="truncate text-[11px] text-foreground-subtle">
            {user.email}
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[220px]">
        <DropdownMenuItem onClick={() => router.push("/settings/profile")}>
          <UserIcon className="mr-2 h-4 w-4" /> Mon profil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings/agency")}>
          <SettingsIcon className="mr-2 h-4 w-4" /> Paramètres de l&apos;agence
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-danger">
          <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
