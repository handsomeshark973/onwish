// 추천 엔진 시험. 실행: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { SAMPLE_CONTENTS, SAMPLE_GAMES } from "../../data/samples";
import type { ContentSummary, GameSummary } from "../../types/domain";
import { extractJson, reconcile, AiInvalid, type Ask } from "./ai";
import { buildCandidates, eligibleContent } from "./candidates";
import { recommend, type Deps } from "./engine";
import { profileSchema, type ProfileInput } from "./schema";
import { ruleBasedPicks } from "./rules";
import type { RecommendResult } from "./types";

const tr = (k: string) => k; // 시험에서는 번역 대신 문구 키를 그대로 쓴다
const member = (name: string, devices: ("PC" | "PS5" | "SWITCH" | "VR")[] = ["PC"]) => ({ name, note: "", devices });
const small = (over: Partial<ProfileInput> = {}): ProfileInput =>
  profileSchema.parse({
    mode: "small", strengths: ["chemistry"], persona: "", usesCam: true, audience: "m", devices: ["PC"], length: "single",
    timeSlot: "evening", goal: "both", hasCommunity: true, allowRotation: false, allowLeague: false, excludedGameIds: [],
    excludedGenres: [], avoidHorror: false, avoidMotionSickness: false, avoidSpoilers: false, includeTrend: true,
    members: [member("가"), member("나"), member("다")], chemistryLevel: "some", ...over,
  });
const c = (over: Partial<ContentSummary> = {}): ContentSummary => ({ ...SAMPLE_CONTENTS[2], ...over });

test("멤버 수가 필요 인원 범위를 벗어나면 제외", () => {
  assert.equal(eligibleContent(small(), c()), true);
  assert.equal(eligibleContent(small(), c({ requiredPlayers: { min: 4, max: 5 } })), false);
  assert.equal(eligibleContent(small(), c({ requiredPlayers: { min: null, max: null } })), false); // 미확인은 제외
});

test("교대·리그는 허용했을 때만", () => {
  assert.equal(eligibleContent(small(), c({ participationMode: "rotation" })), false);
  assert.equal(eligibleContent(small({ allowRotation: true }), c({ participationMode: "rotation" })), true);
  assert.equal(eligibleContent(small(), c({ participationMode: "league" })), false);
});

test("회피 조건은 '아니다'로 확인된 것만 통과(미확인 null은 제외)", () => {
  assert.equal(eligibleContent(small({ avoidHorror: true }), c({ isHorror: false })), true);
  assert.equal(eligibleContent(small({ avoidHorror: true }), c({ isHorror: true })), false);
  assert.equal(eligibleContent(small({ avoidHorror: true }), c({ isHorror: null })), false);
  assert.equal(eligibleContent(small({ avoidHorror: false }), c({ isHorror: null })), true);
});

test("커뮤니티가 없으면 community_task 제외", () => {
  const withTask = c({ participationChannels: ["community_task"] });
  assert.equal(eligibleContent(small({ hasCommunity: false }), withTask), false);
  assert.equal(eligibleContent(small({ hasCommunity: true }), withTask), true);
});

test("캠을 안 쓰면 cam_reaction 제외", () => {
  assert.equal(eligibleContent(small({ usesCam: false }), c({ appealPoints: ["cam_reaction"] })), false);
});

test("기기가 갈리면 크로스플레이 확인된 게임만", () => {
  const split = small({ members: [member("가", ["PC"]), member("나", ["PS5"]), member("다", ["PC"])] });
  const game = { ...SAMPLE_CONTENTS[2].games[0] };
  assert.equal(eligibleContent(split, c({ devices: ["PC", "PS5"], games: [{ ...game, crossplay: null }] })), false);
  assert.equal(eligibleContent(split, c({ devices: ["PC", "PS5"], games: [{ ...game, crossplay: true }] })), true);
  assert.equal(eligibleContent(split, c({ devices: ["PC", "PS5"], games: [] })), false); // 연결 게임 없이는 확인 불가
  assert.equal(eligibleContent(small(), c({ devices: [] })), false); // 필요 기기 미확인
});

test("제외 게임·장르", () => {
  const g = SAMPLE_CONTENTS[2].games[0];
  assert.equal(eligibleContent(small({ excludedGameIds: [g.id] }), c()), false);
  assert.equal(eligibleContent(small({ excludedGenres: ["예시 장르"] }), c()), false);
});

test("트렌드: rising·peak만, 고정 인원은 정확히 일치해야 함", () => {
  const a = SAMPLE_GAMES.find((g) => g.slug === "sample-a")!; // rising, 정확히 3명
  const b = SAMPLE_GAMES.find((g) => g.slug === "sample-b")!; // upcoming
  const trends = buildCandidates(small(), [], [a, b]).trends;
  assert.ok(trends.length > 0 && trends.every((t) => t.game.slug === "sample-a"));
  const four = small({ members: [member("가"), member("나"), member("다"), member("라")] });
  assert.equal(buildCandidates(four, [], [a]).trends.length, 0); // 3명 고정 게임에 4명
  assert.equal(buildCandidates(small({ includeTrend: false }), [], [a]).trends.length, 0);
});

test("프로필 입력: 합방 인원 범위와 알 수 없는 항목(실명 등) 거부", () => {
  assert.throws(() => small({ members: [member("가")] }));
  assert.throws(() => profileSchema.parse({ ...small(), realName: "홍길동" }));
  assert.throws(() => profileSchema.parse({ ...small(), members: [{ ...member("가"), phone: "010" }, member("나")] }));
});

test("규칙 기반 추천: 최대 3개, 조건 위반 없음", () => {
  const p = small();
  const { contents, trends } = buildCandidates(p, SAMPLE_CONTENTS, SAMPLE_GAMES as GameSummary[]);
  const picks = ruleBasedPicks(p, contents, trends, tr, tr, tr);
  assert.ok(picks.length >= 1 && picks.length <= 3);
  assert.equal(new Set(picks.map((x) => x.contentId ?? x.formatId)).size, picks.length);
});

test("AI 응답 검증: 후보 밖 ID·형식 오류·커뮤니티 위반은 실패", () => {
  const p = small();
  const { contents, trends } = buildCandidates(p, SAMPLE_CONTENTS, SAMPLE_GAMES as GameSummary[]);
  const ok = { logline: "소개", contentId: contents[0].id, formatId: null, strengthFit: "match", viewerParticipation: "enriches", participationChannels: ["chat_vote"], multiPovPoint: "각자 시점" };
  const wrap = (picks: unknown[]) => ({ summary: "요약", picks });
  assert.equal(reconcile(p, wrap([ok]), contents, trends, tr, tr).picks[0].title, contents[0].title); // 사실 값은 후보 값
  assert.throws(() => reconcile(p, wrap([{ ...ok, contentId: "없는-id" }]), contents, trends, tr, tr), AiInvalid);
  assert.throws(() => reconcile(p, wrap([ok, ok]), contents, trends, tr, tr), AiInvalid); // 중복
  assert.throws(() => reconcile(p, { picks: "x" }, contents, trends, tr, tr), AiInvalid);
  const noComm = small({ hasCommunity: false });
  assert.throws(() => reconcile(noComm, wrap([{ ...ok, participationChannels: ["community_task"] }]), contents, trends, tr, tr), AiInvalid);
  assert.throws(() => reconcile(p, wrap([{ ...ok, multiPovPoint: "" }]), contents.map((x) => ({ ...x, multiPovPoint: null })), trends, tr, tr), AiInvalid); // 합방은 멀티 시점 필수
  assert.deepEqual(extractJson('앞말 {"a":1} 뒷말'), { a: 1 });
  assert.throws(() => extractJson("JSON 아님"), AiInvalid);
});

// ───── 엔진: 차감·한도·대체 ─────
function fakeDeps(over: Partial<Deps> & { calls?: { ask: number; charge: number[] } } = {}) {
  const calls = over.calls ?? { ask: 0, charge: [] as number[] };
  let used = 0;
  const p = small();
  const cands = buildCandidates(p, SAMPLE_CONTENTS, SAMPLE_GAMES as GameSummary[]);
  const pickJson = (n: number) =>
    JSON.stringify({ summary: "요약", picks: cands.contents.slice(0, n).map((x) => ({ logline: "소개", contentId: x.id, formatId: null, strengthFit: "match", viewerParticipation: "none", multiPovPoint: "각자 시점" })) });
  const ask: Ask = async () => { calls.ask++; return { text: pickJson(3), inputTokens: 1000, outputTokens: 500, model: "claude-opus-5-5", refused: false }; };
  const deps: Deps = {
    tr, tf: tr, pointLabel: tr,
    contents: SAMPLE_CONTENTS, games: SAMPLE_GAMES as GameSummary[], aiConfigured: true, ask,
    getQuota: async () => ({ used, remaining: 5 - used, nextReset: "2026-11-01T00:00:00+09:00" }),
    begin: async () => ({ existing: null }), recentRequests: async () => 1, todayCostUsd: async () => 0, addCostUsd: async () => {},
    charge: async (_id, cards) => { calls.charge.push(cards); used++; return "charged"; }, saveResult: async () => {}, ...over,
  };
  return { deps, calls, p, pickJson };
}
const REQ = "11111111-1111-1111-1111-111111111111";

test("엔진: 정상 AI 추천 3개를 줄 때만 1회 차감", async () => {
  const { deps, calls, p } = fakeDeps();
  assert.ok(buildCandidates(p, deps.contents, deps.games).contents.length >= 3, "시험용 후보가 3개 이상이어야 한다");
  const r = await recommend(deps, p, REQ);
  assert.equal(r.source, "ai");
  assert.equal(r.picks.length, 3);
  assert.deepEqual(calls.charge, [3]);
});

test("엔진: 0~2개는 차감하지 않음", async () => {
  const { deps, calls, p, pickJson } = fakeDeps();
  deps.ask = async () => ({ text: pickJson(2), inputTokens: 10, outputTokens: 10, model: "claude-opus-5-5", refused: false });
  const r = await recommend(deps, p, REQ);
  assert.equal(r.source, "ai");
  assert.equal(r.picks.length, 2);
  assert.deepEqual(calls.charge, []);
});

test("엔진: AI 실패·거절·형식 오류는 기본 추천, 차감 없음", async () => {
  for (const ask of [
    async () => { throw new Error("network"); },
    async () => ({ text: "", inputTokens: 5, outputTokens: 0, model: "m", refused: true }),
    async () => ({ text: "JSON 아님", inputTokens: 5, outputTokens: 5, model: "m", refused: false }),
  ] as Ask[]) {
    const { deps, calls, p } = fakeDeps({ ask });
    const r = await recommend(deps, p, REQ);
    assert.equal(r.source, "rule");
    assert.equal(r.notice, "ai_failed");
    assert.deepEqual(calls.charge, []);
  }
});

test("엔진: 한도 소진·분당 제한·일일 비용 상한이면 AI를 부르지 않고 기본 추천", async () => {
  for (const [over, notice] of [
    [{ getQuota: async () => ({ used: 5, remaining: 0, nextReset: "x" }) }, "quota"],
    [{ recentRequests: async () => 99 }, "rate_limit"],
    [{ todayCostUsd: async () => 999 }, "cost_cap"],
    [{ aiConfigured: false }, "ai_off"],
  ] as [Partial<Deps>, string][]) {
    const { deps, calls, p } = fakeDeps(over);
    const r = await recommend(deps, p, REQ);
    assert.equal(r.source, "rule");
    assert.equal(r.notice, notice);
    assert.equal(calls.ask, 0, `${notice}: AI 호출 없음`);
    assert.deepEqual(calls.charge, []);
  }
});

test("엔진: 같은 요청 재전송은 AI도 차감도 다시 하지 않고 이전 결과를 돌려줌", async () => {
  const prev: RecommendResult = { source: "ai", summary: "이전", picks: [], notice: null, quota: null };
  const { deps, calls, p } = fakeDeps({ begin: async () => ({ existing: prev }) });
  const r = await recommend(deps, p, REQ);
  assert.equal(r.summary, "이전");
  assert.equal(calls.ask, 0);
  assert.deepEqual(calls.charge, []);
});

test("엔진: 동시 요청으로 한도를 넘기면 AI 결과 대신 기본 추천", async () => {
  const { deps, p } = fakeDeps({ charge: async () => "limit_reached" });
  const r = await recommend(deps, p, REQ);
  assert.equal(r.source, "rule");
  assert.equal(r.notice, "quota");
});

test("엔진: 후보가 없으면 AI 없이 이유를 알려 줌", async () => {
  const { deps, calls, p } = fakeDeps({ contents: [], games: [] });
  const r = await recommend(deps, p, REQ);
  assert.equal(r.picks.length, 0);
  assert.equal(calls.ask, 0);
  assert.equal(r.summary, "summaryNone"); // (시험에서는 문구 키가 그대로 나온다)
});
