"use client";

import { useState } from "react";
import {
  Download,
  FileSpreadsheet,
  Globe,
  Loader2,
  MapPin,
  Phone,
  Plus,
  Search,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePageTitle } from "@/hooks/use-page-title";
import { useAgencyId } from "@/hooks/use-agency";
import { extractErrorMessage } from "@/lib/axios";
import {
  searchProspection,
  exportProspectionXlsx,
  importProspectionLeads,
  type Lead,
} from "@/lib/api/prospection";

export default function ProspectionPage() {
  usePageTitle("Prospection", "Trouvez de nouveaux clients");

  const agencyId = useAgencyId();

  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [searched, setSearched] = useState(false);

  const selectedLeads = leads.filter((l) => selected.has(l.placeId));
  const allSelected = leads.length > 0 && selected.size === leads.length;

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || !agencyId) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await searchProspection(agencyId, query.trim(), location.trim() || undefined);
      setLeads(res.leads);
      setSelected(new Set());
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(placeId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) next.delete(placeId);
      else next.add(placeId);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(leads.map((l) => l.placeId)));
    }
  }

  function handleExportCsv() {
    const rows = selectedLeads.length > 0 ? selectedLeads : leads;
    if (rows.length === 0) return;

    const quote = (v: string | number | null | undefined) =>
      `"${String(v ?? "").replace(/"/g, '""')}"`;

    const header = ["Nom", "Adresse", "Téléphone", "Site web"].map(quote).join(";");
    const lines = rows.map((l) =>
      [l.name, l.address, l.phone, l.website].map(quote).join(";"),
    );

    const csv = "﻿" + [header, ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prospection-${query.replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleExportXlsx() {
    const rows = selectedLeads.length > 0 ? selectedLeads : leads;
    if (rows.length === 0 || !agencyId) return;
    setExportingXlsx(true);
    try {
      const blob = await exportProspectionXlsx(
        agencyId,
        rows,
        `prospection-${query.replace(/\s+/g, "-")}`,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prospection-${query.replace(/\s+/g, "-")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setExportingXlsx(false);
    }
  }

  async function handleImportCrm() {
    const rows = selectedLeads.length > 0 ? selectedLeads : leads;
    if (rows.length === 0 || !agencyId) return;
    setImporting(true);
    try {
      const res = await importProspectionLeads(agencyId, rows);
      if (res.imported > 0) {
        toast.success(
          `${res.imported} client${res.imported > 1 ? "s" : ""} importé${res.imported > 1 ? "s" : ""} dans le CRM${res.skipped > 0 ? ` (${res.skipped} déjà existant${res.skipped > 1 ? "s" : ""})` : ""}`,
        );
        setSelected(new Set());
      } else {
        toast.info("Tous ces clients existent déjà dans votre CRM.");
      }
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setImporting(false);
    }
  }

  const actionCount = selectedLeads.length > 0 ? selectedLeads.length : leads.length;

  return (
    <div className="space-y-6">
      {/* Search form */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-[15px] font-semibold text-foreground">
          Rechercher des prospects
        </h2>
        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
            <Input
              className="pl-9"
              placeholder='Ex : "Restaurant", "Pharmacie", "Agence immobilière"…'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="relative sm:w-56">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
            <Input
              className="pl-9"
              placeholder="Lomé (obligatoire)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={!query.trim() || !location.trim() || loading}
            className="rounded-full shrink-0"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Rechercher
          </Button>
        </form>

        {searched && !loading && (
          <p className="mt-3 text-[13px] text-foreground-muted">
            {leads.length === 0
              ? "Aucun résultat trouvé."
              : `${leads.length} résultat${leads.length > 1 ? "s" : ""} trouvé${leads.length > 1 ? "s" : ""}`}
          </p>
        )}
      </div>

      {/* Action bar */}
      {leads.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
          <div className="flex items-center gap-3 text-[13px] text-foreground-muted">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="h-4 w-4 cursor-pointer rounded accent-foreground"
            />
            <span>
              {selected.size > 0
                ? `${selected.size} sélectionné${selected.size > 1 ? "s" : ""}`
                : `${leads.length} résultat${leads.length > 1 ? "s" : ""}`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] text-foreground-subtle">
              {selected.size > 0 ? `${selected.size} sélectionnés` : "Tous"}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="rounded-full"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              CSV
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportXlsx}
              disabled={exportingXlsx}
              className="rounded-full"
            >
              {exportingXlsx ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
              )}
              Excel
            </Button>

            <Button
              size="sm"
              onClick={handleImportCrm}
              disabled={importing}
              className="rounded-full"
            >
              {importing ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="mr-1.5 h-3.5 w-3.5" />
              )}
              Ajouter au CRM
              <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[11px]">
                {actionCount}
              </span>
            </Button>
          </div>
        </div>
      ) : null}

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 className="h-8 w-8 animate-spin text-foreground-muted" />
          <p className="text-[14px] text-foreground-muted">
            Recherche en cours sur OpenStreetMap…
          </p>
        </div>
      ) : leads.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-background-muted">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 cursor-pointer rounded accent-foreground"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-foreground-muted">Établissement</th>
                <th className="hidden px-4 py-3 text-left font-medium text-foreground-muted md:table-cell">Adresse</th>
                <th className="hidden px-4 py-3 text-left font-medium text-foreground-muted sm:table-cell">Téléphone</th>
                <th className="hidden px-4 py-3 text-left font-medium text-foreground-muted lg:table-cell">Site web</th>
                <th className="px-4 py-3 text-right font-medium text-foreground-muted">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.map((lead) => {
                const isSelected = selected.has(lead.placeId);
                return (
                  <tr
                    key={lead.placeId}
                    onClick={() => toggleSelect(lead.placeId)}
                    className={`cursor-pointer transition-colors hover:bg-background-muted ${
                      isSelected ? "bg-primary/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(lead.placeId)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 cursor-pointer rounded accent-foreground"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{lead.name}</p>
                      {lead.address ? (
                        <p className="mt-0.5 text-[12px] text-foreground-muted md:hidden">
                          {lead.address}
                        </p>
                      ) : null}
                      {lead.phone ? (
                        <p className="mt-0.5 flex items-center gap-1 text-[12px] text-foreground-muted sm:hidden">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </p>
                      ) : null}
                    </td>
                    <td className="hidden px-4 py-3 text-foreground-muted md:table-cell">
                      <div className="flex items-start gap-1.5 max-w-[220px]">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground-subtle" />
                        <span className="truncate">{lead.address ?? "—"}</span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      {lead.phone ? (
                        <a
                          href={`tel:${lead.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {lead.phone}
                        </a>
                      ) : (
                        <span className="text-foreground-subtle">—</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      {lead.website ? (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-primary hover:underline truncate max-w-[180px]"
                        >
                          <Globe className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {lead.website.replace(/^https?:\/\/(www\.)?/, "")}
                          </span>
                        </a>
                      ) : (
                        <span className="text-foreground-subtle">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {lead.rating != null ? (
                        <div className="flex items-center justify-end gap-1">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium text-foreground">{lead.rating.toFixed(1)}</span>
                          {lead.reviewCount != null ? (
                            <span className="text-[11px] text-foreground-subtle">
                              ({lead.reviewCount})
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-foreground-subtle">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

        </div>
      ) : searched ? null : (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background-muted">
            <Search className="h-7 w-7 text-foreground-muted" />
          </div>
          <p className="text-[15px] font-medium text-foreground">Prospectez de nouveaux clients</p>
          <p className="max-w-sm text-[13px] text-foreground-muted">
            Tapez un type d'établissement et une ville pour récupérer une liste de prospects avec
            numéros de téléphone, adresses et sites web.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {["Restaurant Lomé", "Pharmacie Abidjan", "Hôtel Dakar", "Startup Douala"].map((s) => (
              <button
                key={s}
                onClick={() => {
                  const parts = s.split(" ");
                  setQuery(parts[0]);
                  setLocation(parts.slice(1).join(" "));
                }}
                className="rounded-full border border-border px-3 py-1 text-[12px] text-foreground-muted hover:bg-background-muted transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
