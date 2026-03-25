import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita que Vercel redirija con 307 cuando Flow llama al webhook sin/con trailing slash
  trailingSlash: false,
  async redirects() {
    return [];
  },
};

export default nextConfig;
