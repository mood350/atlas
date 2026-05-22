"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/lib/api/auth";
import { extractErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";

const requestSchema = z.object({
  email: z.string().email("Adresse email invalide"),
});

export default function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const form = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: z.infer<typeof requestSchema>) {
    setSubmitting(true);
    try {
      await forgotPassword(values.email);
      setSubmittedEmail(values.email);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (submittedEmail) {
    return (
      <Card className="rounded-[18px] border-border-soft bg-surface">
        <CardContent className="space-y-6 px-6 py-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-[28px] font-semibold tracking-tight">
              Vérifiez votre boîte mail
            </h1>
            <p className="caption-14 text-foreground-muted">
              Si <strong className="text-foreground">{submittedEmail}</strong> est
              associé à un compte AtlasCRM, vous recevrez un lien de
              réinitialisation dans quelques instants.
            </p>
          </div>
          <p className="caption-14 text-foreground-subtle">
            Pas reçu ? Vérifiez votre dossier spam, puis réessayez.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "rounded-full",
              )}
            >
              Retour à la connexion
            </Link>
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => {
                setSubmittedEmail(null);
                form.reset();
              }}
            >
              Renvoyer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[18px] border-border-soft bg-surface">
      <CardContent className="space-y-6 px-6 py-8">
        <div className="space-y-2 text-center">
          <h1 className="text-[28px] font-semibold tracking-tight">
            Mot de passe oublié
          </h1>
          <p className="caption-14 text-foreground-muted">
            Saisissez votre email — nous vous enverrons un lien sécurisé pour
            créer un nouveau mot de passe.
          </p>
        </div>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="vous@agence.ci"
              autoComplete="email"
              autoFocus
              {...form.register("email")}
              aria-invalid={!!form.formState.errors.email}
            />
            {form.formState.errors.email ? (
              <p className="caption-14 text-danger">
                {form.formState.errors.email.message}
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi...
              </>
            ) : (
              "Envoyer le lien"
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
