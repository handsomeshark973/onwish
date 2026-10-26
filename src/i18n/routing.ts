import { defineRouting } from "next-intl/routing";

// 한국어가 기본 언어. 주소에 항상 언어가 붙는다: /ko/..., /en/...
export const routing = defineRouting({
  locales: ["ko", "en"],
  defaultLocale: "ko",
  localePrefix: "always",
  // 고른 언어를 쿠키(NEXT_LOCALE)에 1년 저장한다. 첫 방문에는 브라우저 언어(Accept-Language)를 참고한다.
  localeCookie: { maxAge: 60 * 60 * 24 * 365, sameSite: "lax" },
});

export type Locale = (typeof routing.locales)[number];
export const isLocale = (v: string): v is Locale => (routing.locales as readonly string[]).includes(v);
