import { useTranslations } from "next-intl";
import { NAV_ITEMS } from "@/config/nav";
import { SITE_DOMAIN, SITE_NAME } from "@/config/site";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("nav");
  const f = useTranslations("footer");
  return (
    <footer className="ow-footer">
      <div className="ow-footer-inner">
        <div>
          <p className="ow-footer-name">{SITE_NAME}</p>
          <p className="ow-footer-sub">{SITE_DOMAIN.toUpperCase()}</p>
        </div>
        <ul className="ow-footer-links">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>{t(item.key)}</Link>
            </li>
          ))}
        </ul>
        <ul className="ow-footer-links">
          <li><Link href="/privacy">{f("privacy")}</Link></li>
          <li><Link href="/terms">{f("terms")}</Link></li>
        </ul>
        <p className="ow-footer-note">{f("note")}</p>
      </div>
    </footer>
  );
}
