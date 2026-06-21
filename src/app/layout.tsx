import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MNEMO · Votre monde virtuel d'apprentissage",
  description:
    "Soumettez vos cours (DataCamp, liens, notes), l'IA génère des missions style GTA spécifiques. Complétez les cursus pour donner naissance à des agents virtuels - votre mémoire dans chaque domaine.",
  keywords: [
    "apprentissage",
    "Mnemo",
    "Python",
    "SQL",
    "IA",
    "data science",
    "DataCamp",
    "missions",
    "agents virtuels",
  ],
  authors: [{ name: "Mnemo" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
          <Toaster
            position="top-right"
            theme="dark"
            toastOptions={{
              style: {
                background: "rgb(24 24 27)",
                border: "1px solid rgb(63 63 70)",
                color: "rgb(244 244 245)",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
