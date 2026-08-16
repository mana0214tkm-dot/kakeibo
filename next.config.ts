import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "export",
  reactCompiler: true,
  allowedDevOrigins: ["http://localhost:3000", "http://127.0.0.1:3000"],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  turbopack: {
    root: process.cwd(),
  },
}

export default nextConfig
