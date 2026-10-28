import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RecommendForm } from "@/components/recommend/RecommendForm";
import { aiEnabled } from "@/config/ai";
import { routing } from "@/i18n/routing";
import { getUser } from "@/lib/auth";
import { getGames } from "@/lib/data/games";
import { fromRow } from "@/lib/profile-db";
import { getQuotaFor } from "@/lib/quota";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: PageProps<"/[locale]/recommend">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "recommend" });
  return { title: t("title") };
}

async function Recommend({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "recommend" });
  const user = await getUser();
  // 세션이 없는 방문자도 폼을 바로 쓴다. 게스트 세션은 추천을 받는 순간 서버 동작이 만든다(페이지를 열기만 해서는 만들지 않는다).
  if (!user) {
    const games = await getGames(locale);
    return <RecommendForm games={games.map((g) => ({ id: g.id, name: g.name }))} initial={null} quota={null} aiOn={aiEnabled()} />;
  }
  const supabase = await createClient();
  const [games, row, quota] = await Promise.all([
    getGames(locale),
    supabase.from("streamer_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    aiEnabled() ? getQuotaFor(user.id) : Promise.resolve(null),
  ]);
  return <RecommendForm games={games.map((g) => ({ id: g.id, name: g.name }))} initial={row.data ? fromRow(row.data) : null} quota={quota} aiOn={aiEnabled()} />;
}

export default async function RecommendPage({ params }: PageProps<"/[locale]/recommend">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "recommend" });
  return (
    <>
      <h1 className="ow-h1">{t("title")}</h1>
      <p className="ow-lead ow-lead-block">{t("lead")}</p>
      <Suspense fallback={<p className="ow-meta">…</p>}>
        <Recommend locale={locale} />
      </Suspense>
    </>
  );
}
