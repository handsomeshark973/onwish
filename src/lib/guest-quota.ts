// 게스트 하루 추천 횟수 계산(한국 시간 기준). DB·서버에 의존하지 않는 계산만 모아 시험할 수 있게 한다.
import { kstDate } from "./kst";

// 한국 오늘 0시(UTC 시각 문자열)
export const kstDayStart = (now: Date = new Date()): string => new Date(`${kstDate(now)}T00:00:00+09:00`).toISOString();
// 다음 한국 자정(한도가 다시 채워지는 때)
export const nextKstMidnight = (now: Date = new Date()): string => new Date(Date.parse(kstDayStart(now)) + 86400_000).toISOString();

export function guestQuota(used: number, limit: number, ipBlocked: boolean, now: Date = new Date()) {
  const remaining = ipBlocked ? 0 : Math.max(limit - used, 0);
  return { used, remaining, limit, nextReset: nextKstMidnight(now), period: "day" as const };
}
