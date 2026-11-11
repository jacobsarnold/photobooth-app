import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = process.env.NEXT_PUBLIC_PARTY_TITLE?.trim() || "Party Photobooth";

export const metadata: Metadata = {
  title: `${title} · Photobooth`,
  description: "Snap a photo and add it to the party album.",
  appleWebApp: { capable: true, title: "Photobooth", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#140b1f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
