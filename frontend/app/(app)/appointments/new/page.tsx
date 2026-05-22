"use client";

import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientCombobox } from "@/components/app/shared/ClientCombobox";
import { usePageTitle } from "@/hooks/use-page-title";
import { useCreateAppointment } from "@/hooks/use-appointments";
import { useCurrentUser } from "@/hooks/use-current-user";
import { extractErrorMessage } from "@/lib/axios";

const schema = z.object({
  title: z.string().min(1, "Titre obligatoire"),
  clientId: z.number().optional(),
  type: z.enum(["DISCOVERY", "FOLLOW_UP", "DEMO", "ONBOARDING", "REVIEW", "OTHER"]),
  meetingProvider: z.enum(["GOOGLE_MEET", "ZOOM", "TEAMS", "PHONE", "IN_PERSON", "OTHER"]),
  startTime: z.string().min(1, "Date de début obligatoire"),
  endTime: z.string().min(1, "Date de fin obligatoire"),
  description: z.string().optional(),
  location: z.string().optional(),
  guestName: z.string().optional(),
  guestEmail: z.string().email("Email invalide").optional().or(z.literal("")),
});

type FormValues = z.output<typeof schema>;

const typeOptions = [
  { value: "DISCOVERY",  label: "Découverte" },
  { value: "FOLLOW_UP",  label: "Suivi" },
  { value: "DEMO",       label: "Démo" },
  { value: "ONBOARDING", label: "Onboarding" },
  { value: "REVIEW",     label: "Bilan" },
  { value: "OTHER",      label: "Autre" },
];

const providerOptions = [
  { value: "GOOGLE_MEET", label: "Google Meet" },
  { value: "ZOOM",        label: "Zoom" },
  { value: "TEAMS",       label: "Microsoft Teams" },
  { value: "PHONE",       label: "Téléphone" },
  { value: "IN_PERSON",   label: "En personne" },
  { value: "OTHER",       label: "Autre" },
];

export default function NewAppointmentPage() {
  usePageTitle("Nouveau rendez-vous", "Planifier un rendez-vous");

  const router = useRouter();
  const { user } = useCurrentUser();
  const createAppointment = useCreateAppointment();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      title: "",
      type: "DISCOVERY",
      meetingProvider: "GOOGLE_MEET",
      startTime: "",
      endTime: "",
      description: "",
      location: "",
      guestName: "",
      guestEmail: "",
    },
  });

  const clientId = watch("clientId");

  async function onSubmit(values: FormValues) {
    if (!user?.id) {
      toast.error("Utilisateur non identifié");
      return;
    }
    try {
      const appt = await createAppointment.mutateAsync({
        memberId: user.id,
        clientId: values.clientId,
        title: values.title,
        description: values.description || undefined,
        type: values.type,
        meetingProvider: values.meetingProvider,
        startTime: values.startTime,
        endTime: values.endTime,
        location: values.location || undefined,
        guestName: values.guestName || undefined,
        guestEmail: values.guestEmail || undefined,
      });
      toast.success("Rendez-vous créé");
      router.push(`/appointments/${appt.id}`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/appointments")}
          className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-muted hover:bg-background-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-[18px] font-semibold text-foreground">Nouveau rendez-vous</h1>
          <p className="text-[13px] text-foreground-muted">Planifier une réunion ou un appel</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Card className="border-border-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-[16px]">Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                placeholder="Ex : Appel de découverte, Démo produit…"
                {...register("title")}
                className={errors.title ? "border-danger" : ""}
              />
              {errors.title ? (
                <p className="text-[12px] text-danger">{errors.title.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label>Client (optionnel)</Label>
              <ClientCombobox
                value={clientId ?? null}
                onChange={(id) => setValue("clientId", id)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  {...register("type")}
                >
                  {typeOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="meetingProvider">Support</Label>
                <select
                  id="meetingProvider"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  {...register("meetingProvider")}
                >
                  {providerOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="min-h-[72px] w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Ordre du jour, notes…"
                {...register("description")}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-[16px]">Horaire</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="startTime">Début *</Label>
              <Input
                id="startTime"
                type="datetime-local"
                {...register("startTime")}
                className={errors.startTime ? "border-danger" : ""}
              />
              {errors.startTime ? (
                <p className="text-[12px] text-danger">{errors.startTime.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endTime">Fin *</Label>
              <Input
                id="endTime"
                type="datetime-local"
                {...register("endTime")}
                className={errors.endTime ? "border-danger" : ""}
              />
              {errors.endTime ? (
                <p className="text-[12px] text-danger">{errors.endTime.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="location">Lieu / Lien de réunion</Label>
              <Input
                id="location"
                placeholder="Adresse, URL Meet…"
                {...register("location")}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-[16px]">Invité externe (optionnel)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="guestName">Nom</Label>
              <Input id="guestName" placeholder="Prénom Nom" {...register("guestName")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="guestEmail">Email</Label>
              <Input
                id="guestEmail"
                type="email"
                placeholder="invité@exemple.com"
                {...register("guestEmail")}
                className={errors.guestEmail ? "border-danger" : ""}
              />
              {errors.guestEmail ? (
                <p className="text-[12px] text-danger">{errors.guestEmail.message}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push("/appointments")} className="rounded-full">
            Annuler
          </Button>
          <Button type="submit" disabled={createAppointment.isPending} className="rounded-full">
            {createAppointment.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Créer le rendez-vous
          </Button>
        </div>
      </form>
    </div>
  );
}
