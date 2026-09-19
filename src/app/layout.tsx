import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Vote ProDigital — Bootcamp Digital Academy",
  description:
    "Votez pour votre candidat préféré du Bootcamp Digital Academy de ProDigital Center. Soutenance le 7 novembre 2026.",
  openGraph: {
    title: "Vote ProDigital — Bootcamp Digital Academy",
    description:
      "Votez pour votre candidat préféré du Bootcamp Digital Academy de ProDigital Center.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${montserrat.variable}`}>
      <body className="min-h-screen bg-white font-[family-name:var(--font-montserrat)] antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
