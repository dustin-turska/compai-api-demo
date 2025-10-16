import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow Google-hosted profile images (e.g., from Google OAuth)
    domains: ["lh3.googleusercontent.com"],
  },
};

export default nextConfig;
