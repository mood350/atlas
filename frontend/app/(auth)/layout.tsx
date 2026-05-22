import Link from "next/link";
import { ThemeToggle } from "@/components/app/shell/ThemeToggle";
import { Logo } from "@/components/app/shell/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background-soft text-foreground">
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/" aria-label="Retour à l'accueil">
          <Logo size="md" />
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex min-h-[calc(100vh-72px)] items-start justify-center px-6 pb-16">
        <div className="w-full max-w-[440px]">{children}</div>
      </main>
    </div>
  );
}
