import { HEAT_STAGES, normalizeHeatStage } from "@/types/taxonomy";

// 레이더 주소의 단계 필터: ?stage=rising,peak (쉼표로 여러 개). "unknown"은 인기 확인 필요.
// 단계 이름 변경 전 주소(?stage=golden, ?stage=hot)도 새 키로 읽는다.
const VALID = new Set<string>([...HEAT_STAGES, "unknown"]);

export function parseStageParam(value: string | null | undefined): string[] {
  if (!value) return [];
  const out: string[] = [];
  for (const raw of value.split(",")) {
    const v = raw.trim();
    const key = VALID.has(v) ? v : normalizeHeatStage(v); // 옛 키는 매핑대로(golden→rising, hot→peak)
    if (key && !out.includes(key)) out.push(key);
  }
  return out;
}

export const stageParamValue = (stages: string[]): string => stages.join(",");

// 옛 키가 들어 있는 주소를 새 주소로 바꾼다. 바꿀 것이 없으면 null(리다이렉트 불필요).
// 단계 값만 새 키로 고치고 다른 쿼리와 순서는 그대로 둔다.
export function legacyStageRedirect(search: URLSearchParams): URLSearchParams | null {
  const value = search.get("stage");
  if (!value) return null;
  const hasLegacy = value.split(",").some((v) => ["golden", "hot"].includes(v.trim()));
  if (!hasLegacy) return null;
  const next = new URLSearchParams(search);
  next.set("stage", stageParamValue(parseStageParam(value)));
  return next;
}
