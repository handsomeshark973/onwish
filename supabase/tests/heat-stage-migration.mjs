// 0007 시험: 적용 전후 단계별 게임 수 비교, 되돌리기, 다시 적용. 실행: npm run db:verify:heat
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
const P = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
const db = new PGlite();
await db.exec(`
create role anon; create role authenticated; create role service_role;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as \$\$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid \$\$;
`);
const sql = (f) => readFileSync(P + '/' + f, 'utf8');
for (const f of ['0001_schema', '0002_security', '0003_functions', '0004_ai_request_result', '0005_translations_and_rate_limit', '0006_game_videos']) await db.exec(sql(`migrations/${f}.sql`));

// 모든 단계 조합을 여러 개씩 넣는다: [stage, phase, popularity, evergreen, 개수]
const rows = [
  ['announced', 'upcoming', 'unknown', false, 2], ['playtest', 'launch_window', 'hot', false, 1], // 출시 전 판정이 우선
  ['released', 'launch_window', 'hot', false, 3], ['early_access', 'launch_window', 'hot', false, 1], // golden → rising
  ['released', 'post_launch', 'hot', false, 4], // hot → peak
  ['released', 'post_launch', 'cooling', false, 2], ['released', 'launch_window', 'cooling', false, 1],
  ['released', 'post_launch', 'evergreen', false, 2], ['released', 'post_launch', 'hot', true, 1], // evergreen
  ['released', 'post_launch', 'unknown', false, 2], // null
];
let n = 0;
for (const [stage, phase, pop, ev, count] of rows) for (let i = 0; i < count; i++)
  await db.exec(`insert into games (slug, name, developer, stage, release_phase, popularity_status, evergreen_confirmed, approval_status) values ('g${n++}', 'g${n}', 'x', '${stage}', '${phase}', '${pop}', ${ev}, 'approved')`);

const count = async () => Object.fromEntries((await db.query(sql('ops/heat-stage-count.sql'))).rows.map((r) => [r.stage, Number(r.games)]));
let fails = 0;
const ok = (name, cond, extra = '') => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? ' ' + extra : '')); if (!cond) fails++; };
const same = (a, b) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());

const before = await count();
console.log('적용 전', JSON.stringify(before));
ok('전체 게임 수', Object.values(before).reduce((a, b) => a + b, 0) === n, `n=${n}`);

await db.exec(sql('migrations/0007_heat_stage_rename.sql'));
const after = await count();
console.log('적용 후', JSON.stringify(after));
ok('golden 수 = rising 수', before.golden === after.rising && after.rising === 4, `${before.golden} → ${after.rising}`);
ok('hot 수 = peak 수', before.hot === after.peak && after.peak === 4, `${before.hot} → ${after.peak}`);
ok('옛 키가 남지 않음', !('golden' in after) && !('hot' in after));
for (const k of ['upcoming', 'cooling', 'evergreen', '(인기 확인 필요)']) ok(`${k} 수 불변`, before[k] === after[k], `${before[k]}`);
ok('저장된 데이터 불변(popularity_status hot 개수)', (await db.query("select count(*)::int n from games where popularity_status = 'hot'")).rows[0].n === 10);

await db.exec(sql('migrations-down/0007_heat_stage_rename.down.sql'));
ok('되돌리면 처음과 같음', same(await count(), before));
await db.exec(sql('migrations/0007_heat_stage_rename.sql'));
ok('다시 적용해도 같음(여러 번 실행 가능)', same(await count(), after));
console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); process.exit(fails ? 1 : 0);
