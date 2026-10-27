import assert from "node:assert/strict";
import test from "node:test";
import { findStaleUpcoming } from "./stale-upcoming";

const g = (id: string, release_phase = "upcoming", stage = "announced") => ({ id, name: id, release_phase, stage });

test("단계 갱신 필요: 곧 출시인데 일정이 모두 지난 게임만", () => {
  const games = [g("past"), g("future"), g("mixed"), g("none"), g("released", "post_launch", "released"), g("playtest", "launch_window", "playtest")];
  const dates = [
    { game_id: "past", date: "2026-11-19" },
    { game_id: "future", date: "2026-12-01" },
    { game_id: "mixed", date: "2026-11-01" }, { game_id: "mixed", date: "2027-01-01" },
    { game_id: "released", date: "2026-01-01" },
    { game_id: "playtest", date: "2026-11-20" },
  ];
  const r = findStaleUpcoming(games, dates, "2026-11-25");
  assert.deepEqual(r.map((x) => [x.id, x.daysSince]), [["past", 6], ["playtest", 5]]); // 일정 없음·남은 일정 있음·이미 출시는 제외
});

test("출시 당일에는 아직 갱신 대상이 아니다(날짜가 지나야 한다)", () => {
  assert.deepEqual(findStaleUpcoming([g("a")], [{ game_id: "a", date: "2026-11-19" }], "2026-11-19"), []);
  assert.equal(findStaleUpcoming([g("a")], [{ game_id: "a", date: "2026-11-19" }], "2026-11-20").length, 1);
});
