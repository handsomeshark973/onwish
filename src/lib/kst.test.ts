import assert from "node:assert/strict";
import test from "node:test";
import { daysUntil, kstDate } from "./kst";

test("한국 날짜: UTC 20시(한국 다음 날 5시)는 한국 날짜로 다음 날이다", () => {
  assert.equal(kstDate(new Date("2026-10-26T20:00:00Z")), "2026-10-27");
  assert.equal(kstDate(new Date("2026-10-26T14:59:59Z")), "2026-10-26");
  assert.equal(kstDate(new Date("2026-10-26T15:00:00Z")), "2026-10-27");
});

test("D-day: 한국 0~9시에도 하루 어긋나지 않는다", () => {
  const koreaEarlyMorning = new Date("2026-10-26T20:00:00Z"); // 한국 2026-10-27 05:00 (UTC 날짜로는 10-26)
  assert.equal(daysUntil("2026-10-27", koreaEarlyMorning), 0);
  assert.equal(daysUntil("2026-11-19", koreaEarlyMorning), 23);
  const afternoon = new Date("2026-10-27T05:00:00Z"); // 한국 14:00
  assert.equal(daysUntil("2026-11-19", afternoon), 23);
  assert.equal(daysUntil("2026-10-20", afternoon), -7);
});
