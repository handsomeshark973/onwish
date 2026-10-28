// 게스트 모드 규칙 시험. 실행: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { guestQuota, kstDayStart, nextKstMidnight } from "./guest-quota";
import { isProtectedPath } from "../config/protected";
import { SAMPLE_CONTENTS, SAMPLE_GAMES } from "../data/samples";
import { recommend, type Deps } from "./recommend/engine";
import { profileSchema } from "./recommend/schema";
import type { Ask } from "./recommend/ai";

test("게스트 하루 한도: 한국 자정 기준으로 계산하고, IP 한도에 걸리면 0", () => {
  const now = new Date("2026-10-28T16:00:00Z"); // 한국 10/29 01:00
  assert.equal(kstDayStart(now), "2026-10-28T15:00:00.000Z");
  assert.equal(nextKstMidnight(now), "2026-10-29T15:00:00.000Z");
  assert.deepEqual(guestQuota(1, 3, false, now).remaining, 2);
  assert.equal(guestQuota(3, 3, false, now).remaining, 0);
  assert.equal(guestQuota(5, 3, false, now).remaining, 0); // 음수가 되지 않는다
  assert.equal(guestQuota(0, 3, true, now).remaining, 0); // IP 한도 초과
  assert.equal(guestQuota(0, 3, false, now).period, "day");
});

test("보호 페이지: /profile 도 로그인 없이 열 수 있다(게스트 모드)", () => {
  assert.equal(isProtectedPath("/profile"), false);
  assert.equal(isProtectedPath("/recommend"), false);
});

test("게스트 한도를 다 쓰면 AI를 부르지 않고 게스트 안내가 붙은 기본 추천을 낸다", async () => {
  let asked = 0;
  const ask: Ask = async () => {
    asked++;
    throw new Error("부르면 안 된다");
  };
  const tr = (k: string) => k;
  const deps: Deps = {
    tr, tf: tr, pointLabel: (k) => k, contents: SAMPLE_CONTENTS, games: SAMPLE_GAMES, aiConfigured: true, ask,
    quotaInfo: { limit: 3, period: "day", notice: "guest_quota" },
    getQuota: async () => ({ used: 3, remaining: 0, nextReset: "2026-10-29T15:00:00.000Z" }),
    begin: async () => ({ existing: null }), recentRequests: async () => 0, todayCostUsd: async () => 0,
    addCostUsd: async () => {}, charge: async () => "charged", saveResult: async () => {},
  };
  const profile = profileSchema.parse({
    mode: "solo", strengths: ["talk"], persona: "", usesCam: true, audience: "m", devices: ["PC"], length: "single", timeSlot: "evening",
    goal: "both", hasCommunity: false, allowRotation: false, allowLeague: false, excludedGameIds: [], excludedGenres: [],
    avoidHorror: false, avoidMotionSickness: false, avoidSpoilers: false, includeTrend: true,
  });
  const r = await recommend(deps, profile, "00000000-0000-4000-8000-000000000001");
  assert.equal(asked, 0);
  assert.equal(r.source, "rule");
  assert.equal(r.notice, "guest_quota");
  assert.equal(r.quota?.period, "day");
  assert.equal(r.quota?.limit, 3);
});
