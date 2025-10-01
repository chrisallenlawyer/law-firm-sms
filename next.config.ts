import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@google-cloud/speech'],
  },
  // Increase body size limit for file uploads
  serverActions: {
    bodySizeLimit: '50mb',
  },
};

export default nextConfig;
