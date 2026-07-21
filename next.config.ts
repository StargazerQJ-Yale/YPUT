import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Receipt uploads (images/PDFs) go through a Server Action; the default
    // 1mb limit is too small for scanned receipts.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // @napi-rs/canvas ships a native .node binary (used to render PDF receipts
  // to an image for AI scanning) that webpack can't parse as a JS module —
  // this keeps it (and unpdf, which loads it dynamically) as a real Node
  // require at runtime instead of trying to bundle it.
  serverExternalPackages: ["@napi-rs/canvas", "unpdf"],
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
