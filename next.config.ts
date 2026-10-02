import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict Mode mounts effects twice in development, and Leaflet's map
  // can't be torn down and rebuilt on the same element that fast.
  reactStrictMode: false,
};

export default nextConfig;
