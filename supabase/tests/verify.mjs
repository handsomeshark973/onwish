// DB 틀 검증: 임시 Postgres(PGlite)에 SQL을 올려 권한·이용량 차감·월 경계를 점검한다. 실행: npm run db:verify
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
const P = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
const db = new PGlite();
const A='00000000-0000-0000-0000-00000000000a', B='00000000-0000-0000-0000-00000000000b';
await db.exec(`
create role anon; create role authenticated; create role service_role;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as \$\$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid \$\$;
grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
insert into auth.users values ('${A}'), ('${B}');
`);
for (const f of ['0001_schema.sql','0002_security.sql','0003_functions.sql','0004_ai_request_result.sql','0005_translations_and_rate_limit.sql','0006_game_videos.sql','0007_heat_stage_rename.sql','0008_device_xbox.sql']) await db.exec(readFileSync(P+'/migrations/'+f,'utf8'));
await db.exec(readFileSync(P+'/seed.sql','utf8'));
await db.exec(`grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated;`);
// 위 grant가 execute를 열어 버리므로 0003의 revoke를 다시 적용해 실제 배포 상태와 같게 만든다
await db.exec(`revoke all on function get_ai_quota(uuid,int), charge_ai_quota(uuid,uuid,int,int), add_ai_cost(numeric) from public, anon, authenticated;
grant execute on function get_ai_quota(uuid,int), charge_ai_quota(uuid,uuid,int,int), add_ai_cost(numeric) to service_role;`);
let fails = 0;
const ok = (name, cond, extra='') => { console.log((cond?'PASS':'FAIL')+' '+name+(extra?' '+extra:'')); if(!cond) fails++; };
const as = async (role, uid, sql) => { await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub','${uid??''}',false);`); try { return await db.query(sql); } finally { await db.exec('reset role'); } };
const rejects = async (role, uid, sql) => { try { await as(role, uid, sql); return false; } catch(e){ return e.message; } };

// 1. 미검수 게임은 공개 안 됨
let r = await as('anon', null, 'select count(*)::int n from games'); ok('anon: 미검수 게임 0개', r.rows[0].n===0);
r = await as('anon', null, 'select count(*)::int n from game_formats'); ok('anon: 미검수 진행 방식 0개', r.rows[0].n===0);
r = await as('anon', null, 'select count(*)::int n from game_sources'); ok('anon: 미검수 출처 0개', r.rows[0].n===0);
await db.exec("update games set approval_status='approved' where slug='bombanana'");
r = await as('anon', null, 'select count(*)::int n from games'); ok('승인 후 anon: 게임 1개', r.rows[0].n===1);
r = await as('anon', null, 'select count(*)::int n from game_formats'); ok('승인된 게임의 pending 진행 방식은 안 보임', r.rows[0].n===0);
r = await db.query("select count(*)::int n from review_log where entity_type='game'"); ok('승인 변경 이력 기록', r.rows[0].n>=3, 'n='+r.rows[0].n);
// 2. 쓰기 권한
ok('anon: 게임 수정 불가', (await as('anon', null, "update games set name='x' returning 1")).rows.length===0);
ok('일반 사용자: 게임 수정 불가', (await as('authenticated', A, "update games set name='x' returning 1")).rows.length===0);
// 3. 프로필 본인만
await as('authenticated', A, "insert into streamer_profiles (user_id, mode, audience) values ('"+A+"','small','m')");
r = await as('authenticated', B, 'select count(*)::int n from streamer_profiles'); ok('B는 A 프로필 못 봄', r.rows[0].n===0);
ok('B는 A 이름으로 프로필 생성 불가', !!(await rejects('authenticated', B, "insert into streamer_profiles (user_id, mode, audience) values ('"+A+"','solo','s')")));
ok('프로필 members 배열 아님 거부', !!(await rejects('authenticated', A, "update streamer_profiles set members='{}'::jsonb")));
// 4. 함수 접근
ok('authenticated는 charge_ai_quota 실행 불가', !!(await rejects('authenticated', A, "select charge_ai_quota('"+A+"', gen_random_uuid(), 3, 5)")));
// 5. 이용량 차감
const q = async (sql) => (await as('service_role', null, sql)).rows[0];
const R1='11111111-1111-1111-1111-111111111111';
ok('첫 차감 charged', (await q(`select charge_ai_quota('${A}','${R1}',3,5) r`)).r==='charged');
ok('같은 요청 재전송은 already_charged', (await q(`select charge_ai_quota('${A}','${R1}',3,5) r`)).r==='already_charged');
ok('used = 1', (await q(`select used from get_ai_quota('${A}',5)`)).used===1);
ok('카드 2개는 not_charged', (await q(`select charge_ai_quota('${A}',gen_random_uuid(),2,5) r`)).r==='not_charged');
ok('카드 0개는 not_charged', (await q(`select charge_ai_quota('${A}',gen_random_uuid(),0,5) r`)).r==='not_charged');
ok('여전히 used = 1', (await q(`select used from get_ai_quota('${A}',5)`)).used===1);
for (let i=0;i<4;i++) await q(`select charge_ai_quota('${A}',gen_random_uuid(),3,5)`);
ok('5회 후 used = 5, remaining = 0', JSON.stringify(await q(`select used, remaining from get_ai_quota('${A}',5)`))==='{"used":5,"remaining":0}');
ok('6번째는 limit_reached', (await q(`select charge_ai_quota('${A}',gen_random_uuid(),3,5) r`)).r==='limit_reached');
ok('한도 후 used 그대로 5', (await q(`select used from get_ai_quota('${A}',5)`)).used===5);
ok('다른 사용자의 request_id 도용 차단', !!(await rejects('service_role', null, `select charge_ai_quota('${B}','${R1}',3,5)`)));
// 6. 한국 시간 월 경계
ok('KST 월 경계: 10/31 14:59 UTC = 10월', (await q("select kst_month_key('2026-10-31 14:59:59+00') k")).k==='2026-10');
ok('KST 월 경계: 10/31 15:00 UTC = 11월', (await q("select kst_month_key('2026-10-31 15:00:00+00') k")).k==='2026-11');
// 7. 비용
ok('일일 비용 누적', Number((await q('select add_ai_cost(1.5) c')).c)===1.5 && Number((await q('select add_ai_cost(0.5) c')).c)===2);
ok('authenticated는 ai_daily_cost 못 읽음', (await as('authenticated', A, 'select * from ai_daily_cost')).rows.length===0);
// 8. 오류 신고
await as('authenticated', A, "insert into error_reports (reporter_id, target_type, message) values ('"+A+"','game','인원이 달라요')");
ok('타인 이름으로 신고 불가', !!(await rejects('authenticated', A, "insert into error_reports (reporter_id, target_type, message) values ('"+B+"','game','x')")));
ok('anon 신고 불가', !!(await rejects('anon', null, "insert into error_reports (reporter_id, target_type, message) values (null,'game','x')")));
ok('B는 A 신고 못 봄', (await as('authenticated', B, 'select * from error_reports')).rows.length===0);
ok('일반 사용자는 신고 상태 변경 불가', (await as('authenticated', A, "update error_reports set status='resolved' returning 1")).rows.length===0);
// 9. 관리자
await db.exec("insert into app_admins values ('"+B+"')");
ok('관리자는 미검수 게임도 봄', (await as('authenticated', B, 'select count(*)::int n from games')).rows[0].n===2);
ok('관리자는 신고를 봄', (await as('authenticated', B, 'select count(*)::int n from error_reports')).rows[0].n===1);
ok('일반 사용자는 관리자 명단 못 봄', (await as('authenticated', A, 'select * from app_admins')).rows.length===0);
// 10. 단계 계산
const h = async (s,p,pop,e) => (await q(`select compute_heat_stage('${s}','${p}','${pop}',${e}) h`)).h;
ok('heat: announced→upcoming', await h('announced','upcoming','unknown',false)==='upcoming');
ok('heat: 출시초기+hot→rising', await h('released','launch_window','hot',false)==='rising');
ok('heat: 출시후+hot→peak', await h('released','post_launch','hot',false)==='peak');
ok('heat: cooling', await h('released','post_launch','cooling',false)==='cooling');
ok('heat: unknown→null', await h('released','launch_window','unknown',false)===null);
ok('heat: 관리자 확인 상시', await h('released','post_launch','cooling',true)==='evergreen');
r = await as('anon', null, "select slug, heat_stage from games_public"); ok('뷰 heat_stage(인기 미확인)=null', r.rows.length===1 && r.rows[0].heat_stage===null);
// 10-2. 게임 영상(시험용 자리 표시 ID는 실제 영상이 아님)
const gid = (await q("select id from games where slug='bombanana'")).id;
await db.exec(`insert into game_videos (game_id, youtube_id, kind, title_ko, channel_name, source_url, status) values
  ('${gid}','test_id_001','launch','시험 영상 1','시험 채널','https://example.invalid/1','approved'),
  ('${gid}','test_id_002','teaser','시험 영상 2','시험 채널','https://example.invalid/2','pending')`);
ok('anon: 승인된 영상만 보임', (await as('anon', null, 'select count(*)::int n from game_videos')).rows[0].n===1);
ok('anon: 영상 등록 불가', !!(await rejects('anon', null, `insert into game_videos (game_id, youtube_id, kind, title_ko, channel_name, source_url) values ('${gid}','test_id_003','teaser','x','x','x')`)));
ok('일반 사용자: 영상 수정 불가', (await as('authenticated', A, "update game_videos set status='approved' returning 1")).rows.length===0);
ok('관리자는 대기 영상도 봄', (await as('authenticated', B, 'select count(*)::int n from game_videos')).rows[0].n===2);
ok('영상 ID는 11자리만', !!(await rejects('authenticated', B, `insert into game_videos (game_id, youtube_id, kind, title_ko, channel_name, source_url) values ('${gid}','short','teaser','x','x','x')`)));
ok('같은 게임에 같은 영상 중복 불가', !!(await rejects('authenticated', B, `insert into game_videos (game_id, youtube_id, kind, title_ko, channel_name, source_url) values ('${gid}','test_id_001','teaser','x','x','x')`)));
await db.exec("update game_videos set is_featured=true where youtube_id='test_id_001'");
ok('대표 영상은 하나만', !!(await rejects('authenticated', B, "update game_videos set is_featured=true where youtube_id='test_id_002'")));
await db.exec("update games set approval_status='pending' where slug='bombanana'");
ok('게임이 승인 취소되면 영상도 안 보임', (await as('anon', null, 'select count(*)::int n from game_videos')).rows[0].n===0);
await db.exec("update games set approval_status='approved' where slug='bombanana'");
// 10-3. 기기 값 XBOX(0008): 게임 플랫폼에 쓸 수 있고, 필터(platforms 포함 검색)에 걸린다
await db.exec("update games set platforms='{PS5,XBOX}' where slug='bombanana'");
ok('XBOX 플랫폼 저장', (await q("select platforms::text p from games where slug='bombanana'")).p==='{PS5,XBOX}');
ok('XBOX로 거르기', (await as('anon', null, "select count(*)::int n from games where 'XBOX' = any(platforms)")).rows[0].n===1);
ok('없는 기기 값은 거부', !!(await rejects('authenticated', B, "update games set platforms='{N64}' where slug='bombanana'")));
await db.exec("update games set platforms='{PC}' where slug='bombanana'");
// 10-4. GTA VI 시드(seed/gta6.sql): 곧 출시 단계, 일정·출처 포함, 두 번 실행해도 중복 없음
await db.exec(readFileSync(P+'/seed/gta6.sql','utf8')); await db.exec(readFileSync(P+'/seed/gta6.sql','utf8'));
r = await as('anon', null, "select slug, heat_stage, platforms::text p, min_players, max_players, fixed_players, price_note, name_ko from games_public where slug='grand-theft-auto-vi'");
ok('GTA VI: 곧 출시·PS5+XBOX·1인·고정 인원 미표시', r.rows.length===1 && r.rows[0].heat_stage==='upcoming' && r.rows[0].p==='{PS5,XBOX}' && r.rows[0].min_players===1 && r.rows[0].max_players===1 && r.rows[0].fixed_players===null && r.rows[0].price_note===null, JSON.stringify(r.rows[0]));
r = await as('anon', null, "select count(*)::int n, min(date::text) d from game_key_dates k join games g on g.id=k.game_id where g.slug='grand-theft-auto-vi'");
ok('GTA VI: 출시일 1건(2026-11-19), 중복 없음', r.rows[0].n===1 && r.rows[0].d==='2026-11-19');
r = await as('anon', null, "select count(*)::int n from game_sources s join games g on g.id=s.game_id where g.slug='grand-theft-auto-vi'");
ok('GTA VI: 출처 1건, 중복 없음', r.rows[0].n===1);
r = await as('anon', null, "select count(*)::int n from games_public where 'PC' = any(platforms) and slug='grand-theft-auto-vi'");
ok('GTA VI: PC 플랫폼 없음', r.rows[0].n===0);
// 11. 탈퇴 시 삭제
await db.exec("delete from auth.users where id='"+A+"'");
const gone = await db.query("select (select count(*) from streamer_profiles)::int p, (select count(*) from ai_usage where user_id='"+A+"')::int u, (select count(*) from ai_requests where user_id='"+A+"')::int rq, (select count(*) from error_reports where reporter_id is null)::int rep");
ok('탈퇴 시 프로필·이용량 삭제, 신고는 작성자만 비움', JSON.stringify(gone.rows[0])==='{"p":0,"u":0,"rq":0,"rep":1}', JSON.stringify(gone.rows[0]));
console.log(fails? fails+' FAILED':'ALL PASSED'); process.exit(fails?1:0);
