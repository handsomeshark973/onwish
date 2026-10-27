"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GameCard } from "@/components/cards/GameCard";
import { gameCardProps } from "@/components/cards/cardProps";
import { Button } from "@/components/ui/Button";
import { StageBadge } from "@/components/ui/Badge";
import { ChipGroup } from "@/components/ui/Chip";
import { FilterSheet } from "@/components/ui/FilterSheet";
import { EmptyState } from "@/components/ui/States";
import { useLabels } from "@/i18n/labels";
import { parseStageParam, stageParamValue } from "@/lib/stage-query";
import type { GameSummary } from "@/types/domain";
import { DEVICES, HEAT_STAGES, TAXONOMY_KEYS } from "@/types/taxonomy";

type Filters = { tier: string[]; platform: string[]; appeal: string[]; stage: string[] };
const EMPTY: Filters = { tier: [], platform: [], appeal: [], stage: [] };

// 화면에 보이는 순서는 HEAT_STAGES(곧 출시 → 뜨는 중 → 골든타임 → 식는 중 → 상시). 인기 미확인은 마지막.
const SECTION_KEYS = [...HEAT_STAGES, "unknown"] as const;

function matches(g: GameSummary, f: Filters) {
  const any = (sel: string[], has: (v: string) => boolean) => sel.length === 0 || sel.some(has);
  return (
    any(f.tier, (v) => g.formats.some((x) => x.playerTiers.includes(v as never))) &&
    any(f.platform, (v) => g.platforms.includes(v as never)) &&
    any(f.appeal, (v) => g.formats.some((x) => x.mainAppeal === v)) &&
    any(f.stage, (v) => (g.heatStage ?? "unknown") === v)
  );
}

export function RadarBrowser({ games }: { games: GameSummary[] }) {
  const t = useTranslations("radar");
  const l = useLabels();
  const params = useSearchParams();
  // 주소의 ?stage=rising,peak 로 단계 필터를 미리 골라 둔다(옛 키 golden·hot도 새 키로 읽는다)
  const [filters, setFilters] = useState<Filters>(() => ({ ...EMPTY, stage: parseStageParam(params.get("stage")) }));
  // 단계 필터를 고르면 주소에도 반영해서 링크로 공유할 수 있게 한다(다른 쿼리는 그대로)
  useEffect(() => {
    const url = new URL(window.location.href);
    const next = stageParamValue(filters.stage);
    if ((url.searchParams.get("stage") ?? "") === next) return;
    if (next) url.searchParams.set("stage", next);
    else url.searchParams.delete("stage");
    window.history.replaceState(null, "", url);
  }, [filters.stage]);
  const filtered = useMemo(() => games.filter((g) => matches(g, filters)), [games, filters]);
  const activeCount = Object.values(filters).reduce((n, v) => n + v.length, 0);
  const set = (key: keyof Filters) => (next: string[]) => setFilters((f) => ({ ...f, [key]: next }));
  const opt = (keys: readonly string[], map: Record<string, string>) => keys.map((k) => ({ value: k, label: map[k] }));

  return (
    <>
      <div className="ow-toolbar">
        <p className="ow-count">{t("count", { n: filtered.length })}</p>
        <FilterSheet activeCount={activeCount} onReset={() => setFilters(EMPTY)}>
          <fieldset className="ow-field">
            <legend>{t("fTier")}</legend>
            <ChipGroup label={t("fTier")} multiple options={opt(TAXONOMY_KEYS.tier, l.tier)} value={filters.tier} onChange={set("tier")} />
          </fieldset>
          <fieldset className="ow-field">
            <legend>{t("fPlatform")}</legend>
            <ChipGroup label={t("fPlatform")} multiple options={DEVICES.map((d) => ({ value: d, label: d }))} value={filters.platform} onChange={set("platform")} />
          </fieldset>
          <fieldset className="ow-field">
            <legend>{t("fAppeal")}</legend>
            <ChipGroup label={t("fAppeal")} multiple options={opt(TAXONOMY_KEYS.appeal, l.appeal)} value={filters.appeal} onChange={set("appeal")} />
          </fieldset>
          <fieldset className="ow-field">
            <legend>{t("fStage")}</legend>
            <ChipGroup label={t("fStage")} multiple options={[...opt(TAXONOMY_KEYS.stage, l.stage), { value: "unknown", label: t("unknownStage") }]} value={filters.stage} onChange={set("stage")} />
          </fieldset>
        </FilterSheet>
      </div>

      {games.length > 0 && (
        // 단계 흐름: 곧 출시 → 뜨는 중 → 골든타임 → 식는 중 → 상시. 누르면 해당 구역으로 이동한다
        <nav aria-label={t("flowLabel")}>
          <ol className="ow-flow">
            {HEAT_STAGES.map((s) => {
              const n = filtered.filter((g) => g.heatStage === s).length;
              const inner = <><StageBadge stage={s} tip={false} /><span className="ow-flow-count">{t("flowCount", { n })}</span></>;
              return (
                <li key={s} className="ow-flow-step" data-empty={n === 0}>
                  {n > 0 ? <a href={`#stage-${s}`} className="ow-flow-link">{inner}</a> : <span className="ow-flow-link">{inner}</span>}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      {games.length === 0 ? (
        <EmptyState title={t("emptyTitle")} hint={t("emptyHint")} />
      ) : filtered.length === 0 ? (
        <EmptyState title={t("noMatchTitle")} hint={t("noMatchHint")} action={<Button variant="secondary" onClick={() => setFilters(EMPTY)}>{t("resetFilters")}</Button>} />
      ) : (
        SECTION_KEYS.map((key) => {
          const list = filtered.filter((g) => (g.heatStage ?? "unknown") === key);
          if (list.length === 0) return null;
          if (key === "upcoming") list.sort((a, b) => (a.nextKeyDate?.date ?? "9").localeCompare(b.nextKeyDate?.date ?? "9"));
          return (
            <section key={key} id={`stage-${key}`} className="ow-bundle ow-stage-section" aria-label={t(`${key}Title`)}>
              <div className="ow-bundle-head">
                <h2 className="ow-h2 ow-h2-flush">{t(`${key}Title`)}</h2>
                <p>{t(`${key}Desc`)}</p>
              </div>
              {key === "upcoming" ? (
                // 곧 출시는 날짜순 일정 형태로 보여 준다
                <ol className="ow-timeline">
                  {list.map((g) => (
                    <li key={g.id}>
                      <time className="ow-timeline-date" dateTime={g.nextKeyDate?.date}>{g.nextKeyDate?.date ?? t("dateTbd")}</time>
                      <GameCard {...gameCardProps(g)} />
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="ow-grid">
                  {list.map((g) => (
                    <GameCard key={g.id} {...gameCardProps(g)} />
                  ))}
                </div>
              )}
            </section>
          );
        })
      )}
    </>
  );
}
