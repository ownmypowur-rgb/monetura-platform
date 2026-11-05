/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@monetura/config", "three"],
  experimental: {
    serverComponentsExternalPackages: ["mysql2", "drizzle-orm", "@monetura/db"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // mysql2 uses node: scheme URIs. Same externalization as apps/platform.
      const existingExternals = Array.isArray(config.externals)
        ? config.externals
        : config.externals
          ? [config.externals]
          : [];
      config.externals = [
        ...existingExternals,
        ({ request }, callback) => {
          if (request && request.startsWith("node:")) {
            return callback(null, "commonjs " + request);
          }
          callback();
        },
      ];
    }
    return config;
  },
};

export default nextConfig;
