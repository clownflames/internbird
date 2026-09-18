import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "b9daa5ded24b6b3387e1d01041767b1e.r2.cloudflarestorage.com", // tumhara R2 public URL
      },
      {
        protocol: "https",
        hostname: "logolook.net", // tumhara R2 public URL
      },
      {
        protocol: "https",
        hostname: "pub-33bc541e245348499ae45f9aea4a58ed.r2.dev", // tumhara R2 public URL
      },
      {
        protocol: "https",
        hostname: "media.istockphoto.com", // tumhara R2 public URL
      },

      {
        protocol:"https",
        hostname:"png.pngtree.com"
      }
      // ya agar custom domain hai:
      // { protocol: "https", hostname: "cdn.yourdomain.com" },
    ],
  },
};

export default nextConfig;
