import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AppFrame from "./components/AppFrame";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "RevenueOS — Sales→PreSales Seam",
  description:
    "The control surface for the Sales→PreSales handoff: an agent drafts an editable POC plan from a reusable template library, a person decides, and the seam watches its own SLA.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body><AppFrame>{children}</AppFrame></body>
    </html>
  );
}
