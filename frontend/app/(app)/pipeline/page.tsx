"use client";

import { useEffect, useMemo, useState } from "react";
import { Kanban, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KanbanBoard } from "@/components/app/crm/KanbanBoard";
import { PipelineHeader, type DealFilter, type ViewMode } from "@/components/app/crm/PipelineHeader";
import { NewDealDialog } from "@/components/app/crm/NewDealDialog";
import { DealSheet } from "@/components/app/crm/DealSheet";
import { EmptyState } from "@/components/app/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { usePipelines, useCreatePipeline } from "@/hooks/use-pipelines";
import { useKanban } from "@/hooks/use-kanban";
import { usePageTitle } from "@/hooks/use-page-title";
import { useAuthStore } from "@/stores/auth.store";
import { extractErrorMessage } from "@/lib/axios";
import type { Deal, KanbanColumn } from "@/types/api";

export default function PipelinePage() {
  usePageTitle("Pipeline CRM", "Vue d'ensemble de vos deals en cours");

  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  const [activePipelineId, setActivePipelineId] = useState<number | null>(null);
  const [filter, setFilter] = useState<DealFilter>("all");
  const [view, setView] = useState<ViewMode>("kanban");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createStageId, setCreateStageId] = useState<number | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const [newPipelineOpen, setNewPipelineOpen] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState("");
  const createPipeline = useCreatePipeline();

  const pipelinesQuery = usePipelines();
  const pipelines = useMemo(() => pipelinesQuery.data ?? [], [pipelinesQuery.data]);

  // Pick the default pipeline once they arrive.
  useEffect(() => {
    if (activePipelineId === null && pipelines.length > 0) {
      const defaultPipeline = pipelines.find((p) => p.isDefault) ?? pipelines[0];
      setActivePipelineId(defaultPipeline.id);
    }
  }, [pipelines, activePipelineId]);

  const activePipeline = useMemo(
    () => pipelines.find((p) => p.id === activePipelineId) ?? null,
    [pipelines, activePipelineId],
  );

  const kanbanQuery = useKanban(activePipelineId);

  // Apply client-side filters on top of the server payload.
  const filteredColumns = useMemo<KanbanColumn[]>(() => {
    const cols = kanbanQuery.data ?? [];
    if (filter === "all") return cols;
    return cols.map((col) => {
      const deals = col.deals.filter((deal) => {
        if (filter === "mine") return deal.ownerId === userId;
        if (filter === "urgent") return deal.priority === "URGENT";
        return true;
      });
      return {
        ...col,
        deals,
        count: deals.length,
        totalAmount: deals.reduce((sum, d) => sum + d.amount, 0),
      };
    });
  }, [kanbanQuery.data, filter, userId]);

  function handleCreateDeal(stageId?: number) {
    setCreateStageId(stageId ?? null);
    setCreateDialogOpen(true);
  }

  async function handleCreatePipeline() {
    if (!newPipelineName.trim()) return;
    try {
      const pipeline = await createPipeline.mutateAsync({
        name: newPipelineName.trim(),
        isDefault: false,
      });
      setActivePipelineId(pipeline.id);
      setNewPipelineOpen(false);
      setNewPipelineName("");
      toast.success(`Pipeline "${pipeline.name}" créé`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  // ─── Loading state ─────────────────────────────────────────────
  if (pipelinesQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <div className="flex gap-4 overflow-x-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[420px] w-72 shrink-0 rounded-[14px]" />
          ))}
        </div>
      </div>
    );
  }

  // ─── No pipelines yet ──────────────────────────────────────────
  if (pipelines.length === 0) {
    return (
      <>
        <EmptyState
          icon={Kanban}
          title="Aucun pipeline configuré"
          description="Créez votre premier pipeline pour commencer à suivre vos deals commerciaux."
          action={
            <Button
              onClick={() => setNewPipelineOpen(true)}
              className="rounded-full active:scale-95 transition-transform"
            >
              <Plus className="mr-1 h-4 w-4" />
              Créer un pipeline
            </Button>
          }
        />
        <Dialog open={newPipelineOpen} onOpenChange={setNewPipelineOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Nouveau pipeline</DialogTitle>
            </DialogHeader>
            <div className="space-y-1.5 py-2">
              <Label htmlFor="pipeline-name">Nom du pipeline</Label>
              <Input
                id="pipeline-name"
                placeholder="ex: Développement web"
                value={newPipelineName}
                onChange={(e) => setNewPipelineName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreatePipeline()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewPipelineOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleCreatePipeline}
                disabled={!newPipelineName.trim() || createPipeline.isPending}
              >
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="flex h-full flex-col gap-5">
      <PipelineHeader
        pipelines={pipelines}
        activePipelineId={activePipelineId}
        onChangePipeline={setActivePipelineId}
        filter={filter}
        onChangeFilter={setFilter}
        view={view}
        onChangeView={setView}
        onCreateDeal={() => handleCreateDeal()}
        onCreatePipeline={() => setNewPipelineOpen(true)}
      />

      <div className="-mx-4 flex-1 overflow-hidden px-4 md:-mx-8 md:px-8">
        {kanbanQuery.isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {(activePipeline?.stages ?? Array.from({ length: 4 })).map((_, i) => (
              <Skeleton
                key={i}
                className="h-[420px] w-72 shrink-0 rounded-[14px]"
              />
            ))}
          </div>
        ) : null}

        {!kanbanQuery.isLoading && kanbanQuery.isError ? (
          <EmptyState
            title="Impossible de charger le pipeline"
            description="Vérifiez votre connexion et réessayez."
            action={
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => kanbanQuery.refetch()}
              >
                Réessayer
              </Button>
            }
          />
        ) : null}

        {!kanbanQuery.isLoading &&
        !kanbanQuery.isError &&
        view === "kanban" &&
        activePipelineId &&
        filteredColumns.length > 0 ? (
          <KanbanBoard
            pipelineId={activePipelineId}
            columns={filteredColumns}
            onSelectDeal={setSelectedDeal}
            onAddDeal={(stageId) => handleCreateDeal(stageId)}
          />
        ) : null}

        {!kanbanQuery.isLoading &&
        !kanbanQuery.isError &&
        view === "kanban" &&
        activePipelineId &&
        filteredColumns.length === 0 ? (
          <EmptyState
            title="Pipeline sans étapes"
            description="Ce pipeline n'a pas encore d'étapes. Ajoutez des étapes pour commencer à gérer vos deals."
          />
        ) : null}

        {!kanbanQuery.isLoading &&
        !kanbanQuery.isError &&
        view === "list" ? (
          <EmptyState
            title="Vue liste — bientôt"
            description="La vue tableau arrive en Phase 4. Pour l'instant, utilisez le Kanban."
            action={
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setView("kanban")}
              >
                Revenir au Kanban
              </Button>
            }
          />
        ) : null}
      </div>

      <NewDealDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        pipeline={activePipeline}
        defaultStageId={createStageId}
      />

      <DealSheet
        open={!!selectedDeal}
        onOpenChange={(o) => !o && setSelectedDeal(null)}
        initial={selectedDeal}
        pipeline={activePipeline}
      />

      <Dialog open={newPipelineOpen} onOpenChange={setNewPipelineOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nouveau pipeline</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label htmlFor="pipeline-name-2">Nom du pipeline</Label>
            <Input
              id="pipeline-name-2"
              placeholder="ex: Maintenance"
              value={newPipelineName}
              onChange={(e) => setNewPipelineName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreatePipeline()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewPipelineOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreatePipeline}
              disabled={!newPipelineName.trim() || createPipeline.isPending}
            >
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
