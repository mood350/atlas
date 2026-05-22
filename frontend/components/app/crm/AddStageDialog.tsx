"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateStage } from "@/hooks/use-pipelines";
import { extractErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";
import type { Pipeline } from "@/types/api";

const COLOR_PRESETS = [
  "#6B7280",
  "#3B82F6",
  "#F59E0B",
  "#8B5CF6",
  "#10B981",
  "#EF4444",
  "#EC4899",
  "#14B8A6",
];

interface AddStageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipeline: Pipeline | null;
}

export function AddStageDialog({
  open,
  onOpenChange,
  pipeline,
}: AddStageDialogProps) {
  const create = useCreateStage(pipeline?.id ?? null);

  const stages = pipeline?.stages ?? [];
  const lastStageId = stages.length ? stages[stages.length - 1].id : null;

  const [name, setName] = useState("");
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [probability, setProbability] = useState(50);
  const [afterStageId, setAfterStageId] = useState<number | null>(lastStageId);

  // Re-prime the form each time the dialog opens.
  useEffect(() => {
    if (open) {
      setName("");
      setColor(COLOR_PRESETS[0]);
      setProbability(50);
      setAfterStageId(lastStageId);
    }
  }, [open, lastStageId]);

  const trimmed = name.trim();
  const valid =
    trimmed.length >= 2 &&
    Number.isFinite(probability) &&
    probability >= 0 &&
    probability <= 100;

  async function handleSubmit() {
    if (!pipeline || !valid) return;
    // Insert right after the chosen stage; the backend shifts the rest down.
    const afterStage = stages.find((s) => s.id === afterStageId);
    const position = afterStage ? afterStage.position + 1 : 1;
    try {
      await create.mutateAsync({ name: trimmed, position, color, probability });
      toast.success(`Étape « ${trimmed} » ajoutée`);
      onOpenChange(false);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Nouvelle étape</DialogTitle>
          <DialogDescription>
            Ajoutez une étape au pipeline « {pipeline?.name ?? ""} ».
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="stage-name">Nom de l&apos;étape</Label>
            <Input
              id="stage-name"
              autoFocus
              placeholder="ex: Relance"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && valid) handleSubmit();
              }}
            />
          </div>

          {/* Color */}
          <div className="space-y-1.5">
            <Label>Couleur de la colonne</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Couleur ${c}`}
                  aria-pressed={color === c}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full transition-transform",
                    color === c ? "scale-110" : "hover:scale-105",
                  )}
                  style={{ backgroundColor: c }}
                >
                  {color === c ? (
                    <Check className="h-4 w-4 text-white" strokeWidth={3} />
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          {/* Win probability */}
          <div className="space-y-1.5">
            <Label htmlFor="stage-prob">Probabilité de conversion (%)</Label>
            <Input
              id="stage-prob"
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              value={Number.isNaN(probability) ? "" : probability}
              onChange={(e) => setProbability(Number(e.target.value))}
            />
            <p className="caption-14 text-foreground-subtle">
              Utilisée pour estimer le chiffre d&apos;affaires prévisionnel
              pondéré des deals de cette étape.
            </p>
          </div>

          {/* Position */}
          {stages.length > 0 ? (
            <div className="space-y-1.5">
              <Label>Insérer après</Label>
              <Select
                value={afterStageId ? String(afterStageId) : undefined}
                onValueChange={(v) => setAfterStageId(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une position" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => onOpenChange(false)}
            disabled={create.isPending}
          >
            Annuler
          </Button>
          <Button
            className="rounded-full active:scale-95 transition-transform"
            onClick={handleSubmit}
            disabled={!valid || create.isPending}
          >
            {create.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ajout...
              </>
            ) : (
              "Ajouter l'étape"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
