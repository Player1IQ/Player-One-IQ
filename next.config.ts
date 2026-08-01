import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/coach", destination: "/portal/coach", permanent: false },
      {
        source: "/deliverables",
        destination: "/portal/deliverables",
        permanent: false,
      },
      { source: "/growth", destination: "/portal/growth", permanent: false },
      { source: "/seasons", destination: "/portal/seasons", permanent: false },
      { source: "/account", destination: "/portal/account", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  // OneDrive can block native file watchers; polling keeps dev server responsive.
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
