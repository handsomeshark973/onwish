-- 0009 되돌리기. 게스트 사용자(auth.users)는 지우지 않는다. 필요하면 먼저 purge_expired_guests()를 실행한다.
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from app_admins where user_id = auth.uid())
$$;
drop function if exists purge_expired_guests();
drop table if exists guest_activity;
