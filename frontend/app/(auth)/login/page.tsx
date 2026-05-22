"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchMe, login as loginRequest } from "@/lib/api/auth";
import { extractErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/stores/auth.store";

const loginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(8, "Mot de passe requis (8 caractères minimum)"),
});

type LoginValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setSubmitting(true);
    try {
      // Backend's /auth/login only returns tokens — fetch /api/me
      // immediately so the auth store has the user before we redirect.
      await loginRequest(values);
      const user = await fetchMe();
      setSession(user);
      const back = params.get("back");
      const target = back && back.startsWith("/") ? back : "/dashboard";
      router.replace(target);
      toast.success(`Bienvenue, ${user.firstName}`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="rounded-[18px] border-border-soft bg-surface">
      <CardContent className="space-y-6 px-6 py-8">
        <div className="space-y-2 text-center">
          <h1 className="text-[28px] font-semibold tracking-tight">Connexion</h1>
          <p className="caption-14 text-foreground-muted">
            Accédez à votre espace AtlasCRM
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email professionnel</Label>
            <Input
              id="email"
              type="email"
              placeholder="vous@agence.ci"
              autoComplete="email"
              autoFocus
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            {errors.email ? (
              <p className="caption-14 text-danger">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Mot de passe</Label>
              <Link
                href="/forgot-password"
                className="text-[12px] text-primary hover:underline"
              >
                Oublié ?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register("password")}
              aria-invalid={!!errors.password}
            />
            {errors.password ? (
              <p className="caption-14 text-danger">{errors.password.message}</p>
            ) : null}
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full active:scale-95 transition-transform"
            size="lg"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connexion...
              </>
            ) : (
              "Se connecter"
            )}
          </Button>
        </form>

        <p className="caption-14 text-center text-foreground-muted">
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Créer une agence
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-[420px]" />}>
      <LoginForm />
    </Suspense>
  );
}
