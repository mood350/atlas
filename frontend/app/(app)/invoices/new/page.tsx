"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  PenLine,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientCombobox } from "@/components/app/shared/ClientCombobox";
import { usePageTitle } from "@/hooks/use-page-title";
import { useCreateInvoice } from "@/hooks/use-invoices";
import { useQuotes, useQuote } from "@/hooks/use-quotes";
import { extractErrorMessage } from "@/lib/axios";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { QuoteSummary } from "@/types/api";

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
  items: z.array(itemSchema).min(1, "Ajoutez au moins une ligne"),
  discountPercent: z.number().min(0).max(100),
  taxRate: z.number().min(0).max(100).optional(),
  dueDate: z.string().optional(),
});

type FormValues = z.output<typeof schema>;
type Mode = "idle" | "from-quote" | "blank";

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
  return { subtotal, discountAmount, taxableAmount, taxAmount, total: taxableAmount + taxAmount };
}

// ─── Mode selector ────────────────────────────────────────────────────────────

function ModeSelector({
  onSelect,
  onBack,
}: {
  onSelect: (mode: "from-quote" | "blank") => void;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl space-y-8 pt-12">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-muted hover:bg-background-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-[22px] font-semibold">Nouvelle facture</h1>
      </div>

      <p className="text-[14px] text-foreground-muted">
        Choisissez comment créer votre facture.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => onSelect("from-quote")}
          className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-surface p-6 text-left hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info-bg text-info group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Importer un devis</p>
            <p className="mt-1 text-[13px] text-foreground-muted">
              Importe automatiquement le client, les lignes et les montants depuis un devis accepté.
            </p>
          </div>
        </button>

        <button
          onClick={() => onSelect("blank")}
          className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-surface p-6 text-left hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background-muted text-foreground-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <PenLine className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Facture vierge</p>
            <p className="mt-1 text-[13px] text-foreground-muted">
              Saisissez manuellement le client et les lignes de facturation.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}

// ─── Quote picker ─────────────────────────────────────────────────────────────

function QuotePicker({
  quotes,
  isLoading,
  selected,
  onSelect,
}: {
  quotes: QuoteSummary[];
  isLoading: boolean;
  selected: QuoteSummary | null;
  onSelect: (q: QuoteSummary | null) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = quotes.filter(
    (q) =>
      search === "" ||
      q.quoteNumber.toLowerCase().includes(search.toLowerCase()) ||
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.clientName.toLowerCase().includes(search.toLowerCase()),
  );

  if (selected) {
    return (
      <Card className="border-info/30 bg-info-bg/30">
        <CardContent className="pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-info" />
              <div>
                <p className="text-[13px] font-medium text-foreground">
                  Devis importé —{" "}
                  <span className="font-mono">{selected.quoteNumber}</span>
                </p>
                <p className="text-[12px] text-foreground-muted">
                  {selected.title} · {selected.clientName} ·{" "}
                  {formatCurrency(selected.totalAmount, selected.currency)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-foreground-muted hover:bg-background-muted hover:text-foreground transition-colors"
              aria-label="Changer de devis"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border-soft">
      <CardHeader className="pb-3">
        <CardTitle className="text-[16px]">Choisir un devis accepté</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
          <Input
            placeholder="Rechercher par numéro, titre ou client…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-foreground-muted" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-foreground-muted">
            {search ? "Aucun devis ne correspond à cette recherche." : "Aucun devis accepté disponible."}
          </p>
        ) : (
          <div className="max-h-72 space-y-1.5 overflow-y-auto">
            {filtered.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => onSelect(q)}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-left hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-mono text-[13px] font-semibold text-foreground">
                      {q.quoteNumber}
                    </p>
                    <p className="truncate text-[13px] text-foreground-muted">{q.title}</p>
                    <p className="text-[12px] text-foreground-muted">{q.clientName}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[13px] font-medium tabular-nums text-foreground">
                      {formatCurrency(q.totalAmount, q.currency)}
                    </p>
                    {q.validUntil ? (
                      <p className="text-[11px] text-foreground-muted">
                        Validité : {formatDate(q.validUntil)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
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
    <div
      className={cn(
        "grid gap-2 rounded-lg border p-3 transition-colors",
        hasAnyError ? "border-destructive/60 bg-destructive/5" : "border-border",
      )}
    >
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
          <Input {...register(`items.${index}.unit`)} placeholder="Forfait" />
        </div>
      </div>

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
          <Label className="text-[12px]">Prix unitaire *</Label>
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

      <div className="space-y-1">
        <Label className="text-[12px] text-foreground-muted">Description (optionnelle)</Label>
        <Input
          {...register(`items.${index}.description`)}
          placeholder="Détails visibles dans la facture PDF..."
          className="text-[13px]"
        />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewInvoicePage() {
  usePageTitle("Nouvelle facture");

  const router = useRouter();
  const createInvoice = useCreateInvoice();

  const [mode, setMode] = useState<Mode>("idle");
  const [selectedQuoteSummary, setSelectedQuoteSummary] = useState<QuoteSummary | null>(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);

  // Accepted quotes for the picker
  const { data: quotesData, isLoading: loadingQuotes } = useQuotes({
    status: "ACCEPTED",
    size: 100,
  });

  // Full quote details for pre-fill
  const { data: fullQuote, isLoading: loadingFullQuote } = useQuote(selectedQuoteId);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      items: [{ designation: "", quantity: 1, unitPrice: 0, discountPercent: 0, unit: "Forfait" }],
      discountPercent: 0,
      taxRate: 18,
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });
  const watchedItems     = useWatch({ control: form.control, name: "items" });
  const watchedDiscount  = useWatch({ control: form.control, name: "discountPercent" });
  const watchedTax       = useWatch({ control: form.control, name: "taxRate" });
  const totals = useLiveTotals(watchedItems ?? [], watchedDiscount ?? 0, watchedTax);

  // Pre-fill form when full quote data arrives
  useEffect(() => {
    if (!fullQuote) return;
    form.reset({
      clientId: fullQuote.clientId,
      title: fullQuote.title,
      items: fullQuote.items.map((item) => ({
        designation: item.designation,
        description: item.description ?? "",
        quantity: item.quantity,
        unit: item.unit ?? "Forfait",
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
      })),
      discountPercent: fullQuote.discountPercent,
      taxRate: fullQuote.taxRate ?? 18,
      dueDate: "",
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullQuote]);

  function handleQuoteSelect(q: QuoteSummary | null) {
    setSelectedQuoteSummary(q);
    setSelectedQuoteId(q?.id ?? null);
    if (!q) {
      form.reset({
        items: [{ designation: "", quantity: 1, unitPrice: 0, discountPercent: 0, unit: "Forfait" }],
        discountPercent: 0,
        taxRate: 18,
      });
    }
  }

  async function onSubmit(values: FormValues) {
    try {
      const invoice = await createInvoice.mutateAsync({
        clientId: values.clientId,
        title: values.title,
        quoteId: selectedQuoteId ?? undefined,
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
        dueDate: values.dueDate || undefined,
      });
      toast.success(`Facture ${invoice.invoiceNumber} créée`);
      router.push(`/invoices/${invoice.id}`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  // ── Mode selector screen ──────────────────────────────────────────────────
  if (mode === "idle") {
    return <ModeSelector onSelect={setMode} onBack={() => router.back()} />;
  }

  const showForm = mode === "blank" || (mode === "from-quote" && !!fullQuote);
  const waitingForQuote = mode === "from-quote" && selectedQuoteId && loadingFullQuote;

  // ── Form screen ───────────────────────────────────────────────────────────
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setMode("idle");
              setSelectedQuoteSummary(null);
              setSelectedQuoteId(null);
              form.reset({
                items: [{ designation: "", quantity: 1, unitPrice: 0, discountPercent: 0, unit: "Forfait" }],
                discountPercent: 0,
                taxRate: 18,
              });
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-muted hover:bg-background-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-[22px] font-semibold">Nouvelle facture</h1>
        </div>
        {showForm ? (
          <Button
            type="submit"
            disabled={createInvoice.isPending}
            className="rounded-full active:scale-95 transition-transform"
          >
            {createInvoice.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement…
              </>
            ) : (
              "Enregistrer la facture"
            )}
          </Button>
        ) : null}
      </div>

      {/* Quote picker (from-quote mode only) */}
      {mode === "from-quote" ? (
        <QuotePicker
          quotes={quotesData?.content ?? []}
          isLoading={loadingQuotes}
          selected={selectedQuoteSummary}
          onSelect={handleQuoteSelect}
        />
      ) : null}

      {/* Spinner while loading full quote */}
      {waitingForQuote ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-foreground-muted" />
        </div>
      ) : null}

      {/* Form — shown once mode is blank OR a full quote is loaded */}
      {showForm ? (
        <>
          {/* Client + Titre */}
          <Card
            className={cn(
              "border-border-soft",
              (form.formState.errors.clientId || form.formState.errors.title) &&
                "ring-1 ring-destructive/40",
            )}
          >
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
                <Label htmlFor="title">Titre de la facture *</Label>
                <Input
                  id="title"
                  {...form.register("title")}
                  placeholder="ex: Développement site e-commerce"
                  aria-invalid={!!form.formState.errors.title}
                />
                {form.formState.errors.title ? (
                  <p className="text-[12px] text-danger">
                    {form.formState.errors.title.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dueDate">Date d'échéance</Label>
                <Input id="dueDate" type="date" {...form.register("dueDate")} />
              </div>
            </CardContent>
          </Card>

          {/* Lignes */}
          <Card
            className={cn(
              "border-border-soft",
              form.formState.errors.items && "ring-1 ring-destructive/40",
            )}
          >
            <CardHeader className="flex-row items-center justify-between pb-4">
              <CardTitle className="text-[16px]">Lignes de facturation</CardTitle>
              <button
                type="button"
                onClick={() =>
                  append({ designation: "", quantity: 1, unitPrice: 0, discountPercent: 0, unit: "Forfait" })
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
                      type="number" step="0.1" min="0" max="100"
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
                      type="number" step="0.1" min="0" max="100"
                      className="h-6 w-14 px-1.5 text-center text-[12px]"
                    />
                    <span>%</span>
                  </div>
                  <span className="tabular-nums">{formatCurrency(totals.taxAmount, "XOF")}</span>
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
        </>
      ) : null}
    </form>
  );
}
