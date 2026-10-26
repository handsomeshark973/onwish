import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ContentCard } from "@/components/cards/ContentCard";
import { GameCard } from "@/components/cards/GameCard";
import { gameCardProps } from "@/components/cards/cardProps";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHead } from "@/components/ui/SectionHead";
import { EmptyState } from "@/components/ui/States";
import { SITE_NAME } from "@/config/site";
import { getContents } from "@/lib/data/contents";
import { getGames } from "@/lib/data/games";
import { Link } from "@/i18n/navigation";
import { getLabels } from "@/i18n/labels";
import { routing } from "@/i18n/routing";
import type { PlayerTier } from "@/types/taxonomy";

async function TrendingGames({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home" });
  const games = (await getGames(locale)).filter((g) => g.heatStage === "golden" || g.heatStage === "hot");
  if (games.length === 0) {
    return <EmptyState title={t("trendingEmptyTitle")} hint={t("trendingEmptyHint")} action={<ButtonLink href="/library" variant="secondary">{t("toLibrary")}</ButtonLink>} />;
  }
  return (
    <div className="ow-scroll-row">
      {games.map((g) => (
        <GameCard key={g.id} {...gameCardProps(g)} />
      ))}
    </div>
  );
}

async function UpcomingGames({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home" });
  const games = (await getGames(locale))
    .filter((g) => g.heatStage === "upcoming")
    .sort((a, b) => (a.nextKeyDate?.date ?? "9").localeCompare(b.nextKeyDate?.date ?? "9"));
  if (games.length === 0) return <EmptyState title={t("upcomingEmptyTitle")} hint={t("upcomingEmptyHint")} />;
  return (
    <div className="ow-scroll-row">
      {games.map((g) => (
        <GameCard key={g.id} {...gameCardProps(g)} />
      ))}
    </div>
  );
}

async function PickedContents({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home" });
  const contents = await getContents(locale);
  const picked = [...contents].sort((a, b) => Number(b.lifecycle !== "trend") - Number(a.lifecycle !== "trend")).slice(0, 3);
  if (picked.length === 0) return <EmptyState title={t("pickedEmptyTitle")} hint={t("pickedEmptyHint")} />;
  return (
    <div className="ow-grid">
      {picked.map((c) => (
        <ContentCard
          key={c.id}
          href={`/library/${c.slug}`}
          title={c.title}
          appeal={c.mainAppeal}
          appealLine={c.appealText}
          participation={c.viewerParticipation}
          tier={c.playerTier}
          games={c.games.map((g) => g.name).join(", ") || c.gamesText || undefined}
        />
      ))}
    </div>
  );
}

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "home" });
  const meta = await getTranslations({ locale, namespace: "meta" });
  const labels = await getLabels(locale);
  const loading = <p className="ow-meta">…</p>;

  return (
    <>
      <section className="ow-hero">
        <p className="ow-eyebrow">{SITE_NAME}</p>
        <h1 className="ow-display">{meta("tagline")}</h1>
        <p className="ow-lead">{t("lead")}</p>
        <div className="ow-hero-actions">
          <ButtonLink href="/recommend">{t("cta")}</ButtonLink>
          <ButtonLink href="/radar" variant="ghost">{t("toRadar")}</ButtonLink>
        </div>
      </section>

      <section className="ow-section">
        <SectionHead title={t("trending")} href="/radar" />
        <Suspense fallback={loading}>
          <TrendingGames locale={locale} />
        </Suspense>
      </section>

      <section className="ow-section">
        <SectionHead title={t("upcoming")} href="/radar" />
        <Suspense fallback={loading}>
          <UpcomingGames locale={locale} />
        </Suspense>
      </section>

      <section className="ow-section">
        <SectionHead title={t("byPlayers")} />
        <div className="ow-grid ow-grid-tier">
          {(["solo", "small", "large"] as PlayerTier[]).map((tier) => (
            <article key={tier} className="ow-card ow-tier-card">
              <h3 className="ow-tier-title">
                <Link href={`/library?tier=${tier}`} className="ow-card-link">
                  {labels.tier[tier]}
                </Link>
              </h3>
              <p className="ow-card-text">{t(`tierIntro.${tier}`)}</p>
              <span className="ow-tier-arrow" aria-hidden="true">→</span>
            </article>
          ))}
        </div>
      </section>

      <section className="ow-section">
        <SectionHead title={t("picked")} href="/library" />
        <Suspense fallback={loading}>
          <PickedContents locale={locale} />
        </Suspense>
      </section>
    </>
  );
}
