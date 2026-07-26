import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "QuantStrike AI — AI-Powered Options Analysis",
  description:
    "Analyze option chains, quantitative indicators, price action, volume, and technical indicators to find the highest probability option strike prices. Educational and probabilistic analysis only.",
  keywords: ["options", "NIFTY", "BANKNIFTY", "option chain", "technical analysis", "AI"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased dark`}>
      <body className="min-h-full bg-background text-foreground">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
