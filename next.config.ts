import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // [lang] 라우트 제거 후 구 URL → 신 URL 301 리디렉트
      { source: "/ko/danso/:path*", destination: "/danso/:path*", permanent: true },
      { source: "/en/danso/:path*", destination: "/danso/:path*", permanent: true },
      { source: "/ko",             destination: "/danso",         permanent: true },
      { source: "/en",             destination: "/danso",         permanent: true },
    ];
  },
};

export default nextConfig;
