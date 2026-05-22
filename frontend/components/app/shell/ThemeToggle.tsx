"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  align?: "start" | "center" | "end";
  className?: string;
}

export function ThemeToggle({ align = "end", className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // next-themes can't read the theme during SSR — wait for hydration
  // before swapping the icon.
  useEffect(() => setMounted(true), []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Changer le thème"
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "rounded-full active:scale-95 transition-transform",
          className,
        )}
      >
        {mounted ? (
          <>
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </>
        ) : (
          <span className="h-4 w-4" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-[160px]">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          aria-current={theme === "light"}
        >
          <Sun className="mr-2 h-4 w-4" /> Clair
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          aria-current={theme === "dark"}
        >
          <Moon className="mr-2 h-4 w-4" /> Sombre
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          aria-current={theme === "system"}
        >
          <Monitor className="mr-2 h-4 w-4" /> Système
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
