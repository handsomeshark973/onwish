"use client";

import { useLocale, useTranslations } from "next-intl";
import { daysUntil } from "@/lib/kst";
import { useReady } from "@/lib/use-ready";

// 곧 출시 일정의 날짜 블록: 월 · 일(크게) · 연도와 요일 · 출시 D-n. 날짜가 없으면 "날짜 미정" 블록.
// 월·요일은 날짜 문자열(yyyy-mm-dd)을 UTC로 해석해 서버와 브라우저가 같은 글자를 만든다.
// D-day는 "지금"에 따라 달라지므로 화면이 뜬 뒤(브라우저)에 한국 날짜 기준으로 채운다(서버 렌더와 어긋나지 않게).
export function TimelineDate({ date }: { date: string | null }) {
  const t = useTranslations("radar");
  const locale = useLocale();
  const ready = useReady(); // 서버 렌더와 첫 화면에서는 false, 브라우저에서 뜬 뒤 true
  const n = ready && date ? daysUntil(date) : null;

  if (!date) {
    return (
      <div className="ow-timeline-date ow-timeline-date-tbd">
        <span className="ow-date-day">?</span>
        <span className="ow-date-sub">{t("dateTbd")}</span>
      </div>
    );
  }
  const d = new Date(`${date}T00:00:00Z`);
  const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { ...o, timeZone: "UTC" }).format(d);
  return (
    <time className="ow-timeline-date" dateTime={date}>
      <span className="ow-date-month">{fmt({ month: "short" })}</span>
      <span className="ow-date-day">{d.getUTCDate()}</span>
      <span className="ow-date-sub">{d.getUTCFullYear()} · {fmt({ weekday: "short" })}</span>
      <span className="ow-date-dday">{n === null ? "\u00a0" : n === 0 ? t("today") : n > 0 ? t("dday", { n }) : ""}</span>
    </time>
  );
}
