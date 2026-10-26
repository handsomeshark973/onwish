import { contrastRows, lightMismatches, missingInLight } from "../src/styles/contrast";

const rows = contrastRows();
const fails = rows.filter((r) => !r.pass);
for (const r of rows) console.log(`${r.pass ? "OK  " : "FAIL"} ${r.theme.padEnd(5)} ${r.fg} on ${r.bg}  ${r.ratio.toFixed(2)} (기준 ${r.min})`);
const mm = lightMismatches();
const miss = missingInLight();
if (mm.length) console.log("라이트 값이 두 곳에서 다름:", mm.join(", "));
if (miss.length) console.log("라이트에 없는 색 토큰:", miss.join(", "));
console.log(`\n조합 ${rows.length}개 중 실패 ${fails.length}개`);
process.exit(fails.length || mm.length || miss.length ? 1 : 0);
