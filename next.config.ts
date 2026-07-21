import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Receipt uploads (images/PDFs) go through a Server Action; the default
    // 1mb limit is too small for scanned receipts.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },
    ],
  },
};

export default nextConfig;
