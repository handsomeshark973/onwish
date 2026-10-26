import { useTranslations } from "next-intl";

type Props = {
  values: (number | null)[]; // 결측은 null. 0으로 바꾸지 않고 선을 끊는다
  label: string; // 예: "Steam 동시접속 최근 30일"
  width?: number;
  height?: number;
};

// 지표 추이 미니 차트. 값이 하나도 없으면 "지표 없음"을 보여 준다.
export function MiniChart({ values, label, width = 120, height = 36 }: Props) {
  const t = useTranslations("game.chart");
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length < 2) {
    return (
      <span className="ow-chart-empty" role="img" aria-label={`${label}: ${t("none")}`}>
        {t("none")}
      </span>
    );
  }
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const pad = 3;
  const step = (width - pad * 2) / (values.length - 1);
  const y = (v: number) => height - pad - ((v - min) / span) * (height - pad * 2);

  let d = "";
  let pen = false;
  values.forEach((v, i) => {
    if (v === null) {
      pen = false;
      return;
    }
    d += `${pen ? "L" : "M"}${(pad + i * step).toFixed(1)} ${y(v).toFixed(1)} `;
    pen = true;
  });

  const first = nums[0];
  const last = nums[nums.length - 1];
  const trend = last > first ? t("up") : last < first ? t("down") : t("flat");

  return (
    <svg className="ow-chart" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${label}: ${trend}`}>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
