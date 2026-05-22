"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  Building2,
  ExternalLink,
  FolderKanban,
  Globe,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Receipt,
  StickyNote,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientFormDialog } from "@/components/app/clients/ClientFormDialog";
import { EmptyState } from "@/components/app/shared/EmptyState";
import { StatusBadge } from "@/components/app/shared/StatusBadge";
import { useClient } from "@/hooks/use-clients";
import { usePageTitle } from "@/hooks/use-page-title";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Client, ClientType } from "@/types/api";

const typeLabels: Record<ClientType, string> = {
  SME: "PME",
  NGO: "ONG / Association",
  PUBLIC: "Collectivité publique",
  STARTUP: "Startup",
  INDIVIDUAL: "Particulier",
};

function clientInitials(client: Client): string {
  return client.name
    .split(/[\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

export default function ClientDetailPage() {
  // useParams returns a synchronous object inside Client Components,
  // sidestepping the SSR worker hiccup we hit when unwrapping the
  // Promise-form `params` prop on Next.js 16 Turbopack.
  const params = useParams<{ id: string }>();
  const clientId = Number(params.id);
  if (!Number.isFinite(clientId)) notFound();

  const router = useRouter();
  const { data: client, isLoading, isError } = useClient(clientId);
  const [editOpen, setEditOpen] = useState(false);

  usePageTitle(
    client?.name ?? "Fiche client",
    client ? `${typeLabels[client.type]}${client.city ? ` · ${client.city}` : ""}` : null,
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-[18px]" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-[18px]" />
          ))}
        </div>
        <Skeleton className="h-[300px] rounded-[18px]" />
      </div>
    );
  }

  if (isError || !client) {
    return (
      <EmptyState
        icon={Building2}
        title="Client introuvable"
        description="Cette fiche a peut-être été supprimée ou vous n'avez pas accès."
        action={
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => router.push("/clients")}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Retour à la liste
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1 text-[13px] text-foreground-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Tous les clients
      </Link>

      {/* Header card */}
      <Card className="rounded-[18px] border-border-soft">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-primary/10 text-[18px] font-semibold text-primary">
                  {clientInitials(client)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-[24px] font-semibold leading-tight tracking-tight text-foreground">
                    {client.name}
                  </h1>
                  <StatusBadge status={client.status} />
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-foreground-muted">
                  <span>{typeLabels[client.type]}</span>
                  {client.industry ? (
                    <>
                      <span className="text-foreground-subtle">·</span>
                      <span>{client.industry}</span>
                    </>
                  ) : null}
                  {client.city || client.country ? (
                    <>
                      <span className="text-foreground-subtle">·</span>
                      <span>{[client.city, client.country].filter(Boolean).join(", ")}</span>
                    </>
                  ) : null}
                  <span className="text-foreground-subtle">·</span>
                  <span>Créé le {formatDate(client.createdAt)}</span>
                </div>

                {/* Contact strip */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {client.email ? (
                    <ContactLink href={`mailto:${client.email}`} icon={Mail}>
                      {client.email}
                    </ContactLink>
                  ) : null}
                  {client.phoneNumber ? (
                    <ContactLink href={`tel:${client.phoneNumber}`} icon={Phone}>
                      {client.phoneNumber}
                    </ContactLink>
                  ) : null}
                  {client.whatsappNumber ? (
                    <ContactLink
                      href={`https://wa.me/${client.whatsappNumber.replace(/[^0-9]/g, "")}`}
                      icon={MessageCircle}
                    >
                      WhatsApp
                    </ContactLink>
                  ) : null}
                  {client.websiteUrl ? (
                    <ContactLink href={client.websiteUrl} external icon={Globe}>
                      Site web
                    </ContactLink>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setEditOpen(true)}
              >
                Modifier
              </Button>
              <Button
                className="rounded-full active:scale-95 transition-transform"
                onClick={() => router.push(`/pipeline?clientId=${client.id}`)}
              >
                <Plus className="mr-1 h-4 w-4" />
                Nouveau deal
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI tiles */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiTile
          icon={FolderKanban}
          label="Deals"
          value={formatNumber(client.dealsCount ?? 0)}
        />
        <KpiTile
          icon={Receipt}
          label="Projets"
          value={formatNumber(client.projectsCount ?? 0)}
        />
        <KpiTile
          icon={Banknote}
          label="CA total"
          value={formatCurrency(client.totalRevenue ?? 0, "XOF")}
          emphasis
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="deals" className="space-y-4">
        <TabsList className="bg-background-soft">
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="quotes">Devis</TabsTrigger>
          <TabsTrigger value="projects">Projets</TabsTrigger>
          <TabsTrigger value="invoices">Factures</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="deals">
          <EmptyState
            icon={FolderKanban}
            title="Aucun deal pour ce client"
            description="Créez un deal pour suivre cette opportunité commerciale."
            action={
              <Button
                className="rounded-full active:scale-95 transition-transform"
                onClick={() => router.push(`/pipeline?clientId=${client.id}`)}
              >
                <Plus className="mr-1 h-4 w-4" />
                Créer un deal
              </Button>
            }
          />
        </TabsContent>

        <TabsContent value="quotes">
          <EmptyState
            title="Aucun devis"
            description="Les devis envoyés à ce client apparaîtront ici."
            action={
              <Button
                className="rounded-full active:scale-95 transition-transform"
                onClick={() => router.push(`/quotes/new?clientId=${client.id}`)}
              >
                <Plus className="mr-1 h-4 w-4" />
                Nouveau devis
              </Button>
            }
          />
        </TabsContent>

        <TabsContent value="projects">
          <EmptyState
            title="Aucun projet en cours"
            description="Les projets démarrent automatiquement quand un devis est accepté."
          />
        </TabsContent>

        <TabsContent value="invoices">
          <EmptyState
            title="Aucune facture"
            description="Les factures liées à ce client apparaîtront ici."
          />
        </TabsContent>

        <TabsContent value="notes">
          <Card className="rounded-[14px] border-border-soft">
            <CardContent className="p-6">
              <div className="mb-3 flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-foreground-muted" />
                <h3 className="text-[14px] font-semibold tracking-tight">
                  Notes internes
                </h3>
              </div>
              {client.notes ? (
                <p className="body-17 whitespace-pre-line text-foreground">
                  {client.notes}
                </p>
              ) : (
                <p className="caption-14 text-foreground-muted">
                  Aucune note pour l&apos;instant. Cliquez sur Modifier pour en
                  ajouter.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ClientFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={client}
      />
    </div>
  );
}

interface KpiTileProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  emphasis?: boolean;
}
function KpiTile({ icon: Icon, label, value, emphasis }: KpiTileProps) {
  return (
    <Card
      className={cn(
        "rounded-[18px] border-border-soft",
        emphasis && "border-primary/30 bg-primary/[0.03]",
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-foreground-muted" />
          <span className="caption-14 text-foreground-muted">{label}</span>
        </div>
        <div className="mt-2 text-[24px] font-semibold tracking-tight text-foreground">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

interface ContactLinkProps {
  href: string;
  external?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}
function ContactLink({ href, external, icon: Icon, children }: ContactLinkProps) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="inline-flex items-center gap-1.5 rounded-md border border-border-soft bg-surface px-2.5 py-1 text-[12px] text-foreground-muted transition-colors hover:bg-background-muted hover:text-foreground"
    >
      <Icon className="h-3 w-3" />
      <span className="max-w-[180px] truncate">{children}</span>
      {external ? <ExternalLink className="h-2.5 w-2.5" /> : null}
    </a>
  );
}
