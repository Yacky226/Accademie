import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Manrope, Space_Grotesk } from "next/font/google";
import { readServerSessionCookieSnapshot } from "@/core/auth/session-cookie-store";
import { ApplicationProviders } from "@/core/providers/ApplicationProviders";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Academie | Formations en Algorithmique",
  description:
    "Vitrine de formations avec espace etudiant, evaluation, suivi des paiements et calendrier.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialSession = readServerSessionCookieSnapshot(cookieStore);

  return (
    <html lang="fr" className={`${manrope.variable} ${spaceGrotesk.variable}`}>
      <body>
        <ApplicationProviders initialSession={initialSession}>{children}</ApplicationProviders>
      </body>
    </html>
  );
}
