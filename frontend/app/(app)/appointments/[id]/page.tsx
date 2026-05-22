"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  Save,
  Trash2,
  User,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/app/shared/StatusBadge";
import { usePageTitle } from "@/hooks/use-page-title";
import {
  useAppointment,
  useConfirmAppointment,
  useCompleteAppointment,
  useCancelAppointment,
  useDeleteAppointment,
  useAddMeetingNotes,
} from "@/hooks/use-appointments";
import { formatDate } from "@/lib/format";
import { extractErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  DISCOVERY:   "Découverte",
  FOLLOW_UP:   "Suivi",
  DEMO:        "Démo",
  ONBOARDING:  "Onboarding",
  REVIEW:      "Bilan",
  OTHER:       "Autre",
};

const providerLabels: Record<string, string> = {
  GOOGLE_MEET: "Google Meet",
  ZOOM:        "Zoom",
  TEAMS:       "Microsoft Teams",
  PHONE:       "Téléphone",
  IN_PERSON:   "En personne",
  OTHER:       "Autre",
};

export default function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const appointmentId = Number(id);
  const router = useRouter();

  const { data: appt, isLoading, isError } = useAppointment(appointmentId);
  usePageTitle(appt ? appt.title : "Rendez-vous");

  const confirmAppt   = useConfirmAppointment();
  const completeAppt  = useCompleteAppointment();
  const cancelAppt    = useCancelAppointment();
  const deleteAppt    = useDeleteAppointment();
  const addNotes      = useAddMeetingNotes(appointmentId);

  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);

  // Sync notes when data loads
  if (appt && !notesSaved && notes === "" && appt.meetingNotes) {
    setNotes(appt.meetingNotes);
  }

  async function handleConfirm() {
    try {
      await confirmAppt.mutateAsync(appointmentId);
      toast.success("Rendez-vous confirmé");
    } catch (err) { toast.error(extractErrorMessage(err)); }
  }

  async function handleComplete() {
    try {
      await completeAppt.mutateAsync(appointmentId);
      toast.success("Rendez-vous terminé");
    } catch (err) { toast.error(extractErrorMessage(err)); }
  }

  async function handleCancel() {
    if (!confirm("Annuler ce rendez-vous ?")) return;
    try {
      await cancelAppt.mutateAsync({ appointmentId });
      toast.success("Rendez-vous annulé");
    } catch (err) { toast.error(extractErrorMessage(err)); }
  }

  async function handleDelete() {
    if (!confirm("Supprimer définitivement ce rendez-vous ?")) return;
    try {
      await deleteAppt.mutateAsync(appointmentId);
      toast.success("Rendez-vous supprimé");
      router.push("/appointments");
    } catch (err) { toast.error(extractErrorMessage(err)); }
  }

  async function handleSaveNotes() {
    if (!notes.trim()) return;
    try {
      await addNotes.mutateAsync(notes.trim());
      setNotesSaved(true);
      toast.success("Notes enregistrées");
    } catch (err) { toast.error(extractErrorMessage(err)); }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-foreground-muted" />
      </div>
    );
  }

  if (isError || !appt) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-foreground-muted">Rendez-vous introuvable.</p>
        <Button variant="outline" onClick={() => router.push("/appointments")}>
          Retour aux rendez-vous
        </Button>
      </div>
    );
  }

  const canConfirm  = appt.status === "PENDING";
  const canComplete = appt.status === "CONFIRMED";
  const canCancel   = appt.status === "PENDING" || appt.status === "CONFIRMED";
  const canDelete   = appt.status === "CANCELLED";
  const canNotes    = appt.status === "CONFIRMED" || appt.status === "COMPLETED";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.push("/appointments")}
            className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md text-foreground-muted hover:bg-background-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[20px] font-semibold text-foreground">{appt.title}</h1>
              <StatusBadge status={appt.status} />
            </div>
            <p className="mt-0.5 text-[13px] text-foreground-muted">
              {typeLabels[appt.type] ?? appt.type}
              {appt.clientOrGuestName ? ` · ${appt.clientOrGuestName}` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canConfirm ? (
            <Button
              onClick={handleConfirm}
              disabled={confirmAppt.isPending}
              className="rounded-full active:scale-95 transition-transform"
            >
              {confirmAppt.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Confirmer
            </Button>
          ) : null}

          {canComplete ? (
            <Button
              onClick={handleComplete}
              disabled={completeAppt.isPending}
              className="rounded-full active:scale-95 transition-transform"
            >
              {completeAppt.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Marquer terminé
            </Button>
          ) : null}

          {canCancel ? (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={cancelAppt.isPending}
              className="rounded-full text-danger hover:bg-danger-bg hover:text-danger active:scale-95 transition-transform"
            >
              {cancelAppt.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Annuler le RDV
            </Button>
          ) : null}

          {canDelete ? (
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={deleteAppt.isPending}
              className="rounded-full text-danger hover:bg-danger-bg hover:text-danger active:scale-95 transition-transform"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          ) : null}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border-soft">
          <CardContent className="pt-5">
            <p className="caption-14 text-foreground-muted">Date &amp; heure</p>
            <div className="mt-1.5 flex items-start gap-2">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="font-medium text-foreground">
                  {formatDate(appt.startTime, "EEE d MMM yyyy")}
                </p>
                <div className="flex items-center gap-1 text-[12px] text-foreground-muted">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatDate(appt.startTime, "HH:mm")} — {formatDate(appt.endTime, "HH:mm")}
                  </span>
                </div>
                <p className="text-[12px] text-foreground-muted">{appt.durationMinutes} min</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border-soft">
          <CardContent className="pt-5">
            <p className="caption-14 text-foreground-muted">Support</p>
            <div className="mt-1.5 flex items-center gap-2">
              <Video className="h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="font-medium text-foreground">
                  {providerLabels[appt.meetingProvider] ?? appt.meetingProvider}
                </p>
                {appt.meetingUrl ? (
                  <a
                    href={appt.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[12px] text-primary hover:underline"
                  >
                    Rejoindre
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border-soft">
          <CardContent className="pt-5">
            <p className="caption-14 text-foreground-muted">Participant</p>
            <div className="mt-1.5 flex items-center gap-2">
              <User className="h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="font-medium text-foreground">{appt.clientOrGuestName || appt.memberName}</p>
                <p className="text-[12px] text-foreground-muted">{appt.memberName}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location */}
      {appt.location ? (
        <Card className="border-border-soft">
          <CardContent className="flex items-center gap-3 pt-5">
            <MapPin className="h-4 w-4 shrink-0 text-foreground-muted" />
            <p className="text-[14px] text-foreground">{appt.location}</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Description */}
      {appt.description ? (
        <Card className="border-border-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-[16px]">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-[14px] text-foreground">{appt.description}</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Meeting notes */}
      {canNotes ? (
        <Card className="border-border-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-[16px]">Compte rendu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              className="min-h-[120px] w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Notes de la réunion, points clés, décisions prises…"
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }}
            />
            <Button
              onClick={handleSaveNotes}
              disabled={!notes.trim() || notesSaved || addNotes.isPending}
              variant="outline"
              className="rounded-full"
            >
              {addNotes.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {notesSaved ? "Notes sauvegardées" : "Sauvegarder"}
            </Button>
          </CardContent>
        </Card>
      ) : appt.meetingNotes ? (
        <Card className="border-border-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-[16px]">Compte rendu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-[14px] text-foreground">{appt.meetingNotes}</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Guest info */}
      {(appt.guestName || appt.guestEmail) ? (
        <Card className="border-border-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-[16px]">Invité externe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {appt.guestName ? (
              <p className="text-[14px] font-medium text-foreground">{appt.guestName}</p>
            ) : null}
            {appt.guestEmail ? (
              <p className="text-[13px] text-foreground-muted">{appt.guestEmail}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
