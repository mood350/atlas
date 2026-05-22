"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRightFromSquare,
  CheckCircle2,
  FileText,
  Loader2,
  Mail,
  Phone,
  XCircle,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PriorityBadge } from "@/components/app/shared/PriorityBadge";
import { StatusBadge } from "@/components/app/shared/StatusBadge";
import { RelativeTime } from "@/components/app/shared/RelativeTime";
import { useDeal, useMarkDealLost, useMarkDealWon, useReopenDeal } from "@/hooks/use-deals";
import { useMoveDeal } from "@/hooks/use-kanban";
import { formatCurrency, formatDate } from "@/lib/format";
import { extractErrorMessage } from "@/lib/axios";
import type { Deal, Pipeline } from "@/types/api";
import { toast } from "sonner";

interface DealSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Deal hint shown immediately while the full record loads. */
  initial: Deal | null;
  pipeline: Pipeline | null;
}

export function DealSheet({
  open,
  onOpenChange,
  initial,
  pipeline,
}: DealSheetProps) {
  const dealId = initial?.id ?? null;
  const { data: fresh } = useDeal(dealId);
  const deal = fresh ?? initial;

  const moveMutation = useMoveDeal(deal?.pipelineId ?? null);
  const won = useMarkDealWon(dealId);
  const lost = useMarkDealLost(dealId);
  const reopen = useReopenDeal(dealId);

  const [showLost, setShowLost] = useState(false);
  const [lostReason, setLostReason] = useState("");

  useEffect(() => {
    if (!open) {
      setShowLost(false);
      setLostReason("");
    }
  }, [open]);

  if (!deal) return null;

  async function handleStageChange(stageIdStr: string | null) {
    if (!deal || !stageIdStr) return;
    const stageId = Number(stageIdStr);
    if (!stageId || stageId === deal.stageId) return;
    try {
      await moveMutation.mutateAsync({
        dealId: deal.id,
        payload: { stageId, position: 0 },
      });
      toast.success("Étape mise à jour");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleWon() {
    try {
      await won.mutateAsync();
      toast.success("Deal marqué comme gagné");
      onOpenChange(false);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleLostConfirm() {
    try {
      await lost.mutateAsync(lostReason.trim() || undefined);
      toast.success("Deal marqué comme perdu");
      setShowLost(false);
      onOpenChange(false);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleReopen() {
    try {
      await reopen.mutateAsync();
      toast.success("Deal rouvert");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  const closed = deal.status === "WON" || deal.status === "LOST";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 bg-background p-0 sm:max-w-[480px]"
      >
        <SheetHeader className="space-y-3 border-b border-border-soft px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <StatusBadge status={deal.status} />
            <PriorityBadge priority={deal.priority} />
          </div>
          <SheetTitle className="text-[22px] font-semibold leading-tight tracking-tight">
            {deal.title}
          </SheetTitle>
          <SheetDescription className="caption-14 flex items-center gap-1.5 text-foreground-muted">
            <span>{deal.clientName}</span>
            <span className="text-foreground-subtle">·</span>
            <span>Créé {formatDate(deal.createdAt)}</span>
          </SheetDescription>

          {/* Amount + stage selector */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div>
              <p className="caption-14 text-foreground-subtle">Montant</p>
              <p className="text-[22px] font-semibold tracking-tight">
                {formatCurrency(deal.amount, deal.currency)}
              </p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="caption-14 mb-1 text-foreground-subtle">Étape</p>
              <Select
                value={String(deal.stageId)}
                onValueChange={handleStageChange}
                disabled={closed || moveMutation.isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pipeline?.stages?.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Description */}
          {deal.description ? (
            <section className="mb-6">
              <h3 className="caption-14 mb-2 font-semibold uppercase tracking-wide text-foreground-subtle">
                Description
              </h3>
              <p className="body-17 whitespace-pre-line text-foreground">
                {deal.description}
              </p>
            </section>
          ) : null}

          {/* Owner + dates */}
          <section className="mb-6 grid grid-cols-2 gap-4 rounded-[14px] border border-border-soft bg-background-soft p-4">
            <Field label="Responsable" value={deal.ownerName ?? "Non assigné"} />
            <Field
              label="Dernière activité"
              value={<RelativeTime date={deal.lastActivityAt} />}
            />
            <Field
              label="Clôture prévue"
              value={deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : "—"}
            />
            <Field label="Relances envoyées" value={String(deal.remindersSent)} />
          </section>

          {/* Activity timeline — placeholder until the activity feed is wired */}
          <section className="mb-6">
            <h3 className="caption-14 mb-3 flex items-center gap-2 font-semibold uppercase tracking-wide text-foreground-subtle">
              <Activity className="h-3.5 w-3.5" />
              Activité
            </h3>
            <div className="rounded-[14px] border border-dashed border-border-soft bg-background-soft px-4 py-6 text-center">
              <p className="caption-14 text-foreground-muted">
                Le journal d&apos;activité sera affiché ici dès la première interaction
                (email envoyé, devis créé, changement d&apos;étape).
              </p>
            </div>
          </section>

          {/* Quick actions */}
          <section className="space-y-2">
            <h3 className="caption-14 mb-1 font-semibold uppercase tracking-wide text-foreground-subtle">
              Actions
            </h3>
            <Action icon={FileText} label="Créer un devis" disabled />
            <Action icon={Mail} label="Envoyer un email" disabled />
            <Action icon={Phone} label="Programmer un rappel" disabled />
            <Action
              icon={ArrowUpRightFromSquare}
              label="Voir la fiche client"
              disabled
            />
          </section>
        </div>

        <Separator />

        {/* Footer — won / lost / reopen */}
        <div className="flex items-center justify-end gap-2 px-6 py-4">
          {!closed ? (
            <>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setShowLost(true)}
                disabled={lost.isPending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Marquer perdu
              </Button>
              <Button
                className="rounded-full active:scale-95 transition-transform"
                onClick={handleWon}
                disabled={won.isPending}
              >
                {won.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Marquer gagné
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              className="rounded-full"
              onClick={handleReopen}
              disabled={reopen.isPending}
            >
              {reopen.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Rouvrir le deal
            </Button>
          )}
        </div>

        {/* Lost confirmation */}
        <Dialog open={showLost} onOpenChange={setShowLost}>
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle>Marquer ce deal comme perdu</DialogTitle>
              <DialogDescription>
                Indiquez la raison pour aider votre équipe à apprendre de ce deal
                perdu.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Textarea
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                placeholder="Budget trop élevé, choix d'un autre prestataire..."
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setShowLost(false)}
                  disabled={lost.isPending}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  className="rounded-full active:scale-95 transition-transform"
                  onClick={handleLostConfirm}
                  disabled={lost.isPending}
                >
                  {lost.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Confirmer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="caption-14 text-foreground-subtle">{label}</p>
      <p className="text-[14px] font-medium text-foreground">{value}</p>
    </div>
  );
}

interface ActionProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}
function Action({ icon: Icon, label, disabled, onClick }: ActionProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[14px] text-foreground-muted transition-colors hover:bg-background-muted hover:text-foreground disabled:opacity-50"
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {disabled ? (
        <span className="text-[10px] text-foreground-subtle">Bientôt</span>
      ) : null}
    </button>
  );
}
