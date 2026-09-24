import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

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
