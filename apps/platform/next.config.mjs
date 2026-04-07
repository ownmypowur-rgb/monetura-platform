/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@monetura/ui", "@monetura/config"],
  experimental: {
    serverComponentsExternalPackages: ["mysql2", "drizzle-orm"],
  },
};
export default nextConfig;
