-- 0011: 고객 유형 3가지 저장(customer_profiles)과 최소 행동 기록(user_events)
-- 이름·이메일·연락처·채널 주소·IP·기기 정보는 저장하지 않는다. 사용자(게스트 포함)가 지워지면 on delete cascade로 함께 지워진다.

create table customer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_guest boolean not null default false,
  customer_type text check (customer_type in ('solo_game', 'solo_talk', 'crew')),  -- null = 미분류
  type_source text check (type_source in ('self', 'inferred')),
  solo_inferred boolean not null default false,  -- 혼방으로는 추정되지만 스타일을 정하지 못함(미분류 안에서 따로 센다)
  platforms text[] not null default '{}' check (platforms <@ array['soop', 'chzzk', 'youtube', 'other']),
  streaming_experience text check (streaming_experience in ('under_6m', '6m_2y', 'over_2y')),
  preferred_tier text check (preferred_tier in ('solo', 'small', 'large')),
  first_seen_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  recommend_count int not null default 0 check (recommend_count >= 0),
  saved_count int not null default 0 check (saved_count >= 0),
  check ((customer_type is null) = (type_source is null)),
  check (not (solo_inferred and customer_type is not null))
);
create index customer_profiles_type on customer_profiles (customer_type, type_source);
create index customer_profiles_active on customer_profiles (last_active_at desc);
create index customer_profiles_first_seen on customer_profiles (first_seen_at);
create index customer_profiles_recommend on customer_profiles (recommend_count desc);

create table user_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('recommend_requested', 'recommend_saved', 'content_viewed', 'game_viewed', 'profile_updated')),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now()
);
create index user_events_user on user_events (user_id, created_at desc);
create index user_events_type on user_events (type, created_at desc);
create index user_events_created on user_events (created_at);

alter table customer_profiles enable row level security;
alter table user_events enable row level security;
-- 본인은 자기 유형을 읽기만 한다(쓰기는 서버만). 관리자는 모두 읽는다. 이벤트는 관리자만 읽는다.
create policy customer_profiles_owner_read on customer_profiles for select using (user_id = auth.uid());
create policy customer_profiles_admin_read on customer_profiles for select using (is_admin());
create policy user_events_admin_read on user_events for select using (is_admin());

-- 행동 1건을 집계에 반영한다(없으면 만든다). 서버(service_role)만 부른다.
create function customer_touch(p_user uuid, p_guest boolean, p_recommend int, p_saved int) returns void
language sql security definer set search_path = public as $$
  insert into customer_profiles (user_id, is_guest, recommend_count, saved_count)
  values (p_user, p_guest, greatest(p_recommend, 0), greatest(p_saved, 0))
  on conflict (user_id) do update set
    last_active_at = now(),
    is_guest = excluded.is_guest,
    recommend_count = customer_profiles.recommend_count + greatest(p_recommend, 0),
    saved_count = customer_profiles.saved_count + greatest(p_saved, 0)
$$;
revoke all on function customer_touch(uuid, boolean, int, int) from public, anon, authenticated;
grant execute on function customer_touch(uuid, boolean, int, int) to service_role;
