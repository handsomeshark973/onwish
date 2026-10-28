-- 0009: 게스트 모드(로그인 없이 쓰는 익명 사용자)
-- 1) 게스트 활동·만료 기록  2) 만료된 게스트 정리 함수  3) 게스트는 관리자가 될 수 없게 is_admin() 보강
-- 선행 조건: Supabase 대시보드 Authentication > Sign In / Providers > Anonymous Sign-Ins 를 켠다.

create table if not exists guest_activity (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  expires_at timestamptz not null  -- 마지막 활동 후 14일
);
create index if not exists guest_activity_expires on guest_activity (expires_at);
alter table guest_activity enable row level security; -- 정책이 없어 서버(service_role)만 접근한다

-- 만료된 게스트 사용자를 지운다. 프로필·저장 추천·이용 기록은 on delete cascade로 함께 지워진다.
-- 활동 기록이 없는 익명 사용자(기록 저장에 실패한 경우)는 만든 지 14일이 지나면 지운다. 반환: 지운 수
create or replace function purge_expired_guests() returns int
language plpgsql security definer set search_path = public, auth as $$
declare n int;
begin
  with doomed as (
    select u.id from auth.users u
    left join guest_activity a on a.user_id = u.id
    where u.is_anonymous
      and (a.expires_at < now() or (a.user_id is null and u.created_at < now() - interval '14 days'))
  ), del as (
    delete from auth.users where id in (select id from doomed) returning 1
  )
  select count(*)::int into n from del;
  return n;
end $$;

revoke all on function purge_expired_guests() from public, anon, authenticated;
grant execute on function purge_expired_guests() to service_role;

-- 관리자 여부: 익명(게스트) 세션은 app_admins에 들어 있어도 관리자가 아니다.
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from app_admins where user_id = auth.uid())
     and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
$$;
