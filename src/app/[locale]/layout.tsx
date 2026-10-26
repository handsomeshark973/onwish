import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Noto_Sans_KR } from "next/font/google";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AuthSlot } from "@/components/auth/AuthSlot";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SITE_NAME, SITE_URL } from "@/config/site";
import { routing } from "@/i18n/routing";
import "../globals.css";
import "@/components/components.css";

const noto = Noto_Sans_KR({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// 페이지 제목·설명도 언어별로 바뀐다. 다른 언어 주소는 검색엔진이 알 수 있게 alternates로 알린다.
export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${SITE_NAME} · ${t("tagline")}`, template: t("titleTemplate") },
    description: t("description"),
    alternates: { languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])) },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "nav" });

  return (
    <html lang={locale} className={noto.variable}>
      <body>
        <NextIntlClientProvider>
          <a href="#main" className="ow-skip">
            {t("skip")}
          </a>
          {/* 현재 주소를 읽는 헤더라서 Suspense로 감싼다. 불러오는 동안에는 로고만 있는 빈 헤더를 보여 준다 */}
          <Suspense
            fallback={
              <header className="ow-header">
                <div className="ow-header-inner">
                  <span className="ow-logo">{SITE_NAME}</span>
                </div>
              </header>
            }
          >
            <Header
              account={
                <Suspense fallback={null}>
                  <AuthSlot />
                </Suspense>
              }
            />
          </Suspense>
          <main id="main" className="ow-main">
            <div className="ow-container">{children}</div>
          </main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
