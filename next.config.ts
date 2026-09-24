import type { NextConfig } from "next";

const isPages = process.env.PAGES_BUILD === "1";

const nextConfig: NextConfig = {
  serverExternalPackages: [],
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: isPages ? "/sim-testing-app" : "",
  },
  ...(isPages
    ? {
        output: "export" as const,
        trailingSlash: true,
        basePath: "/sim-testing-app",
        assetPrefix: "/sim-testing-app",
      }
    : {}),
};

export default nextConfig;
