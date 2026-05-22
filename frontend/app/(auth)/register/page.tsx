"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Loader2, Mail } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register as registerRequest } from "@/lib/api/auth";
import { extractErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";

// E.164: leading "+", first digit 1-9, total 8-15 digits.
const E164 = /^\+[1-9]\d{7,14}$/;

const personalSchema = z
  .object({
    firstname: z.string().min(2, "Prénom requis"),
    lastname: z.string().min(2, "Nom requis"),
    email: z.string().email("Email invalide"),
    phoneNumber: z
      .string()
      .min(1, "Téléphone requis pour les SMS et WhatsApp")
      .regex(E164, "Format international requis : +22890000000"),
    password: z
      .string()
      .min(8, "8 caractères minimum")
      .regex(/[A-Z]/, "Au moins une majuscule")
      .regex(/[0-9]/, "Au moins un chiffre"),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["passwordConfirm"],
  });

const agencySchema = z.object({
  agencyName: z.string().min(2, "Nom de l'agence requis"),
});

type PersonalValues = z.infer<typeof personalSchema>;
type AgencyValues = z.infer<typeof agencySchema>;

type Step = 1 | 2 | "done";

export default function RegisterPage() {
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [personal, setPersonal] = useState<PersonalValues | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string>("");

  const personalForm = useForm<PersonalValues>({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      email: "",
      phoneNumber: "",
      password: "",
      passwordConfirm: "",
    },
  });

  const agencyForm = useForm<AgencyValues>({
    resolver: zodResolver(agencySchema),
    defaultValues: { agencyName: "" },
  });

  function handlePersonalSubmit(values: PersonalValues) {
    setPersonal(values);
    setStep(2);
  }

  async function handleAgencySubmit(values: AgencyValues) {
    if (!personal) return;
    setSubmitting(true);
    try {
      // Detect timezone client-side — backend defaults to "Africa/Abidjan"
      // if we don't send one, but the user's actual zone is more useful
      // for appointment reminders downstream.
      const timezone =
        typeof Intl !== "undefined"
          ? Intl.DateTimeFormat().resolvedOptions().timeZone
          : undefined;

      await registerRequest({
        firstname: personal.firstname,
        lastname: personal.lastname,
        email: personal.email,
        password: personal.password,
        phoneNumber: personal.phoneNumber,
        agencyName: values.agencyName,
        timezone,
        preferredLanguage: "fr",
      });
      setSubmittedEmail(personal.email);
      setStep("done");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "done") {
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
              Nous avons envoyé un lien de confirmation à{" "}
              <strong className="text-foreground">{submittedEmail}</strong>.
              Cliquez dessus pour activer votre compte.
            </p>
          </div>
          <p className="caption-14 text-foreground-subtle">
            Pas reçu ? Vérifiez votre dossier spam.
          </p>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-full",
            )}
          >
            Retour à la connexion
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[18px] border-border-soft bg-surface">
      <CardContent className="space-y-6 px-6 py-8">
        <div className="space-y-2 text-center">
          <h1 className="text-[28px] font-semibold tracking-tight">
            Créer votre agence
          </h1>
          <p className="caption-14 text-foreground-muted">
            Étape {step} sur 2 — {step === 1 ? "Vos informations" : "Votre agence"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ProgressStep active={step >= 1} done={step > 1} label="Vous" />
          <div
            className={cn(
              "h-0.5 flex-1 rounded-full",
              step > 1 ? "bg-primary" : "bg-border",
            )}
          />
          <ProgressStep active={step >= 2} done={false} label="Agence" />
        </div>

        {step === 1 ? (
          <form
            onSubmit={personalForm.handleSubmit(handlePersonalSubmit)}
            className="space-y-4"
            noValidate
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="firstname"
                label="Prénom"
                placeholder="Aissatou"
                autoComplete="given-name"
                error={personalForm.formState.errors.firstname?.message}
                {...personalForm.register("firstname")}
              />
              <Field
                id="lastname"
                label="Nom"
                placeholder="Diallo"
                autoComplete="family-name"
                error={personalForm.formState.errors.lastname?.message}
                {...personalForm.register("lastname")}
              />
            </div>
            <Field
              id="email"
              type="email"
              label="Email professionnel"
              placeholder="vous@agence.ci"
              autoComplete="email"
              error={personalForm.formState.errors.email?.message}
              {...personalForm.register("email")}
            />
            <Field
              id="phoneNumber"
              type="tel"
              label="Téléphone (format international)"
              placeholder="+22890000000"
              autoComplete="tel"
              hint="Requis pour les confirmations SMS et WhatsApp."
              error={personalForm.formState.errors.phoneNumber?.message}
              {...personalForm.register("phoneNumber")}
            />
            <Field
              id="password"
              type="password"
              label="Mot de passe"
              placeholder="8 caractères minimum"
              autoComplete="new-password"
              error={personalForm.formState.errors.password?.message}
              {...personalForm.register("password")}
            />
            <Field
              id="passwordConfirm"
              type="password"
              label="Confirmer le mot de passe"
              autoComplete="new-password"
              error={personalForm.formState.errors.passwordConfirm?.message}
              {...personalForm.register("passwordConfirm")}
            />

            <Button
              type="submit"
              size="lg"
              className="w-full rounded-full active:scale-95 transition-transform"
            >
              Continuer <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        ) : null}

        {step === 2 ? (
          <form
            onSubmit={agencyForm.handleSubmit(handleAgencySubmit)}
            className="space-y-4"
            noValidate
          >
            <Field
              id="agencyName"
              label="Nom de l'agence"
              placeholder="Digital Agency Abidjan"
              autoComplete="organization"
              hint="Vous pourrez ajuster les informations détaillées plus tard."
              error={agencyForm.formState.errors.agencyName?.message}
              {...agencyForm.register("agencyName")}
            />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="rounded-full active:scale-95 transition-transform"
                onClick={() => setStep(1)}
                disabled={submitting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Retour
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="flex-1 rounded-full active:scale-95 transition-transform"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Création...
                  </>
                ) : (
                  "Créer mon agence"
                )}
              </Button>
            </div>
          </form>
        ) : null}

        <p className="caption-14 text-center text-foreground-muted">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

interface ProgressStepProps {
  active: boolean;
  done: boolean;
  label: string;
}
function ProgressStep({ active, done, label }: ProgressStepProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full border text-[12px] font-semibold transition-colors",
          done && "border-primary bg-primary text-primary-foreground",
          !done && active && "border-primary bg-primary/10 text-primary",
          !done && !active && "border-border text-foreground-muted",
        )}
      >
        {done ? <Check className="h-3 w-3" /> : label[0]}
      </div>
      <span
        className={cn(
          "caption-14 hidden sm:inline",
          active ? "text-foreground" : "text-foreground-muted",
        )}
      >
        {label}
      </span>
    </div>
  );
}

type FieldProps = React.ComponentProps<typeof Input> & {
  label: string;
  hint?: string;
  error?: string;
  id: string;
};
const Field = ({ label, hint, error, id, type = "text", className, ...rest }: FieldProps) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    <Input id={id} type={type} className={className} {...rest} aria-invalid={!!error} />
    {error ? (
      <p className="caption-14 text-danger">{error}</p>
    ) : hint ? (
      <p className="caption-14 text-foreground-subtle">{hint}</p>
    ) : null}
  </div>
);
