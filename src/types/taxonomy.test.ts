import assert from "node:assert/strict";
import test from "node:test";
import { mapGame } from "../lib/data/mappers";
import { legacyStageRedirect, parseStageParam } from "../lib/stage-query";
import { normalizePick, normalizeResult } from "../lib/recommend/normalize";
import type { RecommendResult } from "../lib/recommend/types";
import { profileSchema } from "../lib/recommend/schema";
import { DEVICES, FLOW_STAGES, HEAT_STAGES, isTrendStage, normalizeHeatStage, TAXONOMY_KEYS, TREND_STAGES } from "./taxonomy";

test("단계 순서: 곧 출시 → 뜨는 중 → 골든타임 → 식는 중 → 상시", () => {
  assert.deepEqual([...HEAT_STAGES], ["upcoming", "rising", "peak", "cooling", "evergreen"]);
  assert.deepEqual([...FLOW_STAGES], ["upcoming", "rising", "peak", "cooling"]);
  assert.deepEqual([...TAXONOMY_KEYS.stage], [...HEAT_STAGES]);
  assert.deepEqual([...TREND_STAGES], ["rising", "peak"]);
});

test("임시 호환: 옛 키는 키 매핑대로(문자열 '골든타임' 기준이 아님) golden→rising, hot→peak", () => {
  assert.equal(normalizeHeatStage("golden"), "rising");
  assert.equal(normalizeHeatStage("hot"), "peak");
  for (const k of HEAT_STAGES) assert.equal(normalizeHeatStage(k), k); // 새 키는 그대로
  assert.equal(normalizeHeatStage(null), null);
  assert.equal(normalizeHeatStage("unknown"), null);
  assert.equal(normalizeHeatStage(undefined), null);
});

test("트렌드 단계: rising·peak만", () => {
  assert.equal(isTrendStage("rising"), true);
  assert.equal(isTrendStage("peak"), true);
  for (const k of ["upcoming", "cooling", "evergreen", null]) assert.equal(isTrendStage(k as never), false);
});

test("게임 읽기: DB가 옛 키를 줘도 새 키로 읽는다", () => {
  const row = { id: "1", slug: "x", name: "X", developer: "d", formats: [] };
  assert.equal(mapGame({ ...row, heat_stage: "golden" }).heatStage, "rising");
  assert.equal(mapGame({ ...row, heat_stage: "hot" }).heatStage, "peak");
  assert.equal(mapGame({ ...row, heat_stage: "rising" }).heatStage, "rising");
  assert.equal(mapGame({ ...row, heat_stage: null }).heatStage, null);
});

test("저장된 추천 결과: 읽을 때 변환, 다른 값은 그대로", () => {
  assert.equal(normalizePick({ title: "a", heatStage: "golden" }).heatStage, "rising");
  assert.equal(normalizePick({ title: "a", heatStage: "hot" }).heatStage, "peak");
  assert.equal(normalizePick({ title: "a", heatStage: null }).title, "a");
  const r = normalizeResult({ picks: [{ heatStage: "hot" }, { heatStage: "peak" }, { heatStage: null }] } as unknown as RecommendResult);
  assert.deepEqual(r.picks.map((p) => p.heatStage), ["peak", "peak", null]);
});

test("레이더 단계 주소: 새 키는 그대로, 옛 키는 새 키로 읽는다", () => {
  assert.deepEqual(parseStageParam("rising"), ["rising"]);
  assert.deepEqual(parseStageParam("rising,peak,unknown"), ["rising", "peak", "unknown"]);
  assert.deepEqual(parseStageParam("golden"), ["rising"]);
  assert.deepEqual(parseStageParam("hot"), ["peak"]);
  assert.deepEqual(parseStageParam("golden,hot,peak"), ["rising", "peak"]); // 중복 제거
  assert.deepEqual(parseStageParam("nope,,cooling"), ["cooling"]); // 모르는 값은 버림
  assert.deepEqual(parseStageParam(null), []);
});

test("레이더 옛 링크 리다이렉트: golden→rising, hot→peak, 나머지 쿼리 유지, 새 링크는 그대로", () => {
  const r = (q: string) => legacyStageRedirect(new URLSearchParams(q))?.toString().replace(/%2C/gi, ",") ?? null;
  assert.equal(r("stage=golden"), "stage=rising");
  assert.equal(r("stage=hot"), "stage=peak");
  assert.equal(r("stage=golden,hot"), "stage=rising,peak");
  assert.equal(r("a=1&stage=hot&b=2"), "a=1&stage=peak&b=2");
  assert.equal(r("stage=rising"), null);
  assert.equal(r("stage=peak,cooling"), null);
  assert.equal(r("a=1"), null);
});

test("기기 값: XBOX 포함, 프로필 검증도 같은 목록을 쓴다", () => {
  assert.deepEqual([...DEVICES], ["PC", "PS5", "XBOX", "SWITCH", "VR"]);
  assert.equal(profileSchema.shape.devices.safeParse(["XBOX", "PS5"]).success, true);
  assert.equal(profileSchema.shape.devices.safeParse(["N64"]).success, false);
});
