import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";

import { AppProviders } from "@/components/providers/AppProviders";
import { Gate } from "@/components/Gate";

import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Daybook",
  description: "Your daily life, kept in one place",
  appleWebApp: {
    capable: true,
    title: "Daybook",
    statusBarStyle: "default",
  },
  applicationName: "Daybook",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F6F5" },
    { media: "(prefers-color-scheme: dark)", color: "#121816" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        <AppProviders>
          <Gate>{children}</Gate>
        </AppProviders>
      </body>
    </html>
  );
}
