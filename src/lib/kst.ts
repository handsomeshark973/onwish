// 한국 시간(Asia/Seoul) 기준 날짜. 서버는 UTC로 돌아서 new Date()를 그대로 자르면 한국 0~9시에 하루 어긋난다.
const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" });

// 지금(또는 now)의 한국 날짜 yyyy-mm-dd
export const kstDate = (now: Date = new Date()): string => fmt.format(now);

// 한국 오늘부터 date(yyyy-mm-dd)까지 남은 일수. 오늘이면 0, 지났으면 음수.
export function daysUntil(date: string, now: Date = new Date()): number {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${kstDate(now)}T00:00:00Z`)) / 86400000);
}
