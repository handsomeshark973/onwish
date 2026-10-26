type T = (key: string, values?: Record<string, string | number>) => string;

// 인원 표기. 값이 없으면 지어내지 않고 "확인 필요"를 보여 준다. t는 messages의 format 묶음.
export function formatPlayers(p: { min: number | null; max: number | null; fixed?: boolean | null }, t: T): string {
  if (p.min === null && p.max === null) return t("unknown");
  if (p.fixed && p.min !== null) return t("exact", { n: p.min });
  if (p.min !== null && p.max !== null) return p.min === p.max ? t("same", { n: p.min }) : t("range", { min: p.min, max: p.max });
  if (p.min !== null) return t("atLeast", { n: p.min });
  return t("atMost", { n: p.max as number });
}
