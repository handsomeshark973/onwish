import assert from "node:assert/strict";
import test from "node:test";
import { contrastRows, loadThemes } from "./contrast";

// 색 차이(CIE76 ΔE). 단계 배지끼리 눈으로 구분되는지 본다(글자도 함께 쓰므로 보조 기준).
function lab(hex: string): [number, number, number] {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, Y = 0.2126 * r + 0.7152 * g + 0.0722 * b, Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
const dE = (a: string, b: string) => Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]) as [number, number, number]);

const STAGES = ["--stage-upcoming", "--stage-rising", "--stage-peak", "--stage-cooling", "--stage-evergreen"];
const OTHER_BADGES = ["--appeal-visual", "--appeal-audio", "--appeal-av", "--size-solo", "--size-small", "--size-large"];

test("옛 단계 토큰 이름이 남아 있지 않다", () => {
  const t = loadThemes();
  for (const theme of [t.dark, t.light, t.lightMedia]) {
    assert.ok(!("--stage-golden" in theme) && !("--stage-hot" in theme));
    for (const k of STAGES) assert.ok(k in theme, k);
  }
});

test("단계 배지 5개는 다크·라이트 모두 글자 대비 4.5:1 이상", () => {
  const rows = contrastRows().filter((r) => STAGES.includes(r.fg));
  assert.equal(rows.length, STAGES.length * 3 * 2);
  assert.ok(rows.every((r) => r.pass));
});

test("바꾼 두 단계 색(뜨는 중·골든타임)은 다른 모든 배지 색과 확실히 다르다(ΔE 10 이상)", () => {
  const t = loadThemes();
  const changed = ["--stage-rising", "--stage-peak"];
  const others = [...STAGES, ...OTHER_BADGES];
  for (const [name, v] of [["dark", t.dark], ["light", t.light]] as const)
    for (const c of changed)
      for (const o of others) {
        if (o === c) continue;
        assert.ok(dE(v[c], v[o]) >= 10, `${name} ${c} vs ${o} = ${dE(v[c], v[o]).toFixed(1)}`);
      }
});
