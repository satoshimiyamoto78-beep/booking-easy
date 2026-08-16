import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @booking-easy/db and @booking-easy/shared ship raw TS source (no build
  // step of their own), so Next needs to transpile them like first-party
  // app code.
  transpilePackages: ["@booking-easy/db", "@booking-easy/shared"],
};

export default nextConfig;
