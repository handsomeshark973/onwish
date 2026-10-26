import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LibraryBrowser } from "@/components/library/LibraryBrowser";
import { getContents } from "@/lib/data/contents";
import { routing } from "@/i18n/routing";

export async function generateMetadata({ params }: PageProps<"/[locale]/library">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "library" });
  return { title: t("title") };
}

async function Library({ locale }: { locale: string }) {
  return <LibraryBrowser contents={await getContents(locale)} />;
}

export default async function LibraryPage({ params }: PageProps<"/[locale]/library">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "library" });
  return (
    <>
      <h1 className="ow-h1">{t("title")}</h1>
      <p className="ow-lead" style={{ marginBottom: "var(--space-5)" }}>{t("lead")}</p>
      <Suspense fallback={<p className="ow-meta">…</p>}>
        <Library locale={locale} />
      </Suspense>
    </>
  );
}
