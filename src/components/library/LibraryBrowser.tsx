"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ContentCard } from "@/components/cards/ContentCard";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/Chip";
import { FilterSheet } from "@/components/ui/FilterSheet";
import { EmptyState } from "@/components/ui/States";
import { Tabs } from "@/components/ui/Tabs";
import { useLabels } from "@/i18n/labels";
import type { ContentSummary } from "@/types/domain";
import { DEVICES, TAXONOMY_KEYS, type PlayerTier } from "@/types/taxonomy";

type Filters = Record<string, string[]>;
const EMPTY: Filters = { appeal: [], point: [], structure: [], origin: [], lifecycle: [], participation: [], channel: [], device: [], audience: [] };

function matches(c: ContentSummary, f: Filters): boolean {
  const any = (sel: string[], has: (v: string) => boolean) => sel.length === 0 || sel.some(has);
  return (
    any(f.appeal, (v) => c.mainAppeal === v) &&
    any(f.point, (v) => c.appealPoints.includes(v)) &&
    any(f.structure, (v) => c.structures.includes(v as never)) &&
    any(f.origin, (v) => c.origin === v) &&
    any(f.lifecycle, (v) => c.lifecycle === v) &&
    any(f.participation, (v) => c.viewerParticipation === v) &&
    any(f.channel, (v) => c.participationChannels.includes(v as never)) &&
    any(f.device, (v) => c.devices.includes(v as never)) &&
    any(f.audience, (v) => c.audienceFit.includes(v as never))
  );
}

type Bundle = { key: string; title: string; desc: string; items: ContentSummary[]; sameGame?: boolean };

export function LibraryBrowser({ contents }: { contents: ContentSummary[] }) {
  const t = useTranslations("library");
  const l = useLabels();
  const params = useSearchParams();
  const initial = params.get("tier");
  const [tier, setTier] = useState<PlayerTier>(initial === "solo" || initial === "small" || initial === "large" ? initial : "small");
  const [filters, setFilters] = useState<Filters>(EMPTY);

  const inTier = useMemo(() => contents.filter((c) => c.playerTier === tier), [contents, tier]);
  const filtered = useMemo(() => inTier.filter((c) => matches(c, filters)), [inTier, filters]);
  const activeCount = Object.values(filters).reduce((n, v) => n + v.length, 0);

  // 큐레이션 묶음. 규칙에 맞는 컨텐츠가 있을 때만 보인다.
  const bundles = useMemo<Bundle[]>(() => {
    const list: Bundle[] = [
      { key: "talk", title: t("bundle.talkTitle"), desc: t("bundle.talkDesc"), items: inTier.filter((c) => c.appealPoints.some((p) => ["talk_radio", "chemistry", "verbal_mind_game"].includes(p))) },
      { key: "first", title: t("bundle.firstTitle"), desc: t("bundle.firstDesc"), items: inTier.filter((c) => c.appealPoints.includes("forced_comm")) },
      { key: "visual", title: t("bundle.visualTitle"), desc: t("bundle.visualDesc"), items: inTier.filter((c) => c.mainAppeal === "visual") },
    ];
    // 같은 게임, 다른 진행 방식: 연결 게임 하나에 어필이 다른 컨텐츠가 둘 이상이면 묶는다
    const byGame = new Map<string, { name: string; items: ContentSummary[] }>();
    for (const c of inTier) for (const g of c.games) {
      const e = byGame.get(g.slug) ?? { name: g.name, items: [] };
      e.items.push(c);
      byGame.set(g.slug, e);
    }
    for (const [slug, { name, items }] of byGame) {
      if (items.length >= 2 && new Set(items.map((i) => i.mainAppeal)).size >= 2) {
        list.push({ key: `game-${slug}`, title: t("bundle.sameGameTitle", { game: name }), desc: t("bundle.sameGameDesc"), items, sameGame: true });
      }
    }
    return list.filter((b) => b.items.length > 0);
  }, [inTier, t]);

  const defs: { key: string; label: string; options: { value: string; label: string }[] }[] = [
    { key: "appeal", label: t("fAppeal"), options: TAXONOMY_KEYS.appeal.map((k) => ({ value: k, label: l.appeal[k] })) },
    { key: "point", label: t("fPoint"), options: TAXONOMY_KEYS.appealPoint.map((k) => ({ value: k, label: l.appealPoint[k] })) },
    { key: "structure", label: t("fStructure"), options: TAXONOMY_KEYS.structure.map((k) => ({ value: k, label: l.structure[k] })) },
    { key: "origin", label: t("fOrigin"), options: TAXONOMY_KEYS.origin.map((k) => ({ value: k, label: l.origin[k] })) },
    { key: "lifecycle", label: t("fLifecycle"), options: TAXONOMY_KEYS.lifecycle.map((k) => ({ value: k, label: l.lifecycle[k] })) },
    { key: "participation", label: t("fParticipation"), options: TAXONOMY_KEYS.participation.map((k) => ({ value: k, label: l.participation[k] })) },
    { key: "channel", label: t("fChannel"), options: TAXONOMY_KEYS.channel.map((k) => ({ value: k, label: l.channel[k] })) },
    { key: "device", label: t("fDevice"), options: DEVICES.map((d) => ({ value: d, label: d })) },
    { key: "audience", label: t("fAudience"), options: TAXONOMY_KEYS.audience.map((k) => ({ value: k, label: l.audience[k] })) },
  ];

  const card = (c: ContentSummary, featured = false) => (
    <ContentCard featured={featured} key={c.id} href={`/library/${c.slug}`} title={c.title} appeal={c.mainAppeal} appealLine={c.appealText} participation={c.viewerParticipation} tier={c.playerTier} games={c.games.map((g) => g.name).join(", ") || c.gamesText || undefined} />
  );

  function changeTier(v: string) {
    setTier(v as PlayerTier);
    window.history.replaceState(null, "", `?tier=${v}`);
  }

  return (
    <Tabs label={t("tabs")} value={tier} onChange={changeTier} tabs={TAXONOMY_KEYS.tier.map((v) => ({ value: v, label: l.tier[v] }))}>
      <div className="ow-toolbar">
        <p className="ow-count">{activeCount > 0 ? t("countFiltered", { n: filtered.length }) : t("count", { n: inTier.length })}</p>
        <FilterSheet activeCount={activeCount} onReset={() => setFilters(EMPTY)}>
          {defs.map((d) => (
            <fieldset key={d.key} className="ow-field">
              <legend>{d.label}</legend>
              <ChipGroup label={d.label} multiple options={d.options} value={filters[d.key]} onChange={(next) => setFilters((f) => ({ ...f, [d.key]: next }))} />
            </fieldset>
          ))}
        </FilterSheet>
      </div>

      {inTier.length === 0 ? (
        <EmptyState title={t("emptyTier", { tier: l.tier[tier] })} hint={t("emptyTierHint")} />
      ) : activeCount === 0 ? (
        <>
          {bundles.map((b) => (
            <section key={b.key} className={b.sameGame ? "ow-bundle ow-bundle-versus" : "ow-bundle"} aria-label={b.title}>
              <div className="ow-bundle-head">
                <h3>{b.title}</h3>
                <p>{b.desc}</p>
              </div>
              {b.sameGame ? (
                // 같은 게임, 다른 진행 방식: 나란히 놓고 비교한다
                <div className="ow-compare">{b.items.slice(0, 3).map((c) => card(c))}</div>
              ) : (
                <div className="ow-grid ow-grid-mag">{b.items.slice(0, 5).map((c, i) => card(c, i === 0))}</div>
              )}
            </section>
          ))}
          <h2 className="ow-h2">{t("all", { tier: l.tier[tier] })}</h2>
          <div className="ow-grid ow-grid-mag">{inTier.map((c, i) => card(c, i % 7 === 0))}</div>
        </>
      ) : filtered.length === 0 ? (
        <EmptyState title={t("noMatch")} hint={t("noMatchHint")} action={<Button variant="secondary" onClick={() => setFilters(EMPTY)}>{t("resetFilters")}</Button>} />
      ) : (
        <div className="ow-grid">{filtered.map((c) => card(c))}</div>
      )}
    </Tabs>
  );
}
