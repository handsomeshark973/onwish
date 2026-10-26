"use client";

import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { NAV_ITEMS } from "@/config/nav";
import { SITE_NAME } from "@/config/site";
import { Link, usePathname } from "@/i18n/navigation";
import { LanguageSwitch } from "./LanguageSwitch";

// 헤더는 세 구역으로 나뉜다: [로고] [페이지 이동 메뉴] ┃ [언어 전환] [계정]
// 넓은 화면에서는 한 줄, 좁은 화면에서는 햄버거 안에 "페이지 / 언어 / 계정" 세 칸이 구분선으로 나뉘어 열린다.
export function Header({ account }: { account: ReactNode }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isCurrent = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const close = () => setOpen(false);

  return (
    <header className="ow-header">
      <div className="ow-header-inner">
        <Link href="/" className="ow-logo" onClick={close}>
          {SITE_NAME}
        </Link>
        <button type="button" className="ow-menu-btn" aria-expanded={open} aria-controls="ow-panel" aria-label={open ? t("close") : t("menu")} onClick={() => setOpen((v) => !v)}>
          {open ? t("close") : t("menu")}
        </button>

        <div id="ow-panel" className="ow-panel" data-open={open}>
          <nav className="ow-nav" aria-label={t("main")}>
            <p className="ow-panel-label">{t("pages")}</p>
            <ul>
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} aria-current={isCurrent(item.href) ? "page" : undefined} onClick={close}>
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ow-util">
            <section className="ow-util-block" aria-label={t("language")}>
              <p className="ow-panel-label">{t("language")}</p>
              <LanguageSwitch />
            </section>
            <section className="ow-util-block ow-account" aria-label={t("account")} onClick={(e) => { if ((e.target as HTMLElement).closest("a")) close(); }}>
              <p className="ow-panel-label">{t("account")}</p>
              {account}
            </section>
          </div>
        </div>
      </div>
    </header>
  );
}
