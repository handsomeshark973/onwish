import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { DEFAULT_MODEL, FALLBACK_PRICE, MODEL_PRICES } from "@/config/limits";
import { RECOMMEND_PROMPT } from "./prompt";
import { baseFromContent, baseFromTrend, summaryFor, type Tr } from "./rules";
import { memberCountOf, type ProfileInput } from "./schema";
import type { ContentCandidate, RecommendPick, TrendCandidate } from "./types";

export class AiInvalid extends Error {}

export type AskResult = { text: string; inputTokens: number; outputTokens: number; model: string; refused: boolean };
export type Ask = (prompt: string) => Promise<AskResult>;

const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-opus-5", "claude-fable-5-1", "claude-sonnet-5-5"]);

/** 실제 Claude 호출. 모델 이름은 환경변수 CLAUDE_MODEL, 비어 있으면 기본값. */
export const askClaude: Ask = async (prompt) => {
  const model = process.env.CLAUDE_MODEL || DEFAULT_MODEL;
  // ANTHROPIC_API_KEY는 환경에서 읽는다. 컴퓨터에 다른 도구가 ANTHROPIC_BASE_URL을 심어 둬도 따라가지 않도록
  // 기본 주소를 고정하고, 꼭 바꿔야 할 때만 ONWISH_ANTHROPIC_BASE_URL을 쓴다.
  const client = new Anthropic({ baseURL: process.env.ONWISH_ANTHROPIC_BASE_URL || "https://api.anthropic.com" });
  const base = { model, max_tokens: 8000, messages: [{ role: "user" as const, content: prompt }] };
  // 안전 장치가 요청을 거절하면 서버가 대체 모델로 이어서 처리하게 한다(지원하는 모델만).
  const res = FALLBACK_MODELS.has(model)
    ? await client.beta.messages.create({ ...base, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" } as never)
    : await client.messages.create(base);
  const text = (res.content as { type: string; text?: string }[]).filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
  return {
    text,
    inputTokens: res.usage.input_tokens ?? 0,
    outputTokens: res.usage.output_tokens ?? 0,
    model,
    refused: res.stop_reason === "refusal",
  };
};

export function costUsd(model: string, inputTokens: number, outputTokens: number): number {
  const price = MODEL_PRICES[model] ?? FALLBACK_PRICE;
  return (inputTokens * price.in + outputTokens * price.out) / 1_000_000;
}

// ───── AI 응답 검증 ─────
const aiPick = z.object({
  title: z.string().optional(),
  logline: z.string().max(400),
  contentId: z.string().nullable(),
  formatId: z.string().nullable().optional(),
  strengthFit: z.enum(["match", "complement"]),
  strengthFitReason: z.string().max(400).default(""),
  howTo: z.array(z.string().max(500)).max(12).default([]),
  roles: z.array(z.object({ member: z.string().max(60), role: z.string().max(200) })).max(12).default([]),
  multiPovPoint: z.string().max(500).default(""),
  viewerParticipation: z.enum(["none", "enriches", "required"]),
  participationChannels: z.array(z.enum(["chat_vote", "donation_mission", "direct_play", "community_task"])).default([]),
  participationHow: z.string().max(600).default(""),
  noParticipationReason: z.string().max(300).default(""),
  continuity: z.string().max(400).default(""),
  episodes: z.array(z.object({ no: z.number().int(), title: z.string().max(200), mainAppeal: z.string().max(40) })).max(24).default([]),
  cautions: z.string().max(600).default(""),
});
const aiResponse = z.object({ summary: z.string().max(600), picks: z.array(aiPick).max(3) });

export function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new AiInvalid("JSON을 찾지 못했습니다");
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new AiInvalid("JSON 형식이 올바르지 않습니다");
  }
}

/**
 * AI 응답을 서버가 가진 후보와 맞춰 본다. 후보에 없는 ID·실행 조건 위반은 모두 실패로 처리한다.
 * 게임·인원·기기·어필 같은 사실 값은 AI가 쓴 값이 아니라 DB 후보의 값으로 덮어쓰고,
 * AI는 설명 문장(한 줄 소개, 역할, 진행 순서, 참여 방식 등)만 맡는다.
 */
export function reconcile(
  p: ProfileInput, parsed: unknown, contents: ContentCandidate[], trends: TrendCandidate[], tr: Tr, tf: Tr,
): { summary: string; picks: RecommendPick[] } {
  const r = aiResponse.safeParse(parsed);
  if (!r.success) throw new AiInvalid("응답 구조가 올바르지 않습니다");
  const isGroup = p.mode !== "solo";
  const seen = new Set<string>();
  const picks: RecommendPick[] = [];

  for (const a of r.data.picks) {
    let base: RecommendPick;
    let key: string;
    if (a.contentId) {
      const c = contents.find((x) => x.id === a.contentId);
      if (!c) throw new AiInvalid("후보에 없는 컨텐츠 ID");
      base = baseFromContent(p, c, tr, tf);
      key = `c:${c.id}`;
    } else if (a.formatId) {
      const t = trends.find((x) => x.format.id === a.formatId);
      if (!t) throw new AiInvalid("후보에 없는 트렌드 진행 방식 ID");
      base = baseFromTrend(p, t, tr, tf);
      key = `f:${t.format.id}`;
    } else throw new AiInvalid("추천이 어떤 후보인지 알 수 없습니다");
    if (seen.has(key)) throw new AiInvalid("같은 후보를 두 번 추천했습니다");
    seen.add(key);

    const channels = a.participationChannels.filter((c) => p.hasCommunity || c !== "community_task");
    if (!p.hasCommunity && a.participationChannels.includes("community_task")) throw new AiInvalid("커뮤니티가 없는데 커뮤니티 과제를 썼습니다");
    const multiPov = a.multiPovPoint.trim() || base.multiPovPoint;
    if (isGroup && !multiPov) throw new AiInvalid("합방인데 멀티 시점 포인트가 없습니다");
    const none = a.viewerParticipation === "none";

    picks.push({
      ...base,
      logline: a.logline,
      strengthFit: a.strengthFit,
      strengthFitReason: a.strengthFitReason,
      howTo: a.howTo.filter((s) => s.trim()).length ? a.howTo.filter((s) => s.trim()) : base.howTo,
      roles: isGroup ? a.roles : [],
      multiPovPoint: multiPov,
      viewerParticipation: a.viewerParticipation,
      participationChannels: none ? [] : channels,
      participationHow: none ? "" : a.participationHow,
      noParticipationReason: none ? a.noParticipationReason || tr("noParticipation") : "",
      continuity: a.continuity || base.continuity,
      episodes: p.length === "series" ? a.episodes : [],
      cautions: a.cautions || base.cautions,
    });
  }
  return { summary: r.data.summary || summaryFor(p, picks.length, "ai", tr), picks };
}

const slimContent = (c: ContentCandidate) => ({
  id: c.id, title: c.title, playerTier: c.playerTier, requiredPlayers: c.requiredPlayers, participationMode: c.participationMode,
  origin: c.origin, borrowedFrom: c.borrowedFrom, structures: c.structures, lifecycle: c.lifecycle, audienceFit: c.audienceFit,
  devices: c.devices, games: c.games.map((g) => ({ id: g.id, name: g.name })), gamesText: c.gamesText, modsOrSetup: c.modsOrSetup,
  mainAppeal: c.mainAppeal, appealPoints: c.appealPoints, appealText: c.appealText, watchMode: c.watchMode, howTo: c.howTo,
  multiPovPoint: c.multiPovPoint, viewerParticipation: c.viewerParticipation, participationChannels: c.participationChannels,
  participationBySize: c.participationBySize, continuity: c.continuity, cautions: c.cautions,
});

const slimTrend = (t: TrendCandidate) => ({
  gameId: t.game.id, name: t.game.name, heatStage: t.game.heatStage, players: t.game.players,
  platforms: t.game.platforms, streamPoint: t.game.streamPoint, cautions: t.game.cautions,
  format: {
    formatId: t.format.id, title: t.format.title, requiredPlayers: t.format.requiredPlayers, mainAppeal: t.format.mainAppeal,
    appealPoints: t.format.appealPoints, appealText: t.format.appealText, howTo: t.format.howTo, modsOrSetup: t.format.modsOrSetup,
  },
});

export function buildPrompt(p: ProfileInput, contents: ContentCandidate[], trends: TrendCandidate[], languageRule: string): string {
  // 인증 정보·계정 식별자는 프로필에 들어 있지 않다(입력 스키마가 허용하지 않음). 그대로 보낸다.
  return (RECOMMEND_PROMPT + "\n\n[출력 언어]\n" + languageRule)
    .replace("{{profile_json}}", JSON.stringify({ ...p, memberCount: memberCountOf(p) }))
    .replace("{{content_candidates_json}}", JSON.stringify(contents.map(slimContent)))
    .replace("{{trend_games_json}}", JSON.stringify(trends.map(slimTrend)));
}

export type AiRun = { ok: true; summary: string; picks: RecommendPick[]; inputTokens: number; outputTokens: number; model: string } | { ok: false; inputTokens: number; outputTokens: number; model: string };

/** 한 번 호출하고, 응답이 올바르지 않으면 1회 다시 시도한다. 그래도 안 되면 ok:false. 쓴 토큰은 실패해도 합산해 돌려준다. */
export async function runAi(
  p: ProfileInput, contents: ContentCandidate[], trends: TrendCandidate[], ask: Ask, tr: Tr, tf: Tr,
): Promise<AiRun> {
  const prompt = buildPrompt(p, contents, trends, tr("aiLanguage"));
  let inputTokens = 0, outputTokens = 0, model = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await ask(prompt);
      inputTokens += res.inputTokens; outputTokens += res.outputTokens; model = res.model;
      if (res.refused) return { ok: false, inputTokens, outputTokens, model };
      const out = reconcile(p, extractJson(res.text), contents, trends, tr, tf);
      return { ok: true, ...out, inputTokens, outputTokens, model };
    } catch (e) {
      if (!(e instanceof AiInvalid)) return { ok: false, inputTokens, outputTokens, model }; // 네트워크·인증 오류는 재시도하지 않는다
    }
  }
  return { ok: false, inputTokens, outputTokens, model };
}
