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
