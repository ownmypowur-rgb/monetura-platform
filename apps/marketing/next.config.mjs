/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@monetura/ui", "@monetura/config", "@monetura/db"],
  experimental: {
    serverComponentsExternalPackages: ["mysql2"],
  },
  // /founders moved to /membership. Keep old links, emails and bookmarks
  // working. Query strings (e.g. ?tier=) are carried over automatically.
  async redirects() {
    return [
      { source: "/founders", destination: "/membership", permanent: true },
      {
        source: "/founders/:path*",
        destination: "/membership/:path*",
        permanent: true,
      },
    ];
  },
};
export default nextConfig;
