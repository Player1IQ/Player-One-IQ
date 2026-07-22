import type { MetadataRoute } from "next";

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "https://player-one-iq.vercel.app"
  );
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/signup", "/terms", "/privacy"],
      disallow: [
        "/api/",
        "/settings",
        "/messages",
        "/creators",
        "/sponsors",
        "/contracts",
        "/campaigns",
        "/opportunities",
        "/team",
        "/billing",
        "/reports",
        "/ai",
        "/invite/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
