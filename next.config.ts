import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "Ask the seam" reads a short allow-list of project docs at runtime, so they
  // have to travel with the serverless function.
  outputFileTracingIncludes: {
    "/api/ask": ["./README.md", "./PLAN.md", "./PRODUCT.md", "./docs/**"],
  },
};

export default nextConfig;
