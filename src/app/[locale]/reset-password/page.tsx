import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ResetForm } from "@/components/auth/AuthForms";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { routing } from "@/i18n/routing";
import { getUser } from "@/lib/auth";
import { RECOVERY_COOKIE } from "@/lib/auth-constants";

export async function generateMetadata({ params }: PageProps<"/[locale]/reset-password">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.reset" });
  return { title: t("title"), robots: { index: false } };
}

// 재설정 링크(1회용, 1시간)를 확인한 사람만 이 화면을 쓸 수 있다. 확인은 /auth/confirm 또는 /auth/callback이 하고 쿠키로 표시한다.
async function Reset({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "auth.reset" });
  const ok = (await getUser()) && (await cookies()).get(RECOVERY_COOKIE)?.value === "1";
  if (!ok) {
    return <EmptyState title={t("invalidTitle")} hint={t("invalidHint")} action={<ButtonLink href="/forgot-password" variant="secondary">{t("again")}</ButtonLink>} />;
  }
  return <ResetForm />;
}

export default async function ResetPasswordPage({ params }: PageProps<"/[locale]/reset-password">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "auth.reset" });
  return (
    <div className="ow-auth">
      <h1 className="ow-h1">{t("title")}</h1>
      <p className="ow-lead" style={{ marginBottom: "var(--space-5)" }}>{t("lead")}</p>
      <Suspense fallback={<p className="ow-meta">…</p>}>
        <Reset locale={locale} />
      </Suspense>
    </div>
  );
}
