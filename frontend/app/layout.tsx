import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AtlasCRM — Le CRM des agences web africaines",
    template: "%s · AtlasCRM",
  },
  description:
    "Plateforme tout-en-un pour agences web africaines : CRM, devis, contrats, facturation Mobile Money, projets et rendez-vous.",
  applicationName: "AtlasCRM",
  authors: [{ name: "AtlasCRM" }],
  keywords: [
    "CRM",
    "agences web",
    "Afrique",
    "Mobile Money",
    "FedaPay",
    "PayDunya",
    "devis",
    "OHADA",
    "facturation",
  ],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111113" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
