// CSV 만들기. 엑셀이 한글을 바로 읽도록 맨 앞에 BOM을 붙이고, 수식으로 읽힐 수 있는 칸(= + - @ 로 시작)은 앞에 ' 를 붙여 막는다.
const cell = (v: string | number | null | undefined) => {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  return "﻿" + [headers, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}
