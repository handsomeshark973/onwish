import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";

// 검색 로봇 규칙: 공개 페이지는 열고, 로그인·가입·관리자·내 프로필·인증 처리 주소는 막는다.
export default function robots(): MetadataRoute.Robots {
  const locales = ["ko", "en"];
  const hidden = ["/auth/", "/api/", ...locales.flatMap((l) => ["login", "signup", "forgot-password", "reset-password", "profile", "admin"].map((p) => `/${l}/${p}`))];
  return { rules: [{ userAgent: "*", allow: "/", disallow: hidden }], sitemap: `${SITE_URL}/sitemap.xml` };
}
