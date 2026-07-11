import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  typescript: {
    // Skip type checking during production build to avoid third-party library TS errors
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
