import { SEGMENTS, type Segment } from "@/config/customerTypes";

// 관리자 고객 현황의 주소(쿼리) 읽기. 알 수 없는 값은 무시하고 기본값을 쓴다.
export const PERIODS = ["7", "30", "90", "all"] as const;
export type Period = (typeof PERIODS)[number];
export const PAGE_SIZE = 50;

export type CustomerFilters = {
  segment: Segment | null;
  source: "self" | "inferred" | "none" | null;
  guest: boolean | null;
  period: Period;
  sort: "last_active" | "recommend";
  dir: "asc" | "desc";
  page: number;
};

type Sp = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function parseFilters(sp: Sp): CustomerFilters {
  const seg = one(sp.segment);
  const src = one(sp.source);
  const g = one(sp.guest);
  const per = one(sp.period);
  const page = Number.parseInt(one(sp.page) ?? "1", 10);
  return {
    segment: (SEGMENTS as readonly string[]).includes(seg ?? "") ? (seg as Segment) : null,
    source: src === "self" || src === "inferred" || src === "none" ? src : null,
    guest: g === "1" ? true : g === "0" ? false : null,
    period: (PERIODS as readonly string[]).includes(per ?? "") ? (per as Period) : "30",
    sort: one(sp.sort) === "recommend" ? "recommend" : "last_active",
    dir: one(sp.dir) === "asc" ? "asc" : "desc",
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 100000) : 1,
  };
}

export const periodDays = (p: Period): number | null => (p === "all" ? null : Number(p));

// 필터를 다시 주소로 만든다(기본값은 생략). overrides로 일부만 바꾼다.
export function filtersToQuery(f: CustomerFilters, overrides: Partial<Record<keyof CustomerFilters, unknown>> = {}): string {
  const m = { ...f, ...overrides } as CustomerFilters;
  const q = new URLSearchParams();
  if (m.segment) q.set("segment", m.segment);
  if (m.source) q.set("source", m.source);
  if (m.guest !== null) q.set("guest", m.guest ? "1" : "0");
  if (m.period !== "30") q.set("period", m.period);
  if (m.sort !== "last_active") q.set("sort", m.sort);
  if (m.dir !== "desc") q.set("dir", m.dir);
  if (m.page > 1) q.set("page", String(m.page));
  const s = q.toString();
  return s ? `?${s}` : "";
}
