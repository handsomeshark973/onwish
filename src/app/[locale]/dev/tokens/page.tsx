import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppealBadge, SizeBadge, StageBadge } from "@/components/ui/Badge";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { contrastRows, loadThemes } from "@/styles/contrast";
import "./preview.css";

export const metadata: Metadata = { title: "토큰 확인" };

const COLOR_GROUPS: Record<string, string[]> = {
  "바탕·글자": ["--bg", "--surface", "--surface-2", "--text", "--text-muted", "--line", "--accent", "--on-accent"],
  "어필 배지": ["--appeal-visual", "--appeal-audio", "--appeal-av"],
  "단계 배지": ["--stage-upcoming", "--stage-golden", "--stage-hot", "--stage-cooling", "--stage-evergreen"],
  "인원 규모 배지": ["--size-solo", "--size-small", "--size-large"],
  "상태": ["--danger", "--success"],
};
const TYPE = [
  ["display", "--fs-display", "--fw-heavy"],
  ["h1", "--fs-h1", "--fw-bold"],
  ["h2", "--fs-h2", "--fw-bold"],
  ["h3", "--fs-h3", "--fw-semibold"],
  ["body", "--fs-body", "--fw-regular"],
  ["caption", "--fs-caption", "--fw-regular"],
];
const SPACES = [1, 2, 3, 4, 5, 6, 7, 8];

// 개발 중 토큰을 한눈에 보는 화면. 배포(production)에서는 열리지 않는다.
export default function TokensPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const themes = loadThemes();
  const rows = contrastRows();
  const failed = rows.filter((r) => !r.pass).length;
  return (
    <>
      <h1 className="ow-h1">디자인 토큰 확인</h1>
      <p>값은 src/styles/tokens.css 한 곳에서만 정합니다. 아래 버튼으로 다크·라이트·시스템을 바꿔 가며 확인하세요.</p>
      <div className="tk-row"><ThemeToggle /></div>

      <h2 className="ow-h2">색</h2>
      {Object.entries(COLOR_GROUPS).map(([group, names]) => (
        <section key={group}>
          <h3 className="ow-h3">{group}</h3>
          <div className="tk-grid">
            {names.map((n) => (
              <div className="tk-swatch" key={n}>
                <div className="tk-chip" style={{ background: `var(${n})` }} />
                <div className="tk-meta">
                  <code>{n}</code>
                  <span>다크 {themes.dark[n]}</span>
                  <span>라이트 {themes.light[n]}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <h2 className="ow-h2">배지(색 + 글자)</h2>
      <div className="tk-row">
        <AppealBadge appeal="visual" /><AppealBadge appeal="audio" /><AppealBadge appeal="audiovisual" />
      </div>
      <div className="tk-row">
        <StageBadge stage="upcoming" /><StageBadge stage="golden" /><StageBadge stage="hot" /><StageBadge stage="cooling" /><StageBadge stage="evergreen" />
      </div>
      <div className="tk-row">
        <SizeBadge size="s" /><SizeBadge size="m" /><SizeBadge size="l" />
      </div>

      <h2 className="ow-h2">글자 크기</h2>
      {TYPE.map(([name, size, weight]) => (
        <p key={name} style={{ fontSize: `var(${size})`, fontWeight: `var(${weight})`, lineHeight: "var(--lh-heading)", margin: 0 }}>
          {name} · 오늘 어떤 방송을 할까요? Today&apos;s stream <code>{size}</code>
        </p>
      ))}

      <h2 className="ow-h2">간격(4px 단위)</h2>
      {SPACES.map((n) => (
        <div className="tk-row" key={n}>
          <code style={{ width: "8rem" }}>--space-{n}</code>
          <div className="tk-bar" style={{ width: `var(--space-${n})` }} />
        </div>
      ))}

      <h2 className="ow-h2">모서리·그림자</h2>
      <div className="tk-row">
        {["--radius-sm", "--radius-md", "--radius-pill"].map((r) => (
          <div className="tk-box" key={r} style={{ borderRadius: `var(${r})` }}>{r}</div>
        ))}
        {["--shadow-1", "--shadow-2"].map((s) => (
          <div className="tk-box" key={s} style={{ boxShadow: `var(${s})`, borderRadius: "var(--radius-sm)" }}>{s}</div>
        ))}
      </div>

      <h2 className="ow-h2">명암비 표(글자 4.5:1, 포커스 링 3:1)</h2>
      <p>조합 {rows.length}개 중 기준 미달 <strong className={failed ? "tk-fail" : "tk-pass"}>{failed}개</strong>. 계산은 tokens.css를 직접 읽습니다.</p>
      <div className="tk-scroll">
        <table className="tk-table">
          <thead>
            <tr><th>테마</th><th>글자색</th><th>배경</th><th>명암비</th><th>기준</th><th>결과</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.theme === "dark" ? "다크" : "라이트"}</td>
                <td><code>{r.fg}</code> {r.fgHex}</td>
                <td><code>{r.bg}</code> {r.bgHex}</td>
                <td>{r.ratio.toFixed(2)}</td>
                <td>{r.min}:1</td>
                <td className={r.pass ? "tk-pass" : "tk-fail"}>{r.pass ? "통과" : "미달"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
