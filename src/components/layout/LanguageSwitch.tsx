"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

const SHORT: Record<Locale, string> = { ko: "KO", en: "EN" };

// 언어 전환: 지구본 + KO | EN. 누르면 지금 보던 페이지(주소의 쿼리·해시 포함)에 그대로 머물며 언어만 바뀐다.
// 고른 언어는 미들웨어가 NEXT_LOCALE 쿠키에 저장해 다음 방문에도 유지된다.
export function LanguageSwitch() {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [pending, start] = useTransition();

  // 반대 언어의 지금 페이지를 미리 받아 두면 눌렀을 때 바로 바뀐다
  useEffect(() => {
    for (const l of routing.locales) if (l !== locale) router.prefetch(`${pathname}${window.location.search}`, { locale: l });
  }, [locale, pathname, router]);

  // 전환하는 동안 이전 화면을 그대로 두고(React 전환), 헤더에는 가벼운 진행 표시만 남긴다
  function go(next: Locale) {
    if (next === locale) return;
    start(() => router.replace(`${pathname}${window.location.search}${window.location.hash}`, { locale: next }));
  }

  return (
    <div className="ow-lang" role="group" aria-label={t("languageSwitch")} aria-busy={pending} data-pending={pending}>
      <svg className="ow-lang-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
      </svg>
      {routing.locales.map((l, i) => (
        <span key={l} className="ow-lang-item">
          {i > 0 && <span className="ow-lang-sep" aria-hidden="true">|</span>}
          <button
            type="button"
            className="ow-lang-btn"
            lang={l}
            aria-label={t(l === "ko" ? "langKo" : "langEn")}
            aria-pressed={l === locale}
            onClick={() => go(l)}
          >
            {SHORT[l]}
          </button>
        </span>
      ))}
    </div>
  );
}
