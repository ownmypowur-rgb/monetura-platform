/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@monetura/ui", "@monetura/config"],
  experimental: {
    serverComponentsExternalPackages: ["mysql2", "drizzle-orm", "@monetura/db"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // mysql2 uses node: scheme URIs (e.g. node:diagnostics_channel).
      // Webpack doesn't handle node: by default — treat them as commonjs externals.
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
