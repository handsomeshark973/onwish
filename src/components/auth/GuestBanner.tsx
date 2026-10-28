"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { Link, usePathname } from "@/i18n/navigation";

// 게스트로 쓰는 중임을 알리는 안내. 닫으면 이 브라우저에서는 다시 띄우지 않는다(localStorage).
const KEY = "ow_guest_banner_dismissed";
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => void listeners.delete(cb);
};
const read = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

export function GuestBanner() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  // 서버에서 그릴 때는 숨김으로 시작해서, 브라우저에서 저장된 선택을 읽은 뒤에만 보여 준다
  const dismissed = useSyncExternalStore(subscribe, read, () => true);
  if (dismissed) return null;
  const close = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // 저장할 수 없으면 이번 화면에서만 닫힌다
    }
    listeners.forEach((l) => l());
  };
  return (
    <div className="ow-guest-banner" role="status">
      <div className="ow-container ow-guest-banner-inner">
        <p>{t("guestBanner")}</p>
        <div className="ow-guest-banner-actions">
          <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="ow-btn ow-btn-secondary ow-btn-sm">{t("login")}</Link>
          <button type="button" className="ow-btn ow-btn-ghost ow-btn-sm" onClick={close} aria-label={t("guestDismiss")}>{t("close")}</button>
        </div>
      </div>
    </div>
  );
}
