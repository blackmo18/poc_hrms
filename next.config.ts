import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Disable in dev to avoid Turbopack conflicts
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Next.js 16 specific flag
  turbopack: {}, 
};

export default withSerwist(nextConfig);