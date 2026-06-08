import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
