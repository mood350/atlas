"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/app/shell/ThemeToggle";
import { Logo } from "@/components/app/shell/Logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Fonctionnalités", href: "#features" },
  { label: "Tarifs", href: "#pricing" },
  { label: "Témoignages", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
];

/**
 * Sticky landing nav. Transparent at the top; gains a hairline border
 * and a subtle blur backdrop after scrolling 20px.
 */
export function GlobalNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-colors duration-200",
        scrolled
          ? "border-b border-border-soft bg-background/80 backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" aria-label="Accueil AtlasCRM">
          <Logo size="sm" />
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Navigation principale">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] text-foreground-muted transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden text-[13px] text-foreground-muted transition-colors hover:text-foreground sm:inline"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ size: "default" }),
              "rounded-full px-4 active:scale-95 transition-transform",
            )}
          >
            Essai gratuit
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
