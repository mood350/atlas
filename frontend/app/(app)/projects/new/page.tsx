"use client";

import { useRouter, useSearchParams } from "next/navigation";
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
import { useCreateProject } from "@/hooks/use-projects";
import { extractErrorMessage } from "@/lib/axios";

const schema = z.object({
  name: z.string().min(1, "Nom obligatoire"),
  clientId: z.number().min(1, "Sélectionnez un client"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
  budget: z.number().min(0).optional(),
  estimatedHours: z.number().min(0).optional(),
});

type FormValues = z.output<typeof schema>;

const priorityOptions = [
  { value: "LOW",    label: "Basse" },
  { value: "MEDIUM", label: "Normale" },
  { value: "HIGH",   label: "Haute" },
  { value: "URGENT", label: "Urgente" },
];

export default function NewProjectPage() {
  usePageTitle("Nouveau projet", "Créer un projet");

  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledClientId = Number(searchParams.get("clientId")) || 0;

  const createProject = useCreateProject();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      name: "",
      clientId: prefilledClientId,
      description: "",
      priority: "MEDIUM",
      startDate: "",
      deadline: "",
    },
  });

  const clientId = watch("clientId");

  async function onSubmit(values: FormValues) {
    const contractId = Number(searchParams.get("contractId")) || undefined;
    try {
      const project = await createProject.mutateAsync({
        name: values.name,
        clientId: values.clientId,
        description: values.description || undefined,
        priority: values.priority,
        startDate: values.startDate || undefined,
        deadline: values.deadline || undefined,
        budget: values.budget,
        estimatedHours: values.estimatedHours,
        contractId,
      });
      toast.success(`Projet ${project.projectNumber} créé`);
      router.push(`/projects/${project.id}`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/projects")}
          className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-muted hover:bg-background-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-[18px] font-semibold text-foreground">Nouveau projet</h1>
          <p className="text-[13px] text-foreground-muted">Créer un projet pour un client</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Card className="border-border-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-[16px]">Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nom du projet *</Label>
              <Input
                id="name"
                placeholder="Ex : Refonte site web, Application mobile…"
                {...register("name")}
                className={errors.name ? "border-danger" : ""}
              />
              {errors.name ? (
                <p className="text-[12px] text-danger">{errors.name.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label>Client *</Label>
              <ClientCombobox
                value={clientId || null}
                onChange={(id) => setValue("clientId", id, { shouldValidate: true })}
                hasError={!!errors.clientId}
              />
              {errors.clientId ? (
                <p className="text-[12px] text-danger">{errors.clientId.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="min-h-[80px] w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Objectifs, contexte…"
                {...register("description")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="priority">Priorité</Label>
              <select
                id="priority"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                {...register("priority")}
              >
                {priorityOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-[16px]">Planning &amp; budget</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Date de début</Label>
              <Input id="startDate" type="date" {...register("startDate")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deadline">Deadline</Label>
              <Input id="deadline" type="date" {...register("deadline")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="budget">Budget (XOF)</Label>
              <Input
                id="budget"
                type="number"
                min="0"
                step="1000"
                placeholder="0"
                {...register("budget", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="estimatedHours">Heures estimées</Label>
              <Input
                id="estimatedHours"
                type="number"
                min="0"
                step="0.5"
                placeholder="0"
                {...register("estimatedHours", { valueAsNumber: true })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push("/projects")} className="rounded-full">
            Annuler
          </Button>
          <Button type="submit" disabled={createProject.isPending} className="rounded-full">
            {createProject.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Créer le projet
          </Button>
        </div>
      </form>
    </div>
  );
}
