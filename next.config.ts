import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Single-city MVP: skip the redundant city-select homepage, land on the map.
  // Temporary (307) so the multi-city homepage can return in Phase 2.
  async redirects() {
    return [{ source: "/", destination: "/berlin", permanent: false }];
  },
};

export default nextConfig;
