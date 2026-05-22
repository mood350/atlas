"use client";

import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ClientCombobox } from "@/components/app/shared/ClientCombobox";
import { usePageTitle } from "@/hooks/use-page-title";
import { useCreateQuote } from "@/hooks/use-quotes";
import { extractErrorMessage } from "@/lib/axios";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

// ─── Schema ───────────────────────────────────────────────────────────────────

const itemSchema = z.object({
  designation: z.string().min(1, "Désignation requise"),
  description: z.string().optional(),
  quantity: z.number().positive("Quantité > 0"),
  unit: z.string().optional(),
  unitPrice: z.number().min(0, "Prix ≥ 0"),
  discountPercent: z.number().min(0).max(100),
});

const schema = z.object({
  clientId: z.number().min(1, "Sélectionnez un client"),
  title: z.string().min(1, "Titre obligatoire"),
  description: z.string().optional(),
  items: z.array(itemSchema).min(1, "Ajoutez au moins une ligne"),
  discountPercent: z.number().min(0).max(100),
  taxRate: z.number().min(0).max(100).optional(),
  validUntil: z.string().optional(),
  paymentTerms: z.string().optional(),
  clientNotes: z.string().optional(),
  internalNotes: z.string().optional(),
});

type FormValues = z.output<typeof schema>;

// ─── Live totals ──────────────────────────────────────────────────────────────

function useLiveTotals(
  items: FormValues["items"],
  discountPercent: number,
  taxRate: number | undefined,
) {
  const subtotal = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const disc = Number(item.discountPercent) || 0;
    return sum + qty * price * (1 - disc / 100);
  }, 0);

  const disc = Number(discountPercent) || 0;
  const discountAmount = subtotal * (disc / 100);
  const taxableAmount = subtotal - discountAmount;
  const tax = Number(taxRate) || 0;
  const taxAmount = taxableAmount * (tax / 100);
  const total = taxableAmount + taxAmount;

  return { subtotal, discountAmount, taxableAmount, taxAmount, total };
}

// ─── Item row ─────────────────────────────────────────────────────────────────

function ItemRow({
  index,
  register,
  remove,
  errors,
  quantity,
  unitPrice,
  discountPercent,
}: {
  index: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  remove: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
}) {
  const qty = Number(quantity) || 0;
  const price = Number(unitPrice) || 0;
  const disc = Number(discountPercent) || 0;
  const lineTotal = qty * price * (1 - disc / 100);

  const hasAnyError = !!(errors?.designation || errors?.quantity || errors?.unitPrice);

  return (
    <div className={cn(
      "grid gap-2 rounded-lg border p-3 transition-colors",
      hasAnyError ? "border-destructive/60 bg-destructive/5" : "border-border",
    )}>
      {/* Row 1: Designation + unit */}
      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <Label className="text-[12px]">Désignation *</Label>
          <Input
            {...register(`items.${index}.designation`)}
            placeholder="ex: Développement frontend"
            aria-invalid={!!errors?.designation}
          />
          {errors?.designation ? (
            <p className="text-[11px] text-danger">{errors.designation.message}</p>
          ) : null}
        </div>
        <div className="w-28 space-y-1">
          <Label className="text-[12px]">Unité</Label>
          <Input
            {...register(`items.${index}.unit`)}
            placeholder="Forfait"
          />
        </div>
      </div>

      {/* Row 2: qty / price / discount / total / delete */}
      <div className="flex items-end gap-2">
        <div className="w-24 space-y-1">
          <Label className="text-[12px]">Qté *</Label>
          <Input
            {...register(`items.${index}.quantity`, { valueAsNumber: true })}
            type="number"
            step="0.01"
            placeholder="1"
            aria-invalid={!!errors?.quantity}
          />
          {errors?.quantity ? (
            <p className="text-[11px] text-danger">{errors.quantity.message}</p>
          ) : null}
        </div>
        <div className="flex-1 space-y-1">
          <Label className="text-[12px]">Prix unitaire (XOF) *</Label>
          <Input
            {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
            type="number"
            step="1"
            placeholder="0"
            aria-invalid={!!errors?.unitPrice}
          />
          {errors?.unitPrice ? (
            <p className="text-[11px] text-danger">{errors.unitPrice.message}</p>
          ) : null}
        </div>
        <div className="w-20 space-y-1">
          <Label className="text-[12px]">Remise %</Label>
          <Input
            {...register(`items.${index}.discountPercent`, { valueAsNumber: true })}
            type="number"
            step="0.1"
            placeholder="0"
          />
        </div>
        <div className="w-32 space-y-1">
          <Label className="text-[12px] text-foreground-muted">Total HT</Label>
          <div className="flex h-9 items-center rounded-md bg-background-muted px-3 text-[13px] font-medium tabular-nums text-foreground">
            {formatCurrency(lineTotal, "XOF")}
          </div>
        </div>
        <button
          type="button"
          onClick={remove}
          className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-foreground-muted hover:bg-danger-bg hover:text-danger transition-colors"
          aria-label="Supprimer la ligne"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Optional description */}
      <div className="space-y-1">
        <Label className="text-[12px] text-foreground-muted">Description (optionnelle)</Label>
        <Input
          {...register(`items.${index}.description`)}
          placeholder="Détails visibles dans le PDF..."
          className="text-[13px]"
        />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewQuotePage() {
  usePageTitle("Nouveau devis");

  const router = useRouter();
  const createQuote = useCreateQuote();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      items: [
        { designation: "", quantity: 1, unitPrice: 0, discountPercent: 0, unit: "Forfait" },
      ],
      discountPercent: 0,
      taxRate: 18,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = useWatch({ control: form.control, name: "items" });
  const watchedDiscount = useWatch({ control: form.control, name: "discountPercent" });
  const watchedTax = useWatch({ control: form.control, name: "taxRate" });

  const totals = useLiveTotals(watchedItems ?? [], watchedDiscount ?? 0, watchedTax);

  async function onSubmit(values: FormValues) {
    try {
      const quote = await createQuote.mutateAsync({
        clientId: values.clientId,
        title: values.title,
        description: values.description || undefined,
        items: values.items.map((item, i) => ({
          designation: item.designation,
          description: item.description || undefined,
          quantity: item.quantity,
          unit: item.unit || undefined,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent,
          position: i + 1,
        })),
        discountPercent: values.discountPercent,
        taxRate: values.taxRate,
        validUntil: values.validUntil || undefined,
        paymentTerms: values.paymentTerms || undefined,
        clientNotes: values.clientNotes || undefined,
        internalNotes: values.internalNotes || undefined,
      });
      toast.success(`Devis ${quote.quoteNumber} créé`);
      router.push(`/quotes/${quote.id}`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-muted hover:bg-background-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-[22px] font-semibold">Nouveau devis</h1>
        </div>
        <Button
          type="submit"
          disabled={createQuote.isPending}
          className="rounded-full active:scale-95 transition-transform"
        >
          {createQuote.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement…
            </>
          ) : (
            "Enregistrer le devis"
          )}
        </Button>
      </div>

      {/* Client + Titre */}
      <Card className={cn(
        "border-border-soft",
        (form.formState.errors.clientId || form.formState.errors.title) &&
          "ring-1 ring-destructive/40",
      )}>
        <CardHeader className="pb-4">
          <CardTitle className="text-[16px]">Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Client *</Label>
            <ClientCombobox
              value={form.watch("clientId") ?? null}
              onChange={(id) => form.setValue("clientId", id, { shouldValidate: true })}
              hasError={!!form.formState.errors.clientId}
            />
            {form.formState.errors.clientId ? (
              <p className="text-[12px] text-danger">
                {form.formState.errors.clientId.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title">Titre du devis *</Label>
            <Input
              id="title"
              {...form.register("title")}
              placeholder="ex: Refonte du site web corporate"
              aria-invalid={!!form.formState.errors.title}
            />
            {form.formState.errors.title ? (
              <p className="text-[12px] text-danger">
                {form.formState.errors.title.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description interne</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Contexte, objectifs du projet..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lignes */}
      <Card className={cn(
        "border-border-soft",
        form.formState.errors.items && "ring-1 ring-destructive/40",
      )}>
        <CardHeader className="flex-row items-center justify-between pb-4">
          <CardTitle className="text-[16px]">Lignes du devis</CardTitle>
          <button
            type="button"
            onClick={() =>
              append({
                designation: "",
                quantity: 1,
                unitPrice: 0,
                discountPercent: 0,
                unit: "Forfait",
              })
            }
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[13px] font-medium text-foreground-muted hover:bg-background-muted transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter une ligne
          </button>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.formState.errors.items?.root ? (
            <p className="text-[12px] text-danger">
              {form.formState.errors.items.root.message}
            </p>
          ) : null}
          {fields.map((field, index) => (
            <ItemRow
              key={field.id}
              index={index}
              register={form.register}
              remove={() => remove(index)}
              errors={form.formState.errors.items?.[index]}
              quantity={watchedItems?.[index]?.quantity ?? 0}
              unitPrice={watchedItems?.[index]?.unitPrice ?? 0}
              discountPercent={watchedItems?.[index]?.discountPercent ?? 0}
            />
          ))}

          {/* Totals */}
          <div className="ml-auto mt-4 w-72 space-y-2 rounded-xl bg-background-muted p-4 text-[13px]">
            <div className="flex justify-between text-foreground-muted">
              <span>Sous-total HT</span>
              <span className="tabular-nums">{formatCurrency(totals.subtotal, "XOF")}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-foreground-muted">
                <span>Remise globale</span>
                <Input
                  {...form.register("discountPercent", { valueAsNumber: true })}
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  className="h-6 w-14 px-1.5 text-center text-[12px]"
                />
                <span>%</span>
              </div>
              <span className="tabular-nums text-danger">
                {totals.discountAmount > 0
                  ? `- ${formatCurrency(totals.discountAmount, "XOF")}`
                  : "—"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-foreground-muted">
                <span>TVA</span>
                <Input
                  {...form.register("taxRate", { valueAsNumber: true })}
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  className="h-6 w-14 px-1.5 text-center text-[12px]"
                />
                <span>%</span>
              </div>
              <span className="tabular-nums">
                {formatCurrency(totals.taxAmount, "XOF")}
              </span>
            </div>

            <div className="flex justify-between border-t border-border pt-2 font-semibold text-foreground">
              <span>Total TTC</span>
              <span className="tabular-nums text-[15px]">
                {formatCurrency(totals.total, "XOF")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conditions */}
      <Card className="border-border-soft">
        <CardHeader className="pb-4">
          <CardTitle className="text-[16px]">Conditions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="validUntil">Date de validité</Label>
              <Input
                id="validUntil"
                type="date"
                {...form.register("validUntil")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="paymentTerms">Conditions de paiement</Label>
              <Input
                id="paymentTerms"
                {...form.register("paymentTerms")}
                placeholder="ex: 30% à la commande, solde à la livraison"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="clientNotes">Notes pour le client</Label>
            <Textarea
              id="clientNotes"
              {...form.register("clientNotes")}
              placeholder="Informations supplémentaires visibles par le client dans le PDF..."
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="internalNotes"
              className={cn("text-foreground-muted")}
            >
              Notes internes (non visibles dans le PDF)
            </Label>
            <Textarea
              id="internalNotes"
              {...form.register("internalNotes")}
              placeholder="Commentaires internes sur ce devis..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
