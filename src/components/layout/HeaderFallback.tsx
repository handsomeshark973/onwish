import { useLocale, useTranslations } from "next-intl";
import { LoginButton } from "@/components/auth/LoginButton";
import { NAV_ITEMS } from "@/config/nav";
import { SITE_NAME } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

// 헤더가 준비되는 동안(현재 주소를 읽는 중) 보여 주는 같은 모양의 임시 헤더.
// 로고·메뉴·언어 전환·로그인 버튼의 자리를 그대로 유지해서, 준비되는 순간 화면이 튀거나 버튼이 사라져 보이지 않게 한다.
// 지금 페이지가 어디인지 모르므로 메뉴 강조는 없고, 언어 버튼은 눌러도 반응하지 않는다(곧 진짜 헤더로 바뀐다).
export function HeaderFallback() {
  const t = useTranslations("nav");
  const locale = useLocale();
  return (
    <header className="ow-header">
      <div className="ow-header-inner">
        <Link href="/" className="ow-logo">{SITE_NAME}</Link>
        <span className="ow-menu-btn" aria-hidden="true">{t("menu")}</span>
        <div className="ow-panel">
          <nav className="ow-nav" aria-label={t("main")}>
            <ul>
              {NAV_ITEMS.map((item) => (
                <li key={item.href}><Link href={item.href}>{t(item.key)}</Link></li>
              ))}
            </ul>
          </nav>
          <div className="ow-util">
            <section className="ow-util-block" aria-label={t("language")}>
              <div className="ow-lang">
                {routing.locales.map((l, i) => (
                  <span key={l} className="ow-lang-item">
                    {i > 0 && <span className="ow-lang-sep" aria-hidden="true">|</span>}
                    <span className="ow-lang-btn" aria-hidden="true" data-current={l === locale}>{l.toUpperCase()}</span>
                  </span>
                ))}
              </div>
            </section>
            <section className="ow-util-block ow-util-theme" aria-label={t("theme")}>
              <span className="ow-icon-btn" aria-hidden="true" />
            </section>
            <section className="ow-util-block ow-account" aria-label={t("account")}>
              <LoginButton />
            </section>
          </div>
        </div>
      </div>
    </header>
  );
}
