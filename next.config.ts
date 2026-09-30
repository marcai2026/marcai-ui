import type { NextConfig } from "next";

const apiOrigin = process.env.API_URL ?? "http://localhost:3333";

const nextConfig: NextConfig = {
  devIndicators: false,
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
