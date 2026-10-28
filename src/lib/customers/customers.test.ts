// 고객 현황 필터·CSV 규칙 시험. 실행: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { toCsv } from "./csv";
import { filtersToQuery, parseFilters, periodDays } from "./filters";

test("필터 읽기: 기본값 30일·최근 활동순·1페이지, 이상한 값은 무시", () => {
  const f = parseFilters({});
  assert.deepEqual([f.period, f.sort, f.dir, f.page, f.segment, f.source, f.guest], ["30", "last_active", "desc", 1, null, null, null]);
  const g = parseFilters({ segment: "hacker", source: "x", guest: "9", period: "999", sort: "name", dir: "up", page: "-3" });
  assert.deepEqual([g.period, g.sort, g.dir, g.page, g.segment, g.source, g.guest], ["30", "last_active", "desc", 1, null, null, null]);
});

test("필터 읽기: 유효한 값", () => {
  const f = parseFilters({ segment: "solo_undecided", source: "none", guest: "1", period: "all", sort: "recommend", dir: "asc", page: "3" });
  assert.equal(f.segment, "solo_undecided");
  assert.equal(f.guest, true);
  assert.equal(periodDays(f.period), null);
  assert.equal(periodDays("7"), 7);
  assert.equal(filtersToQuery(f), "?segment=solo_undecided&source=none&guest=1&period=all&sort=recommend&dir=asc&page=3");
  assert.equal(filtersToQuery(parseFilters({})), "");
  assert.equal(filtersToQuery(f, { page: 1 }).includes("page"), false);
});

test("CSV: BOM, 쉼표·따옴표 처리, 수식 문자로 시작하는 칸 무력화", () => {
  const csv = toCsv(["a", "b"], [["x,y", 'he said "hi"'], ["=SUM(A1)", "+1"], [null, 3]]);
  assert.ok(csv.startsWith("﻿a,b\r\n"));
  assert.ok(csv.includes('"x,y","he said ""hi"""'));
  assert.ok(csv.includes("'=SUM(A1),'+1"));
  assert.ok(csv.includes("\r\n,3\r\n"));
});

test("CSV 내보내기 열에는 개인정보 열이 없다", async () => {
  const src = (await import("node:fs")).readFileSync(new URL("../../app/api/admin/customers/route.ts", import.meta.url), "utf8");
  assert.equal(/email|phone|ip\b|user_id/i.test(src.replace(/short_id/g, "")), false);
});
