import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@google-cloud/speech', '@google-cloud/storage'],
};

export default nextConfig;
