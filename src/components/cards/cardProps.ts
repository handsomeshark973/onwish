import type { GameSummary } from "@/types/domain";
import type { MainAppeal } from "@/types/taxonomy";

// 게임 요약 → GameCard에 넘길 값. 홈과 레이더가 같이 쓴다. 이름·날짜 라벨은 데이터 단계에서 이미 현재 언어로 바뀌어 있다.
export function gameCardProps(g: GameSummary) {
  const appeals = [...new Set(g.formats.map((f) => f.mainAppeal))] as MainAppeal[];
  return {
    href: `/radar/${g.slug}`,
    name: g.name,
    developer: g.developer,
    stage: g.heatStage,
    appeals,
    dateLabel: g.nextKeyDate ? `${g.nextKeyDate.label} ${g.nextKeyDate.date}` : undefined,
    players: g.players,
    platforms: g.platforms,
    imageUrl: g.imageUrl ?? undefined,
    imageSource: g.imageSource ?? undefined,
    metric: g.metricKind && g.metricSeries.length ? { values: g.metricSeries, kind: g.metricKind } : undefined,
  };
}
