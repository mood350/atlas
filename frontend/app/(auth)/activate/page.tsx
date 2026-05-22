"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2, MailX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { confirmAccount } from "@/lib/api/auth";
import { extractErrorMessage } from "@/lib/axios";

// ─── Auto-confirm when ?token= is present ────────────────────────────────────

function AutoConfirm({ token }: { token: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    confirmAccount(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setErrorMsg(extractErrorMessage(err));
        setStatus("error");
      });
  }, [token]);

  if (status === "loading") {
    return (
      <Card className="rounded-[18px] border-border-soft bg-surface">
        <CardContent className="flex flex-col items-center gap-6 px-6 py-12 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="space-y-1">
            <p className="text-[18px] font-semibold">Activation en cours…</p>
            <p className="caption-14 text-foreground-muted">
              Veuillez patienter quelques instants.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card className="rounded-[18px] border-border-soft bg-surface">
        <CardContent className="space-y-6 px-6 py-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-bg">
            <MailX className="h-5 w-5 text-danger" />
          </div>
          <div className="space-y-2">
            <h1 className="text-[24px] font-semibold tracking-tight">
              Lien invalide
            </h1>
            <p className="caption-14 text-foreground-muted">
              {errorMsg || "Ce lien a expiré ou est invalide."}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              className="w-full rounded-full active:scale-95 transition-transform"
              onClick={() => router.replace("/activate")}
            >
              Saisir le code manuellement
            </Button>
            <Link
              href="/register"
              className="caption-14 text-center text-foreground-muted hover:underline"
            >
              Retour à l'inscription
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[18px] border-border-soft bg-surface">
      <CardContent className="space-y-6 px-6 py-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
        <div className="space-y-2">
          <h1 className="text-[28px] font-semibold tracking-tight">
            Compte activé !
          </h1>
          <p className="caption-14 text-foreground-muted">
            Votre agence est prête. Connectez-vous pour accéder à votre tableau
            de bord.
          </p>
        </div>
        <Button
          size="lg"
          className="w-full rounded-full active:scale-95 transition-transform"
          onClick={() => router.push("/login")}
        >
          Se connecter
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Manual OTP entry form ────────────────────────────────────────────────────

function ManualOtpForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const error = code.length > 0 && code.length < 6 ? "Le code doit contenir 6 chiffres" : null;

  if (done) {
    return (
      <Card className="rounded-[18px] border-border-soft bg-surface">
        <CardContent className="space-y-6 px-6 py-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <div className="space-y-2">
            <h1 className="text-[28px] font-semibold tracking-tight">
              Compte activé !
            </h1>
            <p className="caption-14 text-foreground-muted">
              Votre agence est prête. Connectez-vous pour accéder à votre
              tableau de bord.
            </p>
          </div>
          <Button
            size="lg"
            className="w-full rounded-full active:scale-95 transition-transform"
            onClick={() => router.push("/login")}
          >
            Se connecter
          </Button>
        </CardContent>
      </Card>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return;
    setSubmitting(true);
    try {
      await confirmAccount(code);
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
            Activez votre compte
          </h1>
          <p className="caption-14 text-foreground-muted">
            Entrez le code à 6 chiffres reçu par email pour activer votre
            agence.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="123456"
              autoFocus
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="text-center text-2xl font-bold tracking-[0.5em]"
              aria-invalid={!!error}
            />
            {error ? (
              <p className="caption-14 text-danger text-center">{error}</p>
            ) : null}
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={submitting || code.length !== 6}
            className="w-full rounded-full active:scale-95 transition-transform"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Activation…
              </>
            ) : (
              "Activer mon compte"
            )}
          </Button>
        </form>

        <p className="caption-14 text-center text-foreground-muted">
          Vous n'avez pas reçu d'email ?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Recommencer l'inscription
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Entry point ──────────────────────────────────────────────────────────────

function ActivatePage() {
  const params = useSearchParams();
  const token = params.get("token");

  return token ? <AutoConfirm token={token} /> : <ManualOtpForm />;
}

export default function ActivateAccountPage() {
  return (
    <Suspense fallback={<div className="h-[420px]" />}>
      <ActivatePage />
    </Suspense>
  );
}
