import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App autenticada y dinámica: no prerenderizar con cache components
  cacheComponents: false,
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
