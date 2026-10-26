-- 0005: 영어 번역 저장 열 + 로그인 시도 횟수 제한

-- 1) 다국어: 번역은 {"en": {...}} 형태로 저장한다. 비어 있으면 한국어 원본을 보여 준다.
alter table games add column if not exists translations jsonb not null default '{}'::jsonb;
alter table game_formats add column if not exists translations jsonb not null default '{}'::jsonb;
alter table contents add column if not exists translations jsonb not null default '{}'::jsonb;

-- games_public 뷰는 g.*를 쓰는데, 뷰는 만들 때의 열 목록을 고정해 두므로 다시 만든다.
drop view if exists games_public;
create view games_public with (security_invoker = true) as
select g.*, compute_heat_stage(g.stage, g.release_phase, g.popularity_status, g.evergreen_confirmed) as heat_stage
from games g;

-- 2) 로그인 시도 제한: 키(주소·이메일의 해시)별로 최근 시도를 기록하고 한도를 넘으면 막는다.
create table if not exists auth_attempts (
  id bigint generated always as identity primary key,
  key text not null,
  created_at timestamptz not null default now()
);
create index if not exists auth_attempts_key_time on auth_attempts (key, created_at desc);
alter table auth_attempts enable row level security; -- 정책이 없어 서버(service_role)만 접근한다

-- 시도를 기록하고, 기간 안의 횟수가 한도를 넘었는지 알려 준다. 반환: true = 허용, false = 막음
create or replace function auth_attempt(p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  delete from auth_attempts where created_at < now() - interval '1 day'; -- 오래된 기록 정리
  select count(*) into v_count from auth_attempts
    where key = p_key and created_at > now() - make_interval(secs => p_window_seconds);
  if v_count >= p_max then
    return false;
  end if;
  insert into auth_attempts (key) values (p_key);
  return true;
end $$;

-- 로그인 성공 시 해당 키의 기록을 지운다
create or replace function auth_attempt_clear(p_key text) returns void
language sql security definer set search_path = public as $$
  delete from auth_attempts where key = p_key;
$$;

revoke all on function auth_attempt(text, int, int) from public, anon, authenticated;
revoke all on function auth_attempt_clear(text) from public, anon, authenticated;
grant execute on function auth_attempt(text, int, int) to service_role;
grant execute on function auth_attempt_clear(text) to service_role;
