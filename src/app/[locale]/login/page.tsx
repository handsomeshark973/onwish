import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect as nextRedirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/AuthForms";
import { routing } from "@/i18n/routing";
import { getUser, safeNext } from "@/lib/auth";

export async function generateMetadata({ params }: PageProps<"/[locale]/login">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.login" });
  return { title: t("title"), robots: { index: false } };
}

async function Login({ locale, searchParams }: { locale: string; searchParams: PageProps<"/[locale]/login">["searchParams"] }) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : null);
  // 이미 로그인한 사람이 /login에 오면 원래 가려던 곳으로 보낸다(게스트는 로그인할 수 있어야 하므로 제외)
  const current = await getUser();
  if (current && current.is_anonymous !== true) nextRedirect(`/${locale}${next === "/" ? "" : next}`);
  const notice = sp.error === "link" ? "link" : sp.reset === "1" ? "reset" : sp.confirmed === "1" ? "confirmed" : undefined;
  return <LoginForm next={next} notice={notice} />;
}

export default async function LoginPage(props: PageProps<"/[locale]/login">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "auth.login" });
  return (
    <div className="ow-auth">
      <h1 className="ow-h1">{t("title")}</h1>
      <p className="ow-lead ow-lead-block">{t("lead")}</p>
      <Suspense fallback={<p className="ow-meta">…</p>}>
        <Login locale={locale} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
