import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Academie | Formations en Algorithmique",
  description:
    "Vitrine de formations avec espace etudiant, evaluation, suivi des paiements et calendrier.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
