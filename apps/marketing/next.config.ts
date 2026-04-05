import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@monetura/ui", "@monetura/config"],
};

export default nextConfig;
