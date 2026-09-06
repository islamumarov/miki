import type { NextConfig } from "next";

// NEXT_PUBLIC_STORAGE=local → static export for the Android (Capacitor) build.
// pageExtensions: ["tsx"] drops the route.ts API handlers, which static export forbids.
const nextConfig: NextConfig =
  process.env.NEXT_PUBLIC_STORAGE === "local" ? { output: "export", pageExtensions: ["tsx"] } : {};

export default nextConfig;
