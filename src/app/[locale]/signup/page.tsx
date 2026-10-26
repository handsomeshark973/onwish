import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { SignupForm } from "@/components/auth/AuthForms";
import { routing } from "@/i18n/routing";

export async function generateMetadata({ params }: PageProps<"/[locale]/signup">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.signup" });
  return { title: t("title"), robots: { index: false } };
}

export default async function SignupPage({ params }: PageProps<"/[locale]/signup">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "auth.signup" });
  return (
    <div className="ow-auth">
      <h1 className="ow-h1">{t("title")}</h1>
      <p className="ow-lead" style={{ marginBottom: "var(--space-5)" }}>{t("lead")}</p>
      <SignupForm />
    </div>
  );
}
