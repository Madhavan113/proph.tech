import type { Metadata } from "next";
import { Inter, Crimson_Text, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

const crimsonText = Crimson_Text({
  variable: "--font-crimson",
  weight: ['400', '600', '700'],
  subsets: ["latin"],
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  weight: ['400', '700', '900'],
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Prophet - Bet on Everything",
  description: "The bet on everything market.",
  keywords: ["betting", "prediction market", "prophet", "wager"],
  authors: [{ name: "Prophet" }],
  openGraph: {
    title: "Prophet - Bet on Everything",
    description: "The bet on everything market.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${crimsonText.variable} ${playfairDisplay.variable}`}>
      <body className="font-serif antialiased">
        <div className="min-h-screen relative">
          {/* Background with dithering effect */}
          <div className="fixed inset-0 -z-10">
            <div className="absolute inset-0 bg-background" />
            <div className="absolute inset-0 dither-heavy opacity-50" />
            <div className="absolute inset-0 noise" />
          </div>
          
          <Navigation />
          <main className="relative">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
