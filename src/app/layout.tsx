import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const siteDescription =
  "Creator and sponsor management dashboard for gaming agencies";

export const metadata: Metadata = {
  title: {
    default: "Player One IQ",
    template: "%s | Player One IQ",
  },
  description: siteDescription,
  metadataBase: process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL)
    : undefined,
  openGraph: {
    type: "website",
    siteName: "Player One IQ",
    title: "Player One IQ",
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: "Player One IQ",
    description: siteDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
