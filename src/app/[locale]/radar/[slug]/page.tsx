import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ContentCard } from "@/components/cards/ContentCard";
import { ReportButton } from "@/components/report/ReportButton";
import { AppealBadge, StageBadge } from "@/components/ui/Badge";
import { MiniChart } from "@/components/ui/MiniChart";
import { getLabels } from "@/i18n/labels";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getGameDetail } from "@/lib/data/games";
import { formatPlayers } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/[locale]/radar/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const g = await getGameDetail(slug, locale);
  const t = await getTranslations({ locale, namespace: "gameDetail" });
  return { title: g ? g.name : t("notFound") };
}

async function Detail({ params }: { params: PageProps<"/[locale]/radar/[slug]">["params"] }) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const g = await getGameDetail(slug, locale);
  if (!g) notFound();
  const t = await getTranslations({ locale, namespace: "gameDetail" });
  const tg = await getTranslations({ locale, namespace: "game" });
  const tf = await getTranslations({ locale, namespace: "format" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const l = await getLabels(locale);
  const name = g.name;
  const release = g.keyDates[0];
  const dateOnly = (iso: string | null) => (iso ? iso.slice(0, 10) : tc("check"));

  return (
    <article className="ow-article" style={{ maxWidth: "none" }}>
      <Link href="/radar" className="ow-backlink">{t("back")}</Link>

      {/* 첫 화면: 대표 이미지. 영상은 쓰지 않는다(자동재생·데이터 부담 없음). 권리를 확인하지 못한 이미지는 비워 둔다 */}
      <div className="ow-hero-media">
        {g.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={g.imageUrl} alt={tg("imageAlt", { name })} />
        ) : (
          <span role="img" aria-label={tg("imagePending", { name })}>{name.slice(0, 1)}</span>
        )}
      </div>
      {g.imageUrl && g.imageSource && <p className="ow-meta">{tg("imageSource", { source: g.imageSource })}</p>}

      <div className="ow-card-badges">
        <StageBadge stage={g.heatStage} />
        {g.infoStale && <span className="ow-stale">{t("stale")}</span>}
      </div>
      <h1 className="ow-h1" style={{ marginTop: "var(--space-3)" }}>{name}</h1>
      <p className="ow-meta">{g.developer}{g.publisher ? ` · ${g.publisher}` : ""}</p>
      {g.streamPoint && <p className="ow-article-lead">{g.streamPoint}</p>}

      <dl className="ow-facts">
        <div className="ow-fact"><dt>{t("factRelease")}</dt><dd>{release ? release.date : tc("check")}</dd></div>
        <div className="ow-fact"><dt>{t("factPlayers")}</dt><dd>{formatPlayers(g.players, tf)}</dd></div>
        <div className="ow-fact"><dt>{t("factPlatform")}</dt><dd>{g.platforms.length ? g.platforms.join(" · ") : tc("check")}</dd></div>
        <div className="ow-fact"><dt>{t("factCrossplay")}</dt><dd>{g.crossplay === null ? tc("check") : g.crossplay ? t("crossplayYes") : t("crossplayNo")}</dd></div>
        <div className="ow-fact"><dt>{t("factPrice")}</dt><dd>{g.priceNote ?? tc("check")}</dd></div>
      </dl>
      {g.cautions && <p className="ow-note">{g.cautions}</p>}

      <h2 className="ow-h2">{t("formats")}</h2>
      {g.formats.length === 0 ? (
        <p className="ow-meta">{t("formatsEmpty")}</p>
      ) : (
        <div className="ow-grid">
          {g.formats.map((f) => (
            <article key={f.id} className="ow-card">
              <div className="ow-card-badges">
                <AppealBadge appeal={f.mainAppeal} />
                <span className="ow-meta">{formatPlayers(f.requiredPlayers, tf)} · {l.participationMode[f.participationMode]}</span>
              </div>
              <h3 className="ow-card-title">{f.title}</h3>
              {f.appealPoints.length > 0 && <p className="ow-meta">{f.appealPoints.map((p) => l.appealPoint[p] ?? p).join(" · ")}</p>}
              <p className="ow-card-text">{f.appealText}</p>
              <p className="ow-meta">{f.howTo}</p>
            </article>
          ))}
        </div>
      )}

      <h2 className="ow-h2">{t("trend")}</h2>
      {g.metricKind && g.metricSeries.length ? (
        <div className="ow-card" style={{ maxWidth: 360 }}>
          {(() => {
            const label = `${t(`metric.${g.metricKind}`)} ${t("metric.last30")}`;
            return (
              <>
                <MiniChart values={g.metricSeries} label={label} width={320} height={80} />
                <p className="ow-meta">{t("trendNote", { label })}</p>
              </>
            );
          })()}
        </div>
      ) : (
        <p className="ow-meta">{t("trendEmpty")}</p>
      )}

      {g.relatedContents.length > 0 && (
        <>
          <h2 className="ow-h2">{t("related")}</h2>
          <div className="ow-grid">
            {g.relatedContents.map((c) => (
              <ContentCard key={c.id} href={`/library/${c.slug}`} title={c.title} appeal={c.mainAppeal} appealLine={c.appealText} participation={c.viewerParticipation} tier={c.playerTier} />
            ))}
          </div>
        </>
      )}

      <h2 className="ow-h2">{t("sources")}</h2>
      {g.sources.length === 0 ? (
        <p className="ow-meta">{t("sourcesEmpty")}</p>
      ) : (
        <ul className="ow-sources">
          {g.sources.map((s, i) => (
            <li key={i}>
              {s.title} · <span className="ow-meta">{t("sourceLine", { url: s.url, date: dateOnly(s.checkedAt) })}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="ow-meta">{t("lastChecked", { date: dateOnly(g.lastCheckedAt) })}</p>
      <div style={{ marginTop: "var(--space-4)" }}>
        <ReportButton targetType="game" targetId={g.id} label={name} loginNext={`/radar/${g.slug}`} />
      </div>
    </article>
  );
}

export default function GamePage(props: PageProps<"/[locale]/radar/[slug]">) {
  return (
    <Suspense fallback={<p className="ow-meta">…</p>}>
      <Detail params={props.params} />
    </Suspense>
  );
}
