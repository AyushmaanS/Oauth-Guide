import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // content/guides is read from disk at runtime, so make sure serverless bundles include it
  outputFileTracingIncludes: { "/api/generate": ["./content/guides/**/*"], "/guide/[slug]": ["./content/guides/**/*"], "/": ["./content/guides/**/*"] },
  /* config options here */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
