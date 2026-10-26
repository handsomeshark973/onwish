import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // 이 폴더의 .env는 SUPABASE_URL / SUPABASE_ANON_KEY 이름을 쓰므로, 브라우저에서도 읽히게 같은 값을 연결한다.
  // 둘 다 공개되어도 안전한 값이다(접근 제한은 DB의 RLS가 한다). SERVICE_ROLE 키는 절대 여기 넣지 않는다.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },
  // 보안 헤더. 다른 사이트가 이 사이트를 액자(iframe)로 감싸는 것(클릭 가로채기), 파일 형식 추측, 주소 정보 유출을 막고,
  // 운영(https)에서는 앞으로 1년간 https로만 접속하게 한다. (CSP는 Next가 넣는 인라인 스크립트와 부딪혀서 아직 넣지 않았다.)
  async headers() {
    const common = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
      ...(process.env.NODE_ENV === "production" ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
    ];
    return [{ source: "/:path*", headers: common }];
  },
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
};

export default withNextIntl(nextConfig);
