"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientCombobox } from "@/components/app/shared/ClientCombobox";
import { useCreateDeal } from "@/hooks/use-deals";
import { extractErrorMessage } from "@/lib/axios";
import type { DealPriority, Pipeline } from "@/types/api";

const dealSchema = z.object({
  title: z.string().min(2, "Titre requis"),
  clientId: z.number({ message: "Sélectionnez un client" }),
  amount: z.number().nonnegative("Montant invalide"),
  stageId: z.number({ message: "Sélectionnez une étape" }),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  description: z.string().optional(),
});

type DealForm = z.infer<typeof dealSchema>;

interface NewDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipeline: Pipeline | null;
  defaultStageId?: number | null;
}

export function NewDealDialog({
  open,
  onOpenChange,
  pipeline,
  defaultStageId,
}: NewDealDialogProps) {
  const [clientId, setClientId] = useState<number | null>(null);
  const create = useCreateDeal();

  const firstStageId =
    defaultStageId ?? pipeline?.stages?.[0]?.id ?? undefined;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
    watch,
  } = useForm<DealForm>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: "",
      amount: 0,
      stageId: firstStageId,
      priority: "MEDIUM",
      description: "",
    },
  });

  // Re-prime the form whenever the dialog opens with a new default stage.
  useEffect(() => {
    if (open) {
      reset({
        title: "",
        amount: 0,
        stageId: firstStageId,
        priority: "MEDIUM",
        description: "",
      });
      setClientId(null);
    }
  }, [open, firstStageId, reset]);

  async function onSubmit(values: DealForm) {
    if (!pipeline) return;
    try {
      await create.mutateAsync({
        title: values.title,
        clientId: values.clientId,
        pipelineId: pipeline.id,
        stageId: values.stageId,
        amount: values.amount,
        priority: values.priority,
        description: values.description?.trim() || undefined,
      });
      toast.success("Deal créé");
      onOpenChange(false);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  const submitting = create.isPending;
  const stageValue = watch("stageId");
  const priorityValue = watch("priority");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Nouveau deal</DialogTitle>
          <DialogDescription>
            Créez un nouveau deal et placez-le dans le pipeline.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="title">Titre du deal</Label>
            <Input
              id="title"
              autoFocus
              placeholder="Refonte site corporate"
              {...register("title")}
              aria-invalid={!!errors.title}
            />
            {errors.title ? (
              <p className="caption-14 text-danger">{errors.title.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>Client</Label>
            <ClientCombobox
              value={clientId}
              onChange={(id) => {
                setClientId(id);
                setValue("clientId", id, { shouldValidate: true });
              }}
            />
            {errors.clientId ? (
              <p className="caption-14 text-danger">{errors.clientId.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Montant (XOF)</Label>
              <Input
                id="amount"
                type="number"
                inputMode="numeric"
                placeholder="850000"
                {...register("amount", { valueAsNumber: true })}
                aria-invalid={!!errors.amount}
              />
              {errors.amount ? (
                <p className="caption-14 text-danger">{errors.amount.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label>Priorité</Label>
              <Select
                value={priorityValue}
                onValueChange={(v) =>
                  setValue("priority", v as DealPriority, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Faible</SelectItem>
                  <SelectItem value="MEDIUM">Moyenne</SelectItem>
                  <SelectItem value="HIGH">Haute</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Étape</Label>
            <Select
              value={stageValue ? String(stageValue) : undefined}
              onValueChange={(v) =>
                setValue("stageId", Number(v), { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une étape" />
              </SelectTrigger>
              <SelectContent>
                {pipeline?.stages?.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.stageId ? (
              <p className="caption-14 text-danger">{errors.stageId.message}</p>
            ) : !pipeline?.stages?.length ? (
              <p className="caption-14 text-danger">
                Ce pipeline n&apos;a aucune étape — impossible de créer un deal.
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description (optionnelle)</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Notes internes, contexte du deal..."
              {...register("description")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="rounded-full active:scale-95 transition-transform"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer le deal"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
