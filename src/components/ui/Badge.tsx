"use client";

import { useTranslations } from "next-intl";
import { useLabels } from "@/i18n/labels";
import type { AudienceSize, HeatStage, MainAppeal } from "@/types/taxonomy";

// 배지는 색과 글자를 항상 함께 쓴다. 색만으로 구분하지 않는다.
export function AppealBadge({ appeal }: { appeal: MainAppeal }) {
  const l = useLabels();
  return (
    <span className={`ow-badge ow-appeal-${appeal}`} title={l.appealHint[appeal]}>
      {l.appeal[appeal]}
    </span>
  );
}

// stage가 null이면 인기 상태를 아직 확인하지 못한 게임이다.
export function StageBadge({ stage }: { stage: HeatStage | null }) {
  const l = useLabels();
  const g = useTranslations("game");
  if (!stage) return <span className="ow-badge ow-size">{g("popularityUnknown")}</span>;
  return <span className={`ow-badge ow-stage-${stage}`}>{l.stage[stage]}</span>;
}

export function SizeBadge({ size }: { size: AudienceSize }) {
  const l = useLabels();
  return <span className="ow-badge ow-size">{l.audience[size]}</span>;
}
