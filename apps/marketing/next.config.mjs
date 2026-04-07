/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@monetura/ui", "@monetura/config", "@monetura/db"],
  experimental: {
    serverComponentsExternalPackages: ["mysql2"],
  },
};
export default nextConfig;
