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
import { StageBadge } from "@/components/ui/Badge";
import { HeroFeature, VideoProvider, VideoRail, type VideoItem } from "@/components/video/Video";
import { Link } from "@/i18n/navigation";
import { getLabels } from "@/i18n/labels";
import { routing } from "@/i18n/routing";
import { FLOW_STAGES, isTrendStage, type PlayerTier } from "@/types/taxonomy";

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
  const { upcoming, recent } = await getHomeVideos(locale);
  if (upcoming.length === 0 && recent.length === 0) return null;
  const [up, rc] = await Promise.all([
    Promise.all(upcoming.map((v) => toItem(v, locale))),
    Promise.all(recent.map((v) => toItem(v, locale))),
  ]);
  return (
    <>
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
    </>
  );
}

// 첫 화면 오른쪽: 지금의 대표 영상. 대표가 없으면 단계 흐름 배지를 놓은 장식 패널로 채운다.
async function HeroMedia({ locale }: { locale: string }) {
  const { featured } = await getHomeVideos(locale);
  if (featured) return <HeroFeature item={await toItem(featured, locale)} />;
  return (
    <div className="ow-hero-art" aria-hidden="true">
      {FLOW_STAGES.map((s, i) => (
        <span key={s} className="ow-flow-step">
          <StageBadge stage={s} tip={false} />
          {i < FLOW_STAGES.length - 1 && <span className="ow-hero-art-sep">›</span>}
        </span>
      ))}
    </div>
  );
}

// 소개 항목 아이콘(직접 그린 단순한 선 아이콘). 장식이라 스크린 리더는 읽지 않는다.
const svgProps = { viewBox: "0 0 24 24", width: "1em", height: "1em", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", focusable: "false" } as const;
const ABOUT_ICONS = {
  who: (
    <svg {...svgProps}><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.4" /><path d="M16.5 14.2c2.6.2 4.5 2.4 4.5 5.8" /></svg>
  ),
  problem: (
    <svg {...svgProps}><circle cx="12" cy="12" r="9" /><path d="M9.6 9.4a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.2 1-1.2 1.8" /><path d="M12 16.8h.01" /></svg>
  ),
  solution: (
    <svg {...svgProps}><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /><path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" /></svg>
  ),
} as const;

// 사이트 소개: 누구를 위한 곳인지 → 어떤 고민이 있는지 → ONWISH가 어떻게 돕는지. 세 항목은 같은 모양으로 둔다.
async function About({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.about" });
  const items = ["who", "problem", "solution"] as const;
  return (
    <section id="about" className="ow-section ow-anchor" aria-labelledby="about-title">
      <h2 id="about-title" className="ow-h2 ow-h2-flush">{t("title")}</h2>
      <div className="ow-about">
        {items.map((k) => (
          <div key={k} className="ow-about-item">
            <span className="ow-about-icon" aria-hidden="true">{ABOUT_ICONS[k]}</span>
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
    <VideoProvider>
      <section className="ow-hero">
        <div className="ow-hero-copy">
          <p className="ow-eyebrow ow-eyebrow-pill">{SITE_NAME}</p>
          <h1 className="ow-display">{t.rich("hero.title", { em: (chunks) => <em>{chunks}</em> })}</h1>
          <p className="ow-lead">{t("lead")}</p>
          <div className="ow-hero-actions">
            <ButtonLink href="/recommend" className="ow-btn-hero">{t("cta")}</ButtonLink>
          </div>
        </div>
        <div className="ow-hero-side">
          <Suspense fallback={<div className="ow-hero-art ow-hero-art-skeleton" aria-hidden="true" />}>
            <HeroMedia locale={locale} />
          </Suspense>
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
    </VideoProvider>
  );
}
