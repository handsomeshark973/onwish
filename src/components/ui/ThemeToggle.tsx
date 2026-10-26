"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { applyTheme } from "@/styles/theme-script";

type Theme = "system" | "dark" | "light";
const ORDER: Theme[] = ["system", "dark", "light"];

function read(): Theme {
  const v = document.documentElement.getAttribute("data-theme");
  return v === "dark" || v === "light" ? v : "system";
}

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}

// 수동 선택 > 시스템 설정 > 다크. 저장·적용은 applyTheme이 한다.
export function ThemeToggle() {
  const t = useTranslations("theme");
  const current = useSyncExternalStore(subscribe, read, () => "system" as Theme);

  return (
    <div role="radiogroup" aria-label={t("label")} className="ow-theme">
      {ORDER.map((o) => (
        <button key={o} type="button" role="radio" aria-checked={current === o} className="ow-theme-opt" onClick={() => applyTheme(o)}>
          {t(o)}
        </button>
      ))}
    </div>
  );
}

// 헤더용 작은 버튼: 누를 때마다 시스템 → 다크 → 라이트 순으로 바뀐다. 아이콘은 직접 그린 단순 도형이다.
export function ThemeCycle() {
  const t = useTranslations("theme");
  const current = useSyncExternalStore(subscribe, read, () => "system" as Theme);
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
  return (
    <button type="button" className="ow-icon-btn" aria-label={t("toggle", { current: t(current) })} title={t(current)} onClick={() => applyTheme(next)}>
      <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {current === "dark" && <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />}
        {current === "light" && (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        )}
        {current === "system" && (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" />
          </>
        )}
      </svg>
    </button>
  );
}
