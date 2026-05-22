"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  Download,
  Loader2,
  Pencil,
  Send,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/app/shared/StatusBadge";
import { usePageTitle } from "@/hooks/use-page-title";
import {
  useContract,
  useSendContract,
  useCancelContract,
} from "@/hooks/use-contracts";
import { requireAgencyId } from "@/hooks/use-agency";
import { downloadContractPdf } from "@/lib/api/contracts";
import { formatDate, formatDateTime } from "@/lib/format";
import { extractErrorMessage } from "@/lib/axios";

export default function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const contractId = Number(id);
  const router = useRouter();

  const { data: contract, isLoading, isError } = useContract(contractId);
  usePageTitle(
    contract ? `Contrat ${contract.contractNumber}` : "Contrat",
    contract ? contract.title : undefined,
  );

  const sendContract = useSendContract();
  const cancelContract = useCancelContract();

  async function handleSend() {
    if (!contract) return;
    try {
      await sendContract.mutateAsync(contract.id);
      toast.success(`Contrat envoyé à ${contract.clientName}`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleDownload() {
    if (!contract) return;
    try {
      const agencyId = requireAgencyId();
      const blob = await downloadContractPdf(agencyId, contract.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${contract.contractNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleCancel() {
    if (!contract) return;
    if (!confirm(`Annuler le contrat ${contract.contractNumber} ?`)) return;
    try {
      await cancelContract.mutateAsync({ contractId: contract.id });
      toast.success("Contrat annulé");
      router.push("/contracts");
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

  const canSend = contract.status !== "SIGNED" && contract.status !== "CANCELLED";
  const isSentAlready = contract.status !== "DRAFT";
  const canEdit = contract.status === "DRAFT";
  const canCancel = contract.status !== "CANCELLED" && contract.status !== "SIGNED";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/contracts")}
            className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-muted hover:bg-background-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[15px] font-semibold text-foreground">
                {contract.contractNumber}
              </span>
              <StatusBadge status={contract.status} />
              {contract.expired ? (
                <span className="rounded-full bg-danger-bg px-2 py-0.5 text-[11px] font-medium text-danger">
                  Expiré
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-[13px] text-foreground-muted">{contract.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit ? (
            <Button
              variant="outline"
              onClick={() => router.push(`/contracts/${contract.id}/edit`)}
              className="rounded-full active:scale-95 transition-transform"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          ) : null}

          {canSend ? (
            <Button
              onClick={handleSend}
              disabled={sendContract.isPending}
              className="rounded-full active:scale-95 transition-transform"
            >
              {sendContract.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {isSentAlready ? "Ré-envoyer" : "Envoyer"}
            </Button>
          ) : null}

          <Button
            variant="outline"
            onClick={handleDownload}
            className="rounded-full active:scale-95 transition-transform"
          >
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>

          {canCancel ? (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={cancelContract.isPending}
              className="rounded-full text-danger hover:bg-danger-bg hover:text-danger active:scale-95 transition-transform"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Annuler
            </Button>
          ) : null}
        </div>
      </div>

      {/* Info row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border-soft">
          <CardContent className="pt-5">
            <p className="caption-14 text-foreground-muted">Client</p>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <p className="font-medium text-foreground">{contract.clientName}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border-soft">
          <CardContent className="pt-5">
            <p className="caption-14 text-foreground-muted">Validité</p>
            <p className="mt-1 font-medium text-foreground">
              {contract.validUntil ? formatDate(contract.validUntil) : "Indéfinie"}
            </p>
            {contract.sentAt ? (
              <p className="text-[12px] text-foreground-muted">
                Envoyé le {formatDate(contract.sentAt)}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border-soft">
          <CardContent className="pt-5">
            <p className="caption-14 text-foreground-muted">Créé par</p>
            <p className="mt-1 font-medium text-foreground">
              {contract.createdByName ?? "—"}
            </p>
            <p className="text-[12px] text-foreground-muted">
              {formatDateTime(contract.createdAt)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Signature info */}
      {contract.status === "SIGNED" && contract.signerName ? (
        <Card className="border-border-soft">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-[16px]">
              <CheckCircle className="h-4 w-4 text-success" />
              Signature électronique
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="caption-14 text-foreground-muted">Signataire</p>
              <p className="mt-1 font-medium text-foreground">{contract.signerName}</p>
              {contract.signerEmail ? (
                <p className="text-[12px] text-foreground-muted">{contract.signerEmail}</p>
              ) : null}
            </div>
            <div>
              <p className="caption-14 text-foreground-muted">Date de signature</p>
              <p className="mt-1 font-medium text-success">
                {contract.signedAt ? formatDateTime(contract.signedAt) : "—"}
              </p>
            </div>
            {contract.signerIpAddress ? (
              <div>
                <p className="caption-14 text-foreground-muted">Adresse IP</p>
                <p className="mt-1 font-mono text-[13px] text-foreground">
                  {contract.signerIpAddress}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* Contract content */}
      {contract.content ? (
        <Card className="border-border-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-[16px]">Contenu du contrat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-background-muted p-4">
              <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-foreground">
                {contract.content}
              </pre>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Linked quote */}
      {contract.quoteId ? (
        <Card className="border-border-soft">
          <CardContent className="pt-5">
            <p className="caption-14 text-foreground-muted">Devis d&apos;origine</p>
            <button
              onClick={() => router.push(`/quotes/${contract.quoteId}`)}
              className="mt-1 font-medium text-primary hover:underline"
            >
              {contract.quoteName ?? `Devis #${contract.quoteId}`}
            </button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
