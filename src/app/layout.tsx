import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { enforceAuthenticatedRouteAccess } from "@/lib/auth/route-guard";
import {
  BRAND_FAVICON_PATH,
  BRAND_FAVICON_VERSION,
  BRAND_MANIFEST_PATH,
  BRAND_NAME,
} from "@/lib/branding";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const siteDescription =
  "Creator and sponsor management platform for gaming agencies and creator organizations";

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
  icons: {
    icon: [
      {
        url: `/favicon-32x32.png?v=${BRAND_FAVICON_VERSION}`,
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: `/favicon-48x48.png?v=${BRAND_FAVICON_VERSION}`,
        sizes: "48x48",
        type: "image/png",
      },
      {
        url: `/favicon-16x16.png?v=${BRAND_FAVICON_VERSION}`,
        sizes: "16x16",
        type: "image/png",
      },
      { url: BRAND_FAVICON_PATH, sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [
      {
        rel: "icon",
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        rel: "icon",
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  manifest: BRAND_MANIFEST_PATH,
  applicationName: BRAND_NAME,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await enforceAuthenticatedRouteAccess();

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
