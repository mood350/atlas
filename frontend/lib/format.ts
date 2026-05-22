import { formatDistanceToNow, format, isValid, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * West-African Franc (XOF) is the default AtlasCRM currency. The
 * fr-FR locale uses the French thousands separator (non-breaking
 * space) and matches the OHADA convention used on quotes and invoices.
 */
export function formatCurrency(
  value: number | null | undefined,
  currency: string = "XOF",
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "XOF" ? 0 : 2,
    }).format(value);
  } catch {
    // Unknown currency code — fall back to the value with the code suffix.
    return `${value.toLocaleString("fr-FR")} ${currency}`;
  }
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("fr-FR").format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value / 100);
}

function asDate(input: string | Date | null | undefined): Date | null {
  if (!input) return null;
  const date = input instanceof Date ? input : parseISO(input);
  return isValid(date) ? date : null;
}

export function formatRelativeTime(input: string | Date | null | undefined): string {
  const date = asDate(input);
  if (!date) return "—";
  return formatDistanceToNow(date, { addSuffix: true, locale: fr });
}

export function formatDate(
  input: string | Date | null | undefined,
  pattern: string = "dd MMM yyyy",
): string {
  const date = asDate(input);
  if (!date) return "—";
  return format(date, pattern, { locale: fr });
}

export function formatDateTime(input: string | Date | null | undefined): string {
  return formatDate(input, "dd MMM yyyy 'à' HH:mm");
}

/**
 * Returns the number of days since the given timestamp. Useful for
 * inactivity highlighting on the Kanban deal cards.
 */
export function daysSince(input: string | Date | null | undefined): number {
  const date = asDate(input);
  if (!date) return 0;
  const ms = Date.now() - date.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}
