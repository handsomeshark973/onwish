"use client";

import { useLocale, useTranslations } from "next-intl";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { StageBadge } from "@/components/ui/Badge";
import { Link } from "@/i18n/navigation";
import type { VideoKind } from "@/types/domain";
import type { HeatStage } from "@/types/taxonomy";

export type VideoItem = {
  id: string; // 우리 DB의 영상 id(한 화면에서 재생 중인 것을 구분하는 키)
  youtubeId: string;
  title: string;
  gameName: string;
  gameHref: string; // 게임 상세 /radar/[slug]
  kind: VideoKind;
  stage: HeatStage | null;
  dateLabel: string | null; // "출시 예정 2026-11-07 · D-12" 같은 한 줄. 서버가 현재 언어로 만들어 넘긴다
  channelName: string;
  sourceUrl: string;
};

// 한 번에 영상 하나만 재생한다. 다른 영상을 누르면 앞 영상의 iframe은 닫히고 썸네일로 돌아간다.
const PlaybackContext = createContext<{ active: string | null; play: (id: string) => void }>({ active: null, play: () => {} });

export function VideoProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<string | null>(null);
  const play = useCallback((id: string) => setActive(id), []);
  return <PlaybackContext.Provider value={{ active, play }}>{children}</PlaybackContext.Provider>;
}

// 파사드: 클릭하기 전에는 iframe도 유튜브 스크립트도 불러오지 않고 썸네일만 보여 준다.
function VideoPlayer({ item, large }: { item: VideoItem; large?: boolean }) {
  const t = useTranslations("video");
  const locale = useLocale();
  const { active, play } = useContext(PlaybackContext);
  const playing = active === item.id;
  const [thumb, setThumb] = useState<"max" | "hq" | "failed">(large ? "max" : "hq");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const kind = t(`kind.${item.kind}`);

  // 눌러서 iframe으로 바뀌면 키보드 포커스도 영상으로 옮긴다
  useEffect(() => {
    if (playing) iframeRef.current?.focus();
  }, [playing]);

  const watchLink = (
    <a className="ow-video-fallback-link" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
      {t("watchOnYoutube")}
    </a>
  );

  if (playing) {
    const src = `https://www.youtube-nocookie.com/embed/${item.youtubeId}?autoplay=1&rel=0&playsinline=1&hl=${locale}&cc_lang_pref=${locale}`;
    return (
      <div className="ow-video-frame">
        <iframe
          ref={iframeRef}
          src={src}
          title={item.title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  if (thumb === "failed") {
    return (
      <div className="ow-video-frame ow-video-placeholder">
        <span aria-hidden="true">{item.gameName.slice(0, 1)}</span>
        <span className="ow-meta">{t("thumbFailed")}</span>
        {watchLink}
      </div>
    );
  }

  const base = `https://i.ytimg.com/vi/${item.youtubeId}`;
  return (
    <div className="ow-video-frame">
      <button type="button" className="ow-video-play" aria-label={t("play", { name: item.gameName, kind })} onClick={() => play(item.id)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${base}/${thumb === "max" ? "maxresdefault" : "hqdefault"}.jpg`}
          alt={t("thumbAlt", { title: item.title })}
          loading={large ? "eager" : "lazy"}
          decoding="async"
          // 썸네일이 없는 영상은 오류 대신 작은 회색 그림(너비 120)이 오므로, 너무 작으면 다음 크기로 바꾸고 마지막엔 자리 표시자를 보인다
          onLoad={(e) => {
            if (e.currentTarget.naturalWidth <= 120) setThumb(thumb === "max" ? "hq" : "failed");
          }}
          onError={() => setThumb(thumb === "max" ? "hq" : "failed")}
        />
        <span className="ow-video-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="24" height="24"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
        </span>
      </button>
    </div>
  );
}

function VideoInfo({ item, headingLevel }: { item: VideoItem; headingLevel: 2 | 3 }) {
  const t = useTranslations("video");
  const Heading = `h${headingLevel}` as "h2" | "h3";
  return (
    <>
      <div className="ow-card-badges">
        <span className="ow-badge ow-badge-plain">{t(`kind.${item.kind}`)}</span>
        <StageBadge stage={item.stage} />
      </div>
      <Heading className="ow-card-title">
        <Link href={item.gameHref}>{item.gameName}</Link>
      </Heading>
      {item.dateLabel && <p className="ow-meta">{item.dateLabel}</p>}
      <p className="ow-meta">
        {t("source", { channel: item.channelName })} ·{" "}
        <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
          {t("original")}
          <span className="ow-visually-hidden"> — {item.title}</span>
        </a>
      </p>
      <div className="ow-card-actions ow-actions-flush">
        <Link href={item.gameHref} className="ow-btn ow-btn-secondary ow-btn-sm">
          {t("contentsLink")}
          <span className="ow-visually-hidden"> — {item.gameName}</span>
        </Link>
      </div>
    </>
  );
}

export function VideoCard({ item }: { item: VideoItem }) {
  return (
    <article className="ow-card ow-video-card">
      <VideoPlayer item={item} />
      <VideoInfo item={item} headingLevel={3} />
    </article>
  );
}

// 홈 첫 화면 오른쪽의 대표 영상 카드. 클릭하기 전에는 썸네일만 보이고(iframe 없음), 누르면 그 자리에서 재생된다.
export function HeroFeature({ item }: { item: VideoItem }) {
  const t = useTranslations("video");
  return (
    <article className="ow-hero-feature" aria-label={t("featured")}>
      <VideoPlayer item={item} large />
      <div className="ow-hero-feature-info">
        <p className="ow-eyebrow">{t("featured")}</p>
        <VideoInfo item={item} headingLevel={2} />
      </div>
    </article>
  );
}

// 가로 스크롤 줄: 모바일은 스와이프·스크롤 스냅, 데스크톱은 좌우 이동 버튼
export function VideoRail({ label, items }: { label: string; items: VideoItem[] }) {
  const t = useTranslations("video");
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft <= 1, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 });
  }, []);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, items.length]);

  const move = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className="ow-video-rail" role="group" aria-label={label}>
      <button type="button" className="ow-icon-btn ow-rail-btn ow-rail-prev" aria-label={t("prev")} disabled={edge.start} onClick={() => move(-1)}>
        <span aria-hidden="true">←</span>
      </button>
      <div ref={ref} className="ow-scroll-row ow-video-row" onScroll={measure}>
        {items.map((it) => (
          <VideoCard key={it.id} item={it} />
        ))}
      </div>
      <button type="button" className="ow-icon-btn ow-rail-btn ow-rail-next" aria-label={t("next")} disabled={edge.end} onClick={() => move(1)}>
        <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}
