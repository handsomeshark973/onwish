// 고객 유형 판정 시험(본인 선택 우선·행동 추정·점수 계산). 실행: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { CUSTOMER_TYPES, SEGMENTS, INFER } from "../config/customerTypes";
import { contentStyle, inferCustomerType, preferredTier, requestStyle, segmentOf, type EventRow } from "./customer-type";

const NOW = new Date("2026-10-28T00:00:00Z");
const day = (n: number) => new Date(NOW.getTime() - n * 86400_000).toISOString();
const req = (tier: string, extra: Record<string, unknown> = {}, d = 1): EventRow => ({ type: "recommend_requested", at: day(d), payload: { tier, strengths: [], ...extra } });
const saved = (payload: Record<string, unknown>, d = 1): EventRow => ({ type: "recommend_saved", at: day(d), payload });

test("유형 키 3개 + 미분류 칸 2개", () => {
  assert.deepEqual([...CUSTOMER_TYPES], ["solo_game", "solo_talk", "crew"]);
  assert.deepEqual([...SEGMENTS], ["solo_game", "solo_talk", "crew", "solo_undecided", "insufficient"]);
});

test("① 합방 요청이 우세(소수+다수)하면 crew", () => {
  const r = inferCustomerType([req("small"), req("large"), req("solo")], NOW);
  assert.equal(r.customerType, "crew");
  assert.equal(r.soloInferred, false);
});

test("요청 수가 최소(2회)에 못 미치면 근거 부족(null)", () => {
  assert.equal(inferCustomerType([], NOW).reason, "insufficient");
  const one = inferCustomerType([req("small")], NOW);
  assert.equal(one.customerType, null);
  assert.equal(one.soloInferred, false);
});

test("혼방·합방이 비슷하게 섞이면 근거 부족(억지로 유형에 넣지 않는다)", () => {
  const r = inferCustomerType([req("solo"), req("small")], NOW);
  assert.equal(r.customerType, null);
  assert.equal(r.reason, "insufficient");
});

test("30일보다 오래된 요청은 세지 않는다", () => {
  const r = inferCustomerType([req("small", {}, 40), req("small", {}, 35), req("small", {}, 2)], NOW);
  assert.equal(r.reason, "insufficient");
});

test("② 혼방 + 소통 신호(입담 칩·청각형·틀어 두기·시청자 참여 저장) → solo_talk", () => {
  const ev = [
    req("solo", { strengths: ["talk"] }), req("solo", { strengths: ["talk", "reaction"] }),
    saved({ mainAppeal: "audio", watchMode: "background", viewerParticipation: "required" }),
  ];
  const r = inferCustomerType(ev, NOW);
  assert.equal(r.customerType, "solo_talk");
  assert.equal(r.reason, "solo_talk");
});

test("② 혼방 + 게임 신호(실력 칩·시각형·집중 시청) → solo_game", () => {
  const ev = [req("solo", { strengths: ["skill"] }), req("solo", { strengths: ["skill"] }), saved({ mainAppeal: "visual", watchMode: "focus", viewerParticipation: "none" })];
  assert.equal(inferCustomerType(ev, NOW).customerType, "solo_game");
});

test("② 혼방인데 신호가 부족하면 솔로(스타일 미정): customerType null + soloInferred true", () => {
  const r = inferCustomerType([req("solo"), req("solo")], NOW);
  assert.equal(r.customerType, null);
  assert.equal(r.soloInferred, true);
  assert.equal(segmentOf(r.customerType, r.soloInferred), "solo_undecided");
});

test("② 게임·소통 신호가 엇비슷하면 솔로(스타일 미정)", () => {
  const r = inferCustomerType([req("solo", { strengths: ["skill", "talk"] }), req("solo")], NOW);
  assert.equal(r.customerType, null);
  assert.equal(r.soloInferred, true);
});

test("점수가 최소 합계 미만이면 한두 개 신호로 유형을 정하지 않는다", () => {
  const r = inferCustomerType([req("solo", { usesCam: true }), req("solo")], NOW); // 소통 0.5점뿐
  assert.ok(r.scores.talk + r.scores.game < INFER.minStyleTotal);
  assert.equal(r.soloInferred, true);
});

test("게임 상세 조회는 게임 쪽 점수, 저장은 컨텐츠 성격 점수", () => {
  const ev: EventRow[] = [req("solo"), req("solo"), { type: "game_viewed", at: day(1), payload: { slug: "x" } }, { type: "game_viewed", at: day(1), payload: { slug: "y" } }];
  assert.equal(inferCustomerType(ev, NOW).customerType, "solo_game");
});

test("점수 계산 단위: 칩·캠·컨텐츠 성격", () => {
  assert.deepEqual(requestStyle({ strengths: ["skill"] }), { game: 3, talk: 0 });
  assert.deepEqual(requestStyle({ strengths: ["talk", "reaction", "creation", "chemistry"], usesCam: true, communityActivity: "high" }), { game: 0, talk: 5.5 });
  assert.deepEqual(contentStyle({ mainAppeal: "audio", watchMode: "background", viewerParticipation: "required" }), { game: 0, talk: 4 });
  assert.deepEqual(contentStyle({ mainAppeal: "visual", watchMode: "focus", viewerParticipation: "none" }), { game: 2, talk: 0 });
  assert.deepEqual(contentStyle({ mainAppeal: "audiovisual", watchMode: "x" }), { game: 0, talk: 0 });
});

test("가장 많이 쓴 인원 규모", () => {
  assert.equal(preferredTier([]), null);
  assert.equal(preferredTier([req("small"), req("large"), req("small")]), "small");
  assert.equal(preferredTier([req("solo"), req("small")]), "solo"); // 동률이면 혼방 우선
});
