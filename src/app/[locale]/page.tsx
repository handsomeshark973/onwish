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
import { getHomeVideos } from "@/lib/data/videos";
import type { HomeVideo } from "@/lib/home-videos";
import { FeaturedVideo, VideoProvider, VideoRail, type VideoItem } from "@/components/video/Video";
import { Link } from "@/i18n/navigation";
import { getLabels } from "@/i18n/labels";
import { routing } from "@/i18n/routing";
import { isTrendStage, type PlayerTier } from "@/types/taxonomy";

// 영상 카드에 쓸 값. 날짜 줄은 현재 언어로 여기서 만들어 넘긴다(D-day는 곧 출시 영상에만).
async function toItem({ video, game, daysToRelease: n }: HomeVideo, locale: string): Promise<VideoItem> {
  const t = await getTranslations({ locale, namespace: "video" });
  let dateLabel: string | null = null;
  if (game.heatStage === "upcoming") {
    const date = game.nextKeyDate?.date;
    if (!date || n === null) dateLabel = t("releaseTbd");
    else dateLabel = `${date}${n === 0 ? ` · ${t("today")}` : n > 0 ? ` · ${t("dday", { n })}` : ""}`; // 예: 2026-11-19 · 출시 D-23 (한국 날짜 기준)
  } else if (game.releaseBasisDate) {
    dateLabel = t("released", { date: game.releaseBasisDate });
  }
  return {
    id: video.id, youtubeId: video.youtubeId, title: video.title, gameName: game.name, gameHref: `/radar/${game.slug}`,
    kind: video.kind, stage: game.heatStage, dateLabel, channelName: video.channelName, sourceUrl: video.sourceUrl,
  };
}

// 첫 화면 바로 아래 영상 구역: 대표 영상 1개 + 가로 스크롤 두 줄. 영상이 없는 묶음은 통째로 숨긴다(빈 상태를 홈에 보이지 않는다).
async function VideoShowcase({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "video" });
  const { featured, upcoming, recent } = await getHomeVideos(locale);
  if (!featured && upcoming.length === 0 && recent.length === 0) return null;
  const [f, up, rc] = await Promise.all([
    featured ? toItem(featured, locale) : null,
    Promise.all(upcoming.map((v) => toItem(v, locale))),
    Promise.all(recent.map((v) => toItem(v, locale))),
  ]);
  return (
    <VideoProvider>
      {f && (
        <section className="ow-section">
          <FeaturedVideo item={f} />
        </section>
      )}
      {rc.length > 0 && (
        <section className="ow-section">
          <SectionHead title={t("recent")} href="/radar" />
          <VideoRail label={t("recent")} items={rc} />
        </section>
      )}
      {up.length > 0 && (
        <section className="ow-section">
          <SectionHead title={t("upcoming")} href="/radar" />
          <VideoRail label={t("upcoming")} items={up} />
        </section>
      )}
    </VideoProvider>
  );
}

// 사이트 소개: 누구를 위한 곳인지 → 어떤 고민이 있는지 → ONWISH가 어떻게 돕는지. 해결 항목은 강조 색과 굵은 제목, 위쪽 굵은 선으로 구분한다(색만 쓰지 않는다).
async function About({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.about" });
  const items = ["who", "problem", "solution"] as const;
  return (
    <section id="about" className="ow-section ow-anchor" aria-labelledby="about-title">
      <h2 id="about-title" className="ow-h2 ow-h2-flush">{t("title")}</h2>
      <div className="ow-about">
        {items.map((k) => (
          <div key={k} className={k === "solution" ? "ow-about-item ow-about-solution" : "ow-about-item"}>
            <h3 className="ow-about-label">{t(`${k}.label`)}</h3>
            <p className="ow-about-body">{t(`${k}.body`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// 핵심 기능 3가지. 카드 전체를 링크로 만들지 않고 버튼만 링크로 둔다(스크린 리더가 설명 전체를 링크 이름으로 읽지 않게).
async function Features({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.features" });
  const items = [
    { key: "recommend", href: "/recommend" },
    { key: "radar", href: "/radar" },
    { key: "library", href: "/library" },
  ] as const;
  return (
    <section id="features" className="ow-section ow-anchor" aria-labelledby="features-title">
      <h2 id="features-title" className="ow-h2 ow-h2-flush">{t("title")}</h2>
      <ol className="ow-features">
        {items.map((it, i) => (
          <li key={it.key}>
            <article className="ow-card ow-feature-card" aria-labelledby={`feature-${it.key}`}>
              <span className="ow-feature-no" aria-hidden="true">{i + 1}</span>
              <h3 id={`feature-${it.key}`} className="ow-card-title">{t(`${it.key}.title`)}</h3>
              <p className="ow-card-text ow-feature-body">{t(`${it.key}.body`)}</p>
              <div className="ow-feature-action">
                <ButtonLink href={it.href} variant="secondary">{t(`${it.key}.cta`)}</ButtonLink>
              </div>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}

async function TrendingGames({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home" });
  const games = (await getGames(locale)).filter((g) => isTrendStage(g.heatStage));
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
    .filter((g) => g.heatStage === "upcoming" && !g.staleUpcoming)
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
  const labels = await getLabels(locale);
  const loading = <p className="ow-meta">…</p>;

  return (
    <>
      <section className="ow-hero">
        <p className="ow-eyebrow">{SITE_NAME}</p>
        <h1 className="ow-display">{t("hero.title")}</h1>
        <p className="ow-lead">{t("lead")}</p>
        <div className="ow-hero-actions">
          <ButtonLink href="/recommend">{t("cta")}</ButtonLink>
        </div>
      </section>

      <About locale={locale} />

      <Features locale={locale} />

      <Suspense fallback={null}>
        <VideoShowcase locale={locale} />
      </Suspense>

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
