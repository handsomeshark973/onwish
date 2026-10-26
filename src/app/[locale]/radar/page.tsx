import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RadarBrowser } from "@/components/radar/RadarBrowser";
import { routing } from "@/i18n/routing";
import { getGames } from "@/lib/data/games";

export async function generateMetadata({ params }: PageProps<"/[locale]/radar">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "radar" });
  return { title: t("title") };
}

async function Radar({ locale }: { locale: string }) {
  return <RadarBrowser games={await getGames(locale)} />;
}

export default async function RadarPage({ params }: PageProps<"/[locale]/radar">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "radar" });
  return (
    <>
      <h1 className="ow-h1">{t("title")}</h1>
      <p className="ow-lead ow-lead-block">{t("lead")}</p>
      <Suspense fallback={<p className="ow-meta">…</p>}>
        <Radar locale={locale} />
      </Suspense>
    </>
  );
}
