"use client";

import { useEffect } from "react";
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
import { useCreateClient, useUpdateClient } from "@/hooks/use-clients";
import { extractErrorMessage } from "@/lib/axios";
import type { Client, ClientStatus, ClientType } from "@/types/api";

const clientSchema = z.object({
  name: z.string().min(2, "Nom de l'organisation requis"),
  type: z.enum(["SME", "NGO", "PUBLIC", "STARTUP", "INDIVIDUAL"]),
  status: z.enum(["PROSPECT", "ACTIVE", "INACTIVE"]),
  contactFirstName: z.string().optional(),
  contactLastName: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, {
      message: "Email invalide",
    }),
  phoneNumber: z.string().optional(),
  whatsappNumber: z.string().optional(),
  industry: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  websiteUrl: z
    .string()
    .optional()
    .refine((v) => !v || z.string().url().safeParse(v).success, {
      message: "URL invalide",
    }),
  notes: z.string().optional(),
});

type ClientForm = z.infer<typeof clientSchema>;

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog enters edit mode and pre-fills the form. */
  initial?: Client | null;
  onSuccess?: (client: Client) => void;
}

const typeLabels: Record<ClientType, string> = {
  SME: "PME",
  NGO: "ONG / Association",
  PUBLIC: "Collectivité / Public",
  STARTUP: "Startup",
  INDIVIDUAL: "Particulier",
};

const statusLabels: Record<ClientStatus, string> = {
  PROSPECT: "Prospect",
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
};

const emptyDefaults: ClientForm = {
  name: "",
  type: "SME",
  status: "PROSPECT",
  contactFirstName: "",
  contactLastName: "",
  email: "",
  phoneNumber: "",
  whatsappNumber: "",
  industry: "",
  city: "",
  country: "",
  websiteUrl: "",
  notes: "",
};

export function ClientFormDialog({
  open,
  onOpenChange,
  initial,
  onSuccess,
}: ClientFormDialogProps) {
  const isEdit = !!initial;
  const create = useCreateClient();
  const update = useUpdateClient(initial?.id ?? null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
    defaultValues: emptyDefaults,
  });

  // Re-prime defaults whenever the dialog opens (or the target client changes).
  useEffect(() => {
    if (!open) return;
    reset({
      ...emptyDefaults,
      ...(initial
        ? {
            name: initial.name,
            type: initial.type,
            status: initial.status,
            contactFirstName: initial.contactFirstName ?? "",
            contactLastName: initial.contactLastName ?? "",
            email: initial.email ?? "",
            phoneNumber: initial.phoneNumber ?? "",
            whatsappNumber: initial.whatsappNumber ?? "",
            industry: initial.industry ?? "",
            city: initial.city ?? "",
            country: initial.country ?? "",
            websiteUrl: initial.websiteUrl ?? "",
            notes: initial.notes ?? "",
          }
        : {}),
    });
  }, [open, initial, reset]);

  async function onSubmit(values: ClientForm) {
    // Strip blank optional strings so we don't shove "" into the backend.
    const payload = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [
        k,
        typeof v === "string" && v.trim() === "" ? undefined : v,
      ]),
    ) as ClientForm;

    try {
      let saved: Client;
      if (isEdit) {
        saved = await update.mutateAsync(payload);
        toast.success("Client mis à jour");
      } else {
        saved = await create.mutateAsync(payload);
        toast.success("Client créé");
      }
      onSuccess?.(saved);
      onOpenChange(false);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  const submitting = create.isPending || update.isPending;
  const typeValue = watch("type");
  const statusValue = watch("status");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier le client" : "Nouveau client"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Mettez à jour les informations de ce client."
              : "Ajoutez un nouveau client à votre carnet d'adresses."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 pt-2"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">Nom de l&apos;organisation *</Label>
            <Input
              id="name"
              autoFocus
              placeholder="Yaoundé Tech SARL"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name ? (
              <p className="caption-14 text-danger">{errors.name.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select
                value={typeValue}
                onValueChange={(v) =>
                  v && setValue("type", v as ClientType, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(typeLabels) as ClientType[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {typeLabels[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Statut *</Label>
              <Select
                value={statusValue}
                onValueChange={(v) =>
                  v && setValue("status", v as ClientStatus, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(statusLabels) as ClientStatus[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {statusLabels[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="contactFirstName">Prénom du contact</Label>
              <Input
                id="contactFirstName"
                placeholder="Aminata"
                {...register("contactFirstName")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactLastName">Nom du contact</Label>
              <Input
                id="contactLastName"
                placeholder="Diop"
                {...register("contactLastName")}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@yaoundetech.cm"
                {...register("email")}
                aria-invalid={!!errors.email}
              />
              {errors.email ? (
                <p className="caption-14 text-danger">{errors.email.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phoneNumber">Téléphone</Label>
              <Input
                id="phoneNumber"
                placeholder="+237 6 00 00 00 00"
                {...register("phoneNumber")}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="whatsappNumber">WhatsApp</Label>
              <Input
                id="whatsappNumber"
                placeholder="+237 6 00 00 00 00"
                {...register("whatsappNumber")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="industry">Secteur d&apos;activité</Label>
              <Input
                id="industry"
                placeholder="Tech, FMCG, ONG..."
                {...register("industry")}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="city">Ville</Label>
              <Input id="city" placeholder="Yaoundé" {...register("city")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country">Pays</Label>
              <Input id="country" placeholder="Cameroun" {...register("country")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="websiteUrl">Site web</Label>
            <Input
              id="websiteUrl"
              type="url"
              placeholder="https://yaoundetech.cm"
              {...register("websiteUrl")}
              aria-invalid={!!errors.websiteUrl}
            />
            {errors.websiteUrl ? (
              <p className="caption-14 text-danger">{errors.websiteUrl.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes internes</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Contexte, préférences, points de vigilance..."
              {...register("notes")}
            />
          </div>

          <DialogFooter className="pt-2">
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
                  Enregistrement...
                </>
              ) : isEdit ? (
                "Enregistrer"
              ) : (
                "Créer le client"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
