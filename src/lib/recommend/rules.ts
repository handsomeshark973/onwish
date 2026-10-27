import { formatPlayers } from "@/lib/format";
import type { GameFormat, GameSummary } from "@/types/domain";

/** 번역 함수. messages의 recoServer 묶음을 가리킨다. */
export type Tr = (key: string, values?: Record<string, string | number>) => string;
import { memberCountOf, type ProfileInput } from "./schema";
import type { ContentCandidate, PickGameInfo, RecommendPick, TrendCandidate } from "./types";

// 기획서 8장 강점 → 세부 어필 매핑
const STRENGTH_POINTS: Record<string, string[]> = {
  talk: ["talk_radio", "verbal_mind_game"],
  chemistry: ["chemistry", "forced_comm"],
  skill: ["skill_highlight", "combat_action"],
  creation: ["creation_result", "growth_visual"],
  reaction: ["scream_sound", "cam_reaction"],
};
// 강점이 겨냥하는 주 어필
const STRENGTH_APPEAL: Record<string, "visual" | "audio"> = { talk: "audio", chemistry: "audio", skill: "visual", creation: "visual", reaction: "visual" };

type Scored = { pick: RecommendPick; strength: number; total: number; lifecycle: string };

export function gameInfoFor(p: ProfileInput, g: GameSummary, f: GameFormat | null, tr: Tr, tf: Tr): PickGameInfo {
  const owners = (p.members ?? []).map((m) => m.ownedGameIds);
  const known = owners.length > 0 && owners.every((o) => o !== undefined);
  return {
    slug: g.slug,
    name: g.name,
    players: formatPlayers(g.players, tf),
    formatPlayers: f ? formatPlayers(f.requiredPlayers, tf) : tr("check"),
    extraDevices: [...new Set([...(f?.requiredDevices ?? [])].filter((d) => d !== "PC"))],
    priceNote: g.priceNote ?? tr("check"),
    needsPurchase: known ? owners.some((o) => !o!.includes(g.id)) : null,
  };
}

export function baseFromContent(p: ProfileInput, c: ContentCandidate, tr: Tr, tf: Tr): RecommendPick {
  return {
    kind: "content", title: c.title, logline: c.appealText, contentSlug: c.slug, contentId: c.id, formatId: null,
    gameIds: c.games.map((g) => g.id), origin: c.origin, borrowedFrom: c.borrowedFrom, mainAppeal: c.mainAppeal,
    appealPoints: c.appealPoints, appealText: c.appealText, strengthFit: "match", strengthFitReason: "", watchMode: c.watchMode,
    lifecycle: c.lifecycle, heatStage: null, setup: c.modsOrSetup ?? "", howTo: c.howTo.split("\n").map((s) => s.trim()).filter(Boolean),
    roles: [], multiPovPoint: c.multiPovPoint ?? "", viewerParticipation: c.viewerParticipation,
    participationChannels: c.participationChannels,
    participationHow: Object.values(c.participationBySize)[0] ?? "",
    noParticipationReason: c.viewerParticipation === "none" ? tr("noParticipation") : "",
    continuity: c.continuity ?? "", episodes: [], cautions: c.cautions ?? "",
    gameInfo: c.games.map((cg) => ({
      slug: cg.slug, name: cg.name, players: tr("check"), formatPlayers: formatPlayers(c.requiredPlayers, tf),
      extraDevices: c.devices.filter((d) => d !== "PC"), priceNote: tr("check"), needsPurchase: null,
    })),
  };
}

export function baseFromTrend(p: ProfileInput, t: TrendCandidate, tr: Tr, tf: Tr): RecommendPick {
  const { game: g, format: f } = t;
  return {
    kind: "trend", title: `${g.name} · ${f.title}`, logline: f.appealText, contentSlug: null, contentId: null,
    formatId: f.id, gameIds: [g.id], origin: "game", borrowedFrom: null, mainAppeal: f.mainAppeal, appealPoints: f.appealPoints,
    appealText: f.appealText, strengthFit: "match", strengthFitReason: "", watchMode: f.mainAppeal === "audio" ? "background" : "focus",
    lifecycle: "trend", heatStage: g.heatStage === "rising" ? "rising" : "peak", setup: f.modsOrSetup ?? "",
    howTo: f.howTo.split("\n").map((s) => s.trim()).filter(Boolean), roles: [], multiPovPoint: "",
    viewerParticipation: "none", participationChannels: [], participationHow: "",
    noParticipationReason: tr("trendNoParticipation"),
    continuity: "", episodes: [],
    cautions: [g.cautions, g.heatStage === "rising" ? tr("risingCaution") : ""].filter(Boolean).join(" · "),
    gameInfo: [gameInfoFor(p, g, f, tr, tf)],
  };
}

function score(p: ProfileInput, pick: RecommendPick, audienceFit: string[] | null): { strength: number; total: number } {
  let strength = 0;
  for (const s of p.strengths) {
    strength += pick.appealPoints.filter((x) => STRENGTH_POINTS[s].includes(x)).length * 3;
    if (STRENGTH_APPEAL[s] === pick.mainAppeal) strength += 1;
  }
  let t = strength;
  if (p.goal === "acquire" && pick.mainAppeal === "visual") t += 1;
  if (p.goal === "retain" && pick.mainAppeal === "audio") t += 1;
  if (p.timeSlot === "late_night" && pick.mainAppeal === "audio") t += 1;
  if (p.length === "series" && pick.lifecycle === "series") t += 1;
  if (p.chemistryLevel === "first") t += pick.appealPoints.includes("forced_comm") ? 2 : pick.appealPoints.includes("talk_radio") ? -1 : 0;
  if (audienceFit && audienceFit.includes(p.audience)) t += 1;
  if (p.hasCommunity && pick.participationChannels.includes("community_task")) t += 0.5;
  return { strength, total: t };
}



/** AI를 쓰지 못할 때의 규칙 기반 추천. 최대 3개: 강점 일치 2개 + 다른 어필의 보완 1개. 부족하면 더 적게 낸다. */
export function ruleBasedPicks(
  p: ProfileInput, contents: ContentCandidate[], trends: TrendCandidate[], tr: Tr, tf: Tr, pointLabel: (k: string) => string,
): RecommendPick[] {
  const scored: Scored[] = [
    ...contents.map((c) => ({ pick: baseFromContent(p, c, tr, tf), aud: c.audienceFit as string[] | null })),
    ...trends.map((t) => ({ pick: baseFromTrend(p, t, tr, tf), aud: null })),
  ].map(({ pick, aud }) => ({ pick, ...score(p, pick, aud), lifecycle: pick.lifecycle }));
  scored.sort((a, b) => b.total - a.total);

  const chosen: Scored[] = [];
  const matches = scored.filter((s) => s.strength > 0 || p.strengths.length === 0);
  // 트렌드 포함이 켜져 있으면 트렌드 후보 1개를 우선 포함
  const trend = scored.find((s) => s.pick.kind === "trend");
  if (trend) chosen.push(trend);
  for (const s of matches) if (chosen.length < 2 && !chosen.includes(s)) chosen.push(s);
  const mainAppeals = new Set(chosen.map((s) => s.pick.mainAppeal));
  const complement = scored.find((s) => !chosen.includes(s) && !mainAppeals.has(s.pick.mainAppeal)) ?? scored.find((s) => !chosen.includes(s));
  if (complement && chosen.length < 3) chosen.push(complement);
  // 후보가 충분하면 상시·시리즈 1개 포함
  if (chosen.length === 3 && !chosen.some((s) => s.lifecycle !== "trend")) {
    const evergreen = scored.find((s) => !chosen.includes(s) && s.lifecycle !== "trend");
    if (evergreen) chosen[2] = evergreen;
  }

  return chosen.slice(0, 3).map((s, i) => {
    const isComplement = s.strength === 0 || (i === chosen.length - 1 && chosen.length === 3 && s === complement);
    return {
      ...s.pick,
      strengthFit: isComplement ? "complement" : "match",
      strengthFitReason: isComplement
        ? tr("complementReason")
        : s.strength > 0 ? tr("matchReason", { points: s.pick.appealPoints.map(pointLabel).join(", ") }) : tr("generalReason"),
    } satisfies RecommendPick;
  });
}

export function summaryFor(p: ProfileInput, n: number, source: "ai" | "rule", tr: Tr): string {
  if (n === 0) return tr("summaryNone");
  const who = p.mode === "solo" ? tr("whoSolo") : tr("whoGroup", { n: memberCountOf(p) });
  return source === "rule" ? tr("summaryRule", { who, few: n < 3 ? tr("few", { n }) : "" }) : "";
}
