// 고객 유형 판정(본인 선택 우선, 없으면 행동으로 추정). DB·서버에 의존하지 않는 계산이라 시험할 수 있다.
import { INFER, STYLE_WEIGHTS, type CustomerType, type Segment } from "@/config/customerTypes";

export type StyleSignal = { game?: number; talk?: number };
export type EventRow = { type: string; at: string | Date; payload: Record<string, unknown> };

export type Inference =
  | { customerType: CustomerType; soloInferred: false; reason: "crew" | "solo_game" | "solo_talk"; scores: { game: number; talk: number } }
  | { customerType: null; soloInferred: true; reason: "solo_undecided"; scores: { game: number; talk: number } }
  | { customerType: null; soloInferred: false; reason: "insufficient"; scores: { game: number; talk: number } };

const str = (v: unknown) => (typeof v === "string" ? v : "");
const add = (acc: { game: number; talk: number }, s: StyleSignal | undefined, mult = 1) => {
  acc.game += (s?.game ?? 0) * mult;
  acc.talk += (s?.talk ?? 0) * mult;
};

// 혼방 요청 하나의 스타일 점수: 강점 칩 + 캠 + 커뮤니티 활동
export function requestStyle(payload: Record<string, unknown>): { game: number; talk: number } {
  const acc = { game: 0, talk: 0 };
  const strengths = Array.isArray(payload.strengths) ? payload.strengths : [];
  for (const s of strengths) add(acc, STYLE_WEIGHTS.strength[str(s)]);
  if (payload.usesCam === true) add(acc, STYLE_WEIGHTS.usesCam);
  if (payload.communityActivity === "high") add(acc, STYLE_WEIGHTS.communityHigh);
  return acc;
}

// 컨텐츠 하나(저장했거나 자세히 본)의 스타일 점수: 주 어필 + 시청 태도 + 시청자 참여
export function contentStyle(payload: Record<string, unknown>, mult = 1): { game: number; talk: number } {
  const acc = { game: 0, talk: 0 };
  add(acc, STYLE_WEIGHTS.appeal[str(payload.mainAppeal)], mult);
  add(acc, STYLE_WEIGHTS.watch[str(payload.watchMode)], mult);
  add(acc, STYLE_WEIGHTS.participation[str(payload.viewerParticipation)], mult);
  return acc;
}

export function inferCustomerType(events: EventRow[], now: Date = new Date()): Inference {
  const since = now.getTime() - INFER.windowDays * 86400_000;
  const recent = events.filter((e) => {
    const t = new Date(e.at).getTime();
    return t >= since && t <= now.getTime() + 60_000;
  });
  const requests = recent.filter((e) => e.type === "recommend_requested");
  const scores = { game: 0, talk: 0 };
  const none = (reason: "insufficient"): Inference => ({ customerType: null, soloInferred: false, reason, scores });
  if (requests.length < INFER.minRequests) return none("insufficient");

  const tierOf = (e: EventRow) => str(e.payload.tier);
  const crew = requests.filter((e) => tierOf(e) === "small" || tierOf(e) === "large").length;
  const solo = requests.filter((e) => tierOf(e) === "solo").length;
  if (crew / requests.length >= INFER.tierShare) return { customerType: "crew", soloInferred: false, reason: "crew", scores };
  if (solo / requests.length < INFER.tierShare) return none("insufficient"); // 혼방·합방이 비슷하게 섞여 있다

  // 혼방: 스타일 점수 합산
  for (const e of requests) if (tierOf(e) === "solo") add(scores, requestStyle(e.payload));
  for (const e of recent) {
    if (e.type === "recommend_saved") add(scores, contentStyle(e.payload, STYLE_WEIGHTS.saved));
    else if (e.type === "content_viewed") add(scores, contentStyle(e.payload));
    else if (e.type === "game_viewed") add(scores, STYLE_WEIGHTS.gameViewed);
  }
  const total = scores.game + scores.talk;
  if (total >= INFER.minStyleTotal) {
    if (scores.game / total >= INFER.styleShare) return { customerType: "solo_game", soloInferred: false, reason: "solo_game", scores };
    if (scores.talk / total >= INFER.styleShare) return { customerType: "solo_talk", soloInferred: false, reason: "solo_talk", scores };
  }
  return { customerType: null, soloInferred: true, reason: "solo_undecided", scores };
}

// 가장 많이 쓴 인원 규모(동률이면 혼방 → 소수 → 다수 순). 요청이 없으면 null.
export function preferredTier(events: EventRow[]): "solo" | "small" | "large" | null {
  const n = { solo: 0, small: 0, large: 0 };
  for (const e of events) if (e.type === "recommend_requested") {
    const t = str(e.payload.tier);
    if (t === "solo" || t === "small" || t === "large") n[t]++;
  }
  const best = (["solo", "small", "large"] as const).reduce((a, b) => (n[b] > n[a] ? b : a));
  return n[best] === 0 ? null : best;
}

// 관리자 화면의 칸: 유형이 있으면 유형, 없으면 솔로(스타일 미정) 또는 근거 부족
export const segmentOf = (customerType: CustomerType | null, soloInferred: boolean): Segment => customerType ?? (soloInferred ? "solo_undecided" : "insufficient");
