"use client";

import { use, useEffect, useState } from "react";
import { CheckCircle, Loader2, ShieldCheck } from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081";

interface ContractPortal {
  id: number;
  contractNumber: string;
  title: string;
  content?: string;
  status: string;
  clientName: string;
  validUntil?: string;
  signedAt?: string;
  signerName?: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ContractSignPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [contract, setContract] = useState<ContractPortal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signed, setSigned] = useState(false);

  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    axios
      .get<ContractPortal>(`${API_URL}/api/portal/contracts/${token}`)
      .then((res) => {
        setContract(res.data);
        if (res.data.status === "SIGNED") setSigned(true);
      })
      .catch(() => setError("Contrat introuvable ou lien expiré."))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSign(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!signerName.trim()) errs.signerName = "Nom obligatoire";
    if (!signerEmail.trim()) errs.signerEmail = "Email obligatoire";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signerEmail))
      errs.signerEmail = "Email invalide";
    if (!agreed) errs.agreed = "Vous devez accepter les termes du contrat";
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      const res = await axios.post<ContractPortal>(
        `${API_URL}/api/portal/contracts/${token}/sign`,
        { signerName: signerName.trim(), signerEmail: signerEmail.trim() },
      );
      setContract(res.data);
      setSigned(true);
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg =
        axiosErr?.response?.data?.message ?? "Une erreur est survenue. Réessayez.";
      setFieldErrors({ global: msg });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#71717a]" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-[16px] font-semibold text-[#dc2626]">Lien invalide</p>
          <p className="mt-2 text-[14px] text-[#71717a]">
            {error ?? "Ce contrat n'existe pas."}
          </p>
        </div>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#dcfce7]">
            <CheckCircle className="h-8 w-8 text-[#16a34a]" />
          </div>
          <h1 className="text-[20px] font-bold text-[#18181b]">Contrat signé</h1>
          <p className="mt-2 text-[14px] text-[#71717a]">
            {contract.contractNumber} — {contract.title}
          </p>
          {contract.signedAt ? (
            <p className="mt-4 text-[13px] text-[#71717a]">
              Signé le{" "}
              <strong className="text-[#18181b]">{formatDate(contract.signedAt)}</strong>
              {contract.signerName ? (
                <>
                  {" "}par <strong className="text-[#18181b]">{contract.signerName}</strong>
                </>
              ) : null}
            </p>
          ) : null}
          <div className="mt-6 flex items-center justify-center gap-2 text-[12px] text-[#a1a1aa]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Signature électronique certifiée · AtlasCRM</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 py-10">
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Header */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-1 text-[13px] font-medium text-[#71717a]">
            {contract.contractNumber}
          </div>
          <h1 className="text-[20px] font-bold text-[#18181b]">{contract.title}</h1>
          <p className="mt-1 text-[14px] text-[#71717a]">Client : {contract.clientName}</p>
          {contract.validUntil ? (
            <p className="mt-0.5 text-[13px] text-[#71717a]">
              Valide jusqu&apos;au {formatDate(contract.validUntil)}
            </p>
          ) : null}
        </div>

        {/* Content */}
        {contract.content ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-[15px] font-semibold text-[#18181b]">
              Contenu du contrat
            </h2>
            <div className="max-h-[400px] overflow-y-auto rounded-lg bg-[#f4f4f5] p-4">
              <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-[#3f3f46]">
                {contract.content}
              </pre>
            </div>
          </div>
        ) : null}

        {/* Sign form */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-[15px] font-semibold text-[#18181b]">
            Signer le contrat
          </h2>

          <form onSubmit={handleSign} className="space-y-4">
            <div>
              <label
                htmlFor="signer-name"
                className="mb-1.5 block text-[13px] font-medium text-[#3f3f46]"
              >
                Votre nom complet *
              </label>
              <input
                id="signer-name"
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Prénom Nom"
                className="w-full rounded-lg border border-[#e4e4e7] bg-white px-3 py-2 text-[14px] text-[#18181b] placeholder:text-[#a1a1aa] focus:border-[#18181b] focus:outline-none"
              />
              {fieldErrors.signerName ? (
                <p className="mt-1 text-[12px] text-[#dc2626]">{fieldErrors.signerName}</p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="signer-email"
                className="mb-1.5 block text-[13px] font-medium text-[#3f3f46]"
              >
                Votre adresse email *
              </label>
              <input
                id="signer-email"
                type="email"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                placeholder="vous@exemple.com"
                className="w-full rounded-lg border border-[#e4e4e7] bg-white px-3 py-2 text-[14px] text-[#18181b] placeholder:text-[#a1a1aa] focus:border-[#18181b] focus:outline-none"
              />
              {fieldErrors.signerEmail ? (
                <p className="mt-1 text-[12px] text-[#dc2626]">{fieldErrors.signerEmail}</p>
              ) : null}
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-[#e4e4e7] p-3">
              <input
                id="agreed"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 cursor-pointer rounded border-[#e4e4e7] accent-[#18181b]"
              />
              <label htmlFor="agreed" className="cursor-pointer text-[13px] text-[#3f3f46]">
                J&apos;ai lu et j&apos;accepte les termes de ce contrat. Je confirme que ma signature
                électronique a la même valeur juridique qu&apos;une signature manuscrite.
              </label>
            </div>
            {fieldErrors.agreed ? (
              <p className="text-[12px] text-[#dc2626]">{fieldErrors.agreed}</p>
            ) : null}

            {fieldErrors.global ? (
              <p className="rounded-lg bg-[#fef2f2] px-3 py-2 text-[13px] text-[#dc2626]">
                {fieldErrors.global}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#18181b] py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {submitting ? "Signature en cours…" : "Signer le contrat"}
            </button>
          </form>
        </div>

        <p className="text-center text-[12px] text-[#a1a1aa]">
          © 2025 AtlasCRM · Signature électronique sécurisée
        </p>
      </div>
    </div>
  );
}
