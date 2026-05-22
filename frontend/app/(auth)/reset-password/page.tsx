"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/api/auth";
import { extractErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, "8 caractères minimum")
      .regex(/[A-Z]/, "Au moins une majuscule")
      .regex(/[0-9]/, "Au moins un chiffre"),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.newPassword === d.passwordConfirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["passwordConfirm"],
  });

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "", passwordConfirm: "" },
  });

  // Hard-fail when the link is missing the token — the user landed
  // here without going through the email link.
  if (!token) {
    return (
      <Card className="rounded-[18px] border-border-soft bg-surface">
        <CardContent className="space-y-6 px-6 py-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-bg">
            <ShieldAlert className="h-5 w-5 text-danger" />
          </div>
          <div className="space-y-2">
            <h1 className="text-[28px] font-semibold tracking-tight">
              Lien invalide
            </h1>
            <p className="caption-14 text-foreground-muted">
              Ce lien de réinitialisation est incomplet ou a expiré. Demandez un
              nouvel email pour repartir de zéro.
            </p>
          </div>
          <Link
            href="/forgot-password"
            className={cn(
              buttonVariants({ size: "default" }),
              "rounded-full px-5 active:scale-95 transition-transform",
            )}
          >
            Demander un nouveau lien
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="rounded-[18px] border-border-soft bg-surface">
        <CardContent className="space-y-6 px-6 py-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <div className="space-y-2">
            <h1 className="text-[28px] font-semibold tracking-tight">
              Mot de passe modifié
            </h1>
            <p className="caption-14 text-foreground-muted">
              Vous pouvez à présent vous connecter avec votre nouveau mot de
              passe.
            </p>
          </div>
          <Button
            size="lg"
            className="w-full rounded-full active:scale-95 transition-transform"
            onClick={() => router.push("/login")}
          >
            Aller à la connexion
          </Button>
        </CardContent>
      </Card>
    );
  }

  async function onSubmit(values: z.infer<typeof schema>) {
    if (!token) return;
    setSubmitting(true);
    try {
      await resetPassword(token, values.newPassword);
      setDone(true);
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
          <h1 className="text-[28px] font-semibold tracking-tight">
            Nouveau mot de passe
          </h1>
          <p className="caption-14 text-foreground-muted">
            Choisissez un mot de passe sécurisé pour réactiver votre compte.
          </p>
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              autoFocus
              {...form.register("newPassword")}
              aria-invalid={!!form.formState.errors.newPassword}
            />
            {form.formState.errors.newPassword ? (
              <p className="caption-14 text-danger">
                {form.formState.errors.newPassword.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="passwordConfirm">Confirmer</Label>
            <Input
              id="passwordConfirm"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...form.register("passwordConfirm")}
              aria-invalid={!!form.formState.errors.passwordConfirm}
            />
            {form.formState.errors.passwordConfirm ? (
              <p className="caption-14 text-danger">
                {form.formState.errors.passwordConfirm.message}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="w-full rounded-full active:scale-95 transition-transform"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Réinitialisation...
              </>
            ) : (
              "Réinitialiser mon mot de passe"
            )}
          </Button>
        </form>

        <p className="caption-14 text-center text-foreground-muted">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="h-[420px]" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
