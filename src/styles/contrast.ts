import { readFileSync } from "node:fs";
import { join } from "node:path";

// tokens.css를 읽어서 다크·라이트 색 조합의 명암비(WCAG)를 계산한다. /dev/tokens와 npm run tokens:check가 같이 쓴다.
export type Theme = "dark" | "light";
export type Row = { theme: Theme; fg: string; bg: string; fgHex: string; bgHex: string; ratio: number; min: number; pass: boolean };

const FILE = join(process.cwd(), "src/styles/tokens.css");

function vars(block: string) {
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/(--[\w-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

// 블록 본문 추출: "선택자 {" 뒤부터 짝이 맞는 "}"까지
function block(css: string, start: string) {
  const i = css.indexOf(start);
  if (i < 0) throw new Error(`tokens.css에서 ${start} 를 찾지 못했습니다`);
  const open = css.indexOf("{", i);
  let depth = 0;
  for (let j = open; j < css.length; j++) {
    if (css[j] === "{") depth++;
    if (css[j] === "}" && --depth === 0) return css.slice(open + 1, j);
  }
  throw new Error("중괄호 짝이 맞지 않습니다");
}

export function loadThemes() {
  const css = readFileSync(FILE, "utf8");
  const dark = vars(block(css, ":root {"));
  const light = vars(block(css, ':root[data-theme="light"]'));
  const lightMedia = vars(block(block(css, "@media (prefers-color-scheme: light)"), ":root:not([data-theme])"));
  return { dark, light, lightMedia };
}

function lum(hex: string) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function ratio(a: string, b: string) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const SURFACES = ["--bg", "--surface", "--surface-2"];
const TEXT_ON_SURFACES = ["--text", "--text-muted", "--accent", "--appeal-visual", "--appeal-audio", "--appeal-av", "--stage-upcoming", "--stage-golden", "--stage-hot", "--stage-cooling", "--stage-evergreen", "--size-solo", "--size-small", "--size-large", "--danger", "--success"];

export function contrastRows(): Row[] {
  const t = loadThemes();
  const rows: Row[] = [];
  for (const theme of ["dark", "light"] as const) {
    const v = t[theme];
    const add = (fg: string, bg: string, min: number) => {
      const r = ratio(v[fg], v[bg]);
      rows.push({ theme, fg, bg, fgHex: v[fg], bgHex: v[bg], ratio: r, min, pass: r >= min });
    };
    for (const fg of TEXT_ON_SURFACES) for (const bg of SURFACES) add(fg, bg, 4.5);
    add("--on-accent", "--accent", 4.5);
    // 글자가 아닌 것(포커스 링)은 3:1
    for (const bg of SURFACES) add("--accent", bg, 3);
  }
  return rows;
}

// 라이트 값이 두 곳에서 어긋나면 오류 목록을 돌려준다
export function lightMismatches() {
  const { light, lightMedia } = loadThemes();
  const keys = new Set([...Object.keys(light), ...Object.keys(lightMedia)]);
  return [...keys].filter((k) => light[k] !== lightMedia[k]);
}

// 다크에 있는 색 토큰이 라이트에도 있는지(이름 일치)
export function missingInLight() {
  const { dark, light } = loadThemes();
  const same = new Set(["--font-display", "--font-body"]);
  return Object.keys(dark).filter((k) => /^--(bg|surface|surface-2|text|text-muted|line|accent|on-accent|scrim|appeal-|stage-|size-|danger|success|shadow-)/.test(k) && !same.has(k) && !(k in light));
}
