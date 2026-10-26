import { AI_REQUESTS_PER_MINUTE, DAILY_AI_COST_LIMIT_USD, FREE_AI_RECOMMENDS_PER_MONTH } from "@/config/limits";
import type { GameSummary } from "@/types/domain";
import { costUsd, runAi, type Ask } from "./ai";
import { buildCandidates } from "./candidates";
import { ruleBasedPicks, summaryFor, type Tr } from "./rules";
import type { ProfileInput } from "./schema";
import type { ContentCandidate, RecommendNotice, RecommendResult } from "./types";

type ChargeOutcome = "charged" | "already_charged" | "not_charged" | "limit_reached";

// 서버가 DB·외부 서비스와 주고받는 부분. 실제 구현은 actions.ts, 시험에서는 가짜로 바꿔 끼운다.
export interface Deps {
  /** 화면 언어에 맞춘 문구 도우미. tr = recoServer 묶음, tf = format 묶음, pointLabel = 세부 어필 이름 */
  tr: Tr;
  tf: Tr;
  pointLabel: (key: string) => string;
  contents: ContentCandidate[];
  games: GameSummary[];
  aiConfigured: boolean;
  ask: Ask;
  getQuota(): Promise<{ used: number; remaining: number; nextReset: string }>;
  /** 요청을 기록한다. 이미 정상 차감된 요청이면 그때 만든 결과를 돌려준다. */
  begin(requestId: string): Promise<{ existing: RecommendResult | null }>;
  recentRequests(seconds: number): Promise<number>;
  todayCostUsd(): Promise<number>;
  addCostUsd(usd: number): Promise<void>;
  charge(requestId: string, cards: number): Promise<ChargeOutcome>;
  saveResult(requestId: string, result: RecommendResult): Promise<void>;
}

const withQuota = async (deps: Deps, r: Omit<RecommendResult, "quota">): Promise<RecommendResult> => {
  const q = await deps.getQuota();
  return { ...r, quota: { used: q.used, remaining: q.remaining, limit: FREE_AI_RECOMMENDS_PER_MONTH, nextReset: q.nextReset } };
};

export async function recommend(deps: Deps, profile: ProfileInput, requestId: string): Promise<RecommendResult> {
  const { contents, trends } = buildCandidates(profile, deps.contents, deps.games);

  const basic = (notice: RecommendNotice | null) => {
    const picks = ruleBasedPicks(profile, contents, trends, deps.tr, deps.tf, deps.pointLabel);
    return withQuota(deps, { source: "rule", summary: summaryFor(profile, picks.length, "rule", deps.tr), picks, notice });
  };

  // 후보가 없으면 AI를 부를 이유가 없다. 이유를 알려 주고 끝낸다(차감 없음).
  if (contents.length + trends.length === 0) return basic(null);
  if (!deps.aiConfigured) return basic("ai_off");

  const prior = await deps.begin(requestId);
  if (prior.existing) return prior.existing; // 같은 요청의 재전송: 다시 부르지도, 다시 차감하지도 않는다

  const quota = await deps.getQuota();
  if (quota.remaining <= 0) return basic("quota");
  if ((await deps.recentRequests(60)) > AI_REQUESTS_PER_MINUTE) return basic("rate_limit");
  if ((await deps.todayCostUsd()) >= DAILY_AI_COST_LIMIT_USD) return basic("cost_cap");

  const run = await runAi(profile, contents, trends, deps.ask, deps.tr, deps.tf);
  if (run.inputTokens + run.outputTokens > 0) await deps.addCostUsd(costUsd(run.model, run.inputTokens, run.outputTokens));
  if (!run.ok) return basic("ai_failed");

  const ai: Omit<RecommendResult, "quota"> = { source: "ai", summary: run.summary, picks: run.picks, notice: null };
  if (run.picks.length < 3) return withQuota(deps, ai); // 0~2개는 차감하지 않는다

  const outcome = await deps.charge(requestId, run.picks.length);
  if (outcome === "limit_reached") return basic("quota"); // 동시에 들어온 요청 때문에 한도를 넘겼다면 AI 결과를 내주지 않는다
  const result = await withQuota(deps, ai);
  await deps.saveResult(requestId, result);
  return result;
}
