import { normalizeHeatStage } from "@/types/taxonomy";
import type { RecommendResult } from "./types";

// 저장해 둔 추천 결과(saved_recommendations, ai_requests의 JSON)에는 단계 이름 변경 전 키(golden, hot)가 남아 있을 수 있다.
// 데이터는 그대로 두고 읽을 때 새 키로 바꾼다. 새 값은 그대로 통과한다.
export function normalizePick<T extends { heatStage?: unknown }>(pick: T): T {
  return { ...pick, heatStage: normalizeHeatStage(pick.heatStage) };
}

export function normalizeResult(result: RecommendResult): RecommendResult {
  return { ...result, picks: (result.picks ?? []).map(normalizePick) };
}
