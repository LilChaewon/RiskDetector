import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // API 요청만 백엔드(8080)로 프록시
      // OAuth2 흐름은 직접 localhost:8080으로 이동 (rewrites로 처리하면 JSESSIONID 쿠키가 전달 안 됨)
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*",
      },
    ];
  },
};

export default nextConfig;
