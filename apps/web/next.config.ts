import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile Dynamic SDK packages for compatibility
  transpilePackages: [
    "@dynamic-labs/sdk-react-core",
    "@dynamic-labs/ethereum",
  ],
  // Empty turbopack config to acknowledge we're using turbopack
  turbopack: {},
  // Silence server external packages warnings
  serverExternalPackages: ["pino", "pino-pretty", "thread-stream"],
  // Expose env vars to browser (without NEXT_PUBLIC_ prefix)
  env: {
    DYNAMIC_ENVIRONMENT_ID: process.env.DYNAMIC_ENVIRONMENT_ID,
  },
};

export default nextConfig;
