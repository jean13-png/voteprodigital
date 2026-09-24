import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://voteprodigital.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "Vote ProDigital — Bootcamp Digital Academy",
  description:
    "Votez pour votre candidat préféré du Bootcamp Digital Academy de ProDigital Center. Soutenance le 7 novembre 2026.",
  openGraph: {
    title: "Vote ProDigital — Bootcamp Digital Academy 2026",
    description:
      "Soutenez votre candidat favori du Bootcamp Digital Academy ! Chaque vote compte. Votez maintenant sur ProDigital Center.",
    url: BASE_URL,
    siteName: "ProDigital Center",
    type: "website",
    locale: "fr_FR",
    images: [
      {
        url: "/images/logo.jpeg",
        width: 1200,
        height: 630,
        alt: "ProDigital Center — Bootcamp Digital Academy 2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vote ProDigital — Bootcamp Digital Academy 2026",
    description: "Soutenez votre candidat favori du Bootcamp Digital Academy !",
    images: ["/images/logo.jpeg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body className="min-h-screen bg-white antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
