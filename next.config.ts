import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Music tracks are content-stable (we never overwrite a file in
        // place — replacements get new filenames). Cache aggressively at
        // both the browser and the Vercel edge.
        source: "/music/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Same logic for any committed quiz images in /public/quiz-images/.
        source: "/quiz-images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
