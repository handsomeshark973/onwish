import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { LegalDoc } from "@/components/legal/LegalDoc";

import { routing } from "@/i18n/routing";

export async function generateMetadata({ params }: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  return { title: t("title") };
}

// 실제로 동작하는 기능을 기준으로 쓴 안내문이다. 기능이 바뀌면 messages의 privacy도 같이 고친다.
export default async function PrivacyPage({ params }: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "privacy" });
  return <LegalDoc title={t("title")} effective={t("effective")} lead={t("lead")} sections={t.raw("sections")} />;
}
