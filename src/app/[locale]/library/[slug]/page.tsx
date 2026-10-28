import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ViewBeacon } from "@/components/ViewBeacon";
import { ReportButton } from "@/components/report/ReportButton";
import { AppealBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { getLabels } from "@/i18n/labels";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getContent } from "@/lib/data/contents";
import { formatPlayers } from "@/lib/format";
import type { AudienceSize } from "@/types/taxonomy";

export async function generateMetadata({ params }: PageProps<"/[locale]/library/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const c = await getContent(slug, locale);
  const t = await getTranslations({ locale, namespace: "content" });
  return { title: c?.title ?? t("notFound") };
}

async function Detail({ params }: { params: PageProps<"/[locale]/library/[slug]">["params"] }) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const c = await getContent(slug, locale);
  if (!c) notFound();
  const t = await getTranslations({ locale, namespace: "content" });
  const tf = await getTranslations({ locale, namespace: "format" });
  const l = await getLabels(locale);

  const steps = c.howTo.split("\n").map((s) => s.trim()).filter(Boolean);
  const sizeEntries = (["s", "m", "l"] as AudienceSize[]).filter((k) => c.participationBySize[k]);

  return (
    <article className="ow-article">
      <Link href={`/library?tier=${c.playerTier}`} className="ow-backlink">{t("back")}</Link>
      <div className="ow-card-badges">
        <AppealBadge appeal={c.mainAppeal} />
        <span className="ow-meta">{l.watch[c.watchMode]}</span>
        <span className="ow-meta">{l.tier[c.playerTier]}</span>
      </div>
      <h1 className="ow-h1 ow-h1-article">{c.title}</h1>
      <p className="ow-article-lead">{c.appealText}</p>
      {c.appealPoints.length > 0 && <p className="ow-meta">{c.appealPoints.map((p) => l.appealPoint[p] ?? p).join(" · ")}</p>}

      <dl className="ow-facts">
        <div className="ow-fact"><dt>{t("factPlayers")}</dt><dd>{formatPlayers(c.requiredPlayers, tf)}</dd></div>
        <div className="ow-fact"><dt>{t("factMode")}</dt><dd>{l.participationMode[c.participationMode]}</dd></div>
        <div className="ow-fact"><dt>{t("factLifecycle")}</dt><dd>{l.lifecycle[c.lifecycle]}</dd></div>
        <div className="ow-fact"><dt>{t("factDevices")}</dt><dd>{c.devices.length ? c.devices.join(" · ") : tf("unknown")}</dd></div>
      </dl>

      <h2>{t("howTo")}</h2>
      <ol>{steps.map((s, i) => <li key={i}>{s}</li>)}</ol>

      {c.multiPovPoint && (<><h2>{t("multiPov")}</h2><p>{c.multiPovPoint}</p></>)}

      <h2>{t("participation")}</h2>
      <p>
        {l.participation[c.viewerParticipation]}
        {c.participationChannels.length > 0 && ` · ${c.participationChannels.map((x) => l.channel[x]).join(", ")}`}
      </p>
      {sizeEntries.length > 0 && (
        <ul>
          {sizeEntries.map((k) => (
            <li key={k}><strong>{l.audience[k]}</strong> — {c.participationBySize[k]}</li>
          ))}
        </ul>
      )}

      {c.continuity && (<><h2>{t("continuity")}</h2><p>{c.continuity}</p></>)}
      {c.modsOrSetup && (<><h2>{t("setup")}</h2><p>{c.modsOrSetup}</p></>)}
      {c.cautions && (<><h2>{t("cautions")}</h2><p>{c.cautions}</p></>)}

      <p className="ow-meta ow-article-source">
        {l.origin[c.origin]}
        {c.structures.length > 0 && ` · ${c.structures.map((s) => l.structure[s]).join(", ")}`}
        {c.borrowedFrom && ` · ${t("referenceFrom", { name: c.borrowedFrom })}`}
      </p>

      {c.games.length > 0 && (
        <>
          <h2>{t("linkedGames")}</h2>
          <ul className="ow-chips ow-link-chips">{c.games.map((g) => (<li key={g.slug}><Link href={`/radar/${g.slug}`} className="ow-chip ow-chip-link">{g.name}</Link></li>))}</ul>
        </>
      )}
      {c.games.length === 0 && c.gamesText && (<><h2>{t("gamesText")}</h2><p>{c.gamesText}</p></>)}

      <div className="ow-article-cta">
        <ButtonLink href="/recommend">{t("recommendThis")}</ButtonLink>
      </div>
      <div className="ow-mt">
        <ViewBeacon kind="content" slug={c.slug} />
        <ReportButton targetType="content" targetId={c.id} label={c.title} loginNext={`/library/${c.slug}`} />
      </div>
    </article>
  );
}

export default function ContentPage(props: PageProps<"/[locale]/library/[slug]">) {
  return (
    <Suspense fallback={<p className="ow-meta">…</p>}>
      <Detail params={props.params} />
    </Suspense>
  );
}
