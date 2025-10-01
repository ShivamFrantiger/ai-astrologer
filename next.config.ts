import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
  eslint: {
    // ✅ This tells Next.js not to fail the build because of ESLint errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
