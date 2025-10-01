import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@google-cloud/speech'],
  },
  // Increase body size limit for file uploads
  serverActions: {
    bodySizeLimit: '4mb',
  },
};

export default nextConfig;
