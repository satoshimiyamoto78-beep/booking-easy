import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @booking-easy/db ships raw TS source (no build step of its own), so
  // Next needs to transpile it like it would first-party app code.
  transpilePackages: ["@booking-easy/db"],
};

export default nextConfig;
