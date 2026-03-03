import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "kmbbzdfsqxvstqduqqvn.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
};

export default nextConfig;
