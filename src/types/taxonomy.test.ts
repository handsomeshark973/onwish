import assert from "node:assert/strict";
import test from "node:test";
import { mapGame } from "../lib/data/mappers";
import { normalizePick, normalizeResult } from "../lib/recommend/normalize";
import type { RecommendResult } from "../lib/recommend/types";
import { FLOW_STAGES, HEAT_STAGES, isTrendStage, normalizeHeatStage, TAXONOMY_KEYS, TREND_STAGES } from "./taxonomy";

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
