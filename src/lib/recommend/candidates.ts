import type { GameSummary } from "@/types/domain";
import { isTrendStage } from "@/types/taxonomy";
import type { ContentCandidate, TrendCandidate } from "./types";
import { memberCountOf, type ProfileInput } from "./schema";

// 서버가 먼저 거르는 "강제 조건". 기획서 6.1 처리 순서 1번.
// 값이 비어 있는(미확인) 실행 조건은 통과시키지 않는다 — 모르는 걸 맞는다고 추측하지 않는다.

const inRange = (n: number, min: number | null, max: number | null) => min !== null && max !== null && n >= min && n <= max;

const modeAllowed = (mode: string, p: ProfileInput) =>
  mode === "simultaneous" || (mode === "rotation" && p.allowRotation) || (mode === "league" && p.allowLeague);

/** 멤버별 기기 목록 (혼방은 본인 기기 하나) */
const deviceSets = (p: ProfileInput): string[][] => (p.mode === "solo" ? [p.devices] : (p.members ?? []).map((m) => m.devices));

/**
 * 기기 조건: 모든 멤버가 같은 기기로 함께 할 수 있거나(공통 기기),
 * 기기가 갈리면 연결된 모든 게임이 크로스플레이로 확인돼야 한다.
 */
function devicesWork(p: ProfileInput, supported: string[], crossplay: (boolean | null)[]): boolean {
  if (supported.length === 0) return false; // 필요 기기 미확인
  const sets = deviceSets(p);
  if (!sets.every((s) => s.some((d) => supported.includes(d)))) return false;
  const shared = supported.some((d) => sets.every((s) => s.includes(d)));
  if (shared) return true;
  return crossplay.length > 0 && crossplay.every((c) => c === true);
}

function tagsOk(p: ProfileInput, t: { isHorror: boolean | null; motionSicknessRisk: boolean | null; spoilerRisk: boolean | null }) {
  // 선택한 회피 조건은 "아니다"로 확인된 것만 통과. true이거나 미확인(null)이면 제외.
  if (p.avoidHorror && t.isHorror !== false) return false;
  if (p.avoidMotionSickness && t.motionSicknessRisk !== false) return false;
  if (p.avoidSpoilers && t.spoilerRisk !== false) return false;
  return true;
}

const hasExcludedGenre = (p: ProfileInput, genres: string[]) =>
  genres.some((g) => p.excludedGenres.some((x) => x && g.toLowerCase().includes(x.toLowerCase())));

export function eligibleContent(p: ProfileInput, c: ContentCandidate): boolean {
  const n = memberCountOf(p);
  if (c.playerTier !== p.mode) return false;
  if (!inRange(n, c.requiredPlayers.min, c.requiredPlayers.max)) return false;
  if (!modeAllowed(c.participationMode, p)) return false;
  if (!devicesWork(p, c.devices, c.games.map((g) => g.crossplay))) return false;
  if (c.games.some((g) => p.excludedGameIds.includes(g.id))) return false;
  if (c.games.some((g) => hasExcludedGenre(p, g.genre))) return false;
  if (!tagsOk(p, c)) return false;
  if (!p.hasCommunity && c.participationChannels.includes("community_task")) return false;
  if (!p.usesCam && c.appealPoints.includes("cam_reaction")) return false;
  return true;
}

export function eligibleTrend(p: ProfileInput, g: GameSummary): TrendCandidate[] {
  if (!p.includeTrend || !isTrendStage(g.heatStage)) return [];
  const n = memberCountOf(p);
  if (!inRange(n, g.players.min, g.players.max)) return [];
  if (g.players.fixed === true && g.players.min !== n) return [];
  if (p.excludedGameIds.includes(g.id) || hasExcludedGenre(p, g.genre)) return [];
  if (!tagsOk(p, g)) return [];
  const sets = deviceSets(p);
  return g.formats
    .filter((f) => {
      if (!f.playerTiers.includes(p.mode)) return false;
      if (!inRange(n, f.requiredPlayers.min, f.requiredPlayers.max)) return false;
      if (!modeAllowed(f.participationMode, p)) return false;
      if (!p.usesCam && f.appealPoints.includes("cam_reaction")) return false;
      // 진행 방식이 따로 요구하는 기기는 모든 멤버가 가지고 있어야 한다
      if (!f.requiredDevices.every((d) => sets.every((s) => s.includes(d)))) return false;
      return devicesWork(p, g.platforms, [g.crossplay]);
    })
    .map((format) => ({ game: g, format }));
}

export function buildCandidates(p: ProfileInput, contents: ContentCandidate[], games: GameSummary[]) {
  return {
    contents: contents.filter((c) => eligibleContent(p, c)),
    trends: games.flatMap((g) => eligibleTrend(p, g)),
  };
}
