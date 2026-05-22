"use client";

import { use, useEffect } from "react";
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
import { useContract, useUpdateContract } from "@/hooks/use-contracts";
import { extractErrorMessage } from "@/lib/axios";

const schema = z.object({
  title: z.string().min(1, "Titre obligatoire"),
  clientId: z.number().min(1, "Sélectionnez un client"),
  content: z.string().optional(),
  validUntil: z.string().optional(),
});

type FormValues = z.output<typeof schema>;

export default function EditContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const contractId = Number(id);
  const router = useRouter();

  const { data: contract, isLoading, isError } = useContract(contractId);
  usePageTitle(
    contract ? `Modifier ${contract.contractNumber}` : "Modifier contrat",
  );

  const updateContract = useUpdateContract();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      title: "",
      clientId: 0,
      content: "",
      validUntil: "",
    },
  });

  const clientId = watch("clientId");

  useEffect(() => {
    if (!contract) return;
    reset({
      title: contract.title,
      clientId: contract.clientId,
      content: contract.content ?? "",
      validUntil: contract.validUntil ?? "",
    });
  }, [contract, reset]);

  async function onSubmit(values: FormValues) {
    try {
      await updateContract.mutateAsync({
        contractId,
        payload: {
          title: values.title,
          clientId: values.clientId,
          content: values.content || undefined,
          validUntil: values.validUntil || undefined,
        },
      });
      toast.success("Contrat mis à jour");
      router.push(`/contracts/${contractId}`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-foreground-muted" />
      </div>
    );
  }

  if (isError || !contract) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-foreground-muted">Contrat introuvable.</p>
        <Button variant="outline" onClick={() => router.push("/contracts")}>
          Retour aux contrats
        </Button>
      </div>
    );
  }

  if (contract.status !== "DRAFT") {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-foreground-muted">
          Seuls les contrats brouillons peuvent être modifiés.
        </p>
        <Button variant="outline" onClick={() => router.push(`/contracts/${contractId}`)}>
          Retour au contrat
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/contracts/${contractId}`)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-muted hover:bg-background-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-[18px] font-semibold text-foreground">
            Modifier {contract.contractNumber}
          </h1>
          <p className="text-[13px] text-foreground-muted">{contract.title}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Card className="border-border-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-[16px]">Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                placeholder="Ex : Contrat de prestation — Site web vitrine"
                {...register("title")}
                className={errors.title ? "border-danger" : ""}
              />
              {errors.title ? (
                <p className="text-[12px] text-danger">{errors.title.message}</p>
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
              <Label htmlFor="validUntil">Date d&apos;expiration (optionnel)</Label>
              <Input
                id="validUntil"
                type="date"
                {...register("validUntil")}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-[16px]">Contenu du contrat</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="min-h-[280px] w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-[14px] leading-relaxed text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Rédigez le contenu du contrat ici…"
              {...register("content")}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/contracts/${contractId}`)}
            className="rounded-full"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={updateContract.isPending}
            className="rounded-full"
          >
            {updateContract.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </div>
  );
}
