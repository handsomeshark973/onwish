import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AuthSlot } from "@/components/auth/AuthSlot";
import { GuestNotice } from "@/components/auth/GuestNotice";
import { LoginButton } from "@/components/auth/LoginButton";
import { HeaderFallback } from "@/components/layout/HeaderFallback";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SITE_NAME, SITE_URL } from "@/config/site";
import { routing } from "@/i18n/routing";
import { themeInitScript } from "@/styles/theme-script";
import "@/styles/tokens.css";
import "../globals.css";
import "@/components/components.css";

// 클라이언트 컴포넌트(src/components, src/i18n/labels)가 useTranslations로 쓰는 묶음. 새 묶음을 클라이언트에서 쓰면 여기에 추가한다.
const CLIENT_NAMESPACES = ["auth", "common", "contentCard", "filter", "footer", "format", "game", "gameDetail", "gameImage", "library", "nav", "radar", "reco", "recoErrors", "recommend", "report", "states", "taxonomy", "theme", "video"];

// 글꼴: Paperlogy(OFL). 파일은 src/fonts/paperlogy, 라이선스 안내는 같은 폴더의 LICENSE-NOTE.txt
const paperlogy = localFont({
  variable: "--font-paperlogy",
  display: "swap",
  src: [
    { path: "../../fonts/paperlogy/Paperlogy-4Regular.woff2", weight: "400" },
    { path: "../../fonts/paperlogy/Paperlogy-5Medium.woff2", weight: "500" },
    { path: "../../fonts/paperlogy/Paperlogy-6SemiBold.woff2", weight: "600" },
    { path: "../../fonts/paperlogy/Paperlogy-7Bold.woff2", weight: "700" },
    { path: "../../fonts/paperlogy/Paperlogy-8ExtraBold.woff2", weight: "800" },
  ],
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
  // 브라우저에서 쓰는 번역 묶음만 보낸다(개인정보 처리방침·약관·관리자 등 서버에서만 쓰는 것은 제외)
  const all = (await getMessages({ locale })) as Record<string, unknown>;
  const clientMessages = Object.fromEntries(CLIENT_NAMESPACES.filter((k) => k in all).map((k) => [k, all[k]]));

  return (
    <html lang={locale} className={paperlogy.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <NextIntlClientProvider messages={clientMessages}>
          <a href="#main" className="ow-skip">
            {t("skip")}
          </a>
          {/* 헤더는 현재 주소를 읽어서 Suspense로 감싼다. 준비되는 동안에는 같은 모양의 임시 헤더를 보여 줘서
              메뉴·언어 전환·로그인 버튼이 사라지지 않는다. 계정 구역도 확인이 끝나기 전에는 로그인 버튼을 기본으로 보여 준다. */}
          <Suspense fallback={<HeaderFallback />}>
            <Header
              account={
                <Suspense fallback={<LoginButton />}>
                  <AuthSlot />
                </Suspense>
              }
            />
          </Suspense>
          <Suspense fallback={null}>
            <GuestNotice />
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
