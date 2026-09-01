import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { UTMCapture } from "@/components/store/UTMCapture";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Norte",
    template: "%s | Norte",
  },
  description: "Peças exclusivas com entrega para todo o Brasil. Pagamento via PIX.",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-fg">
        <UTMCapture />
        {children}
      </body>
    </html>
  );
}
