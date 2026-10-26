-- ONWISH 데이터 틀 3/3: 한국 시간 월 키, AI 이용량 차감, 공개 뷰

-- 한국 시간(Asia/Seoul) 기준 'YYYY-MM'. 매월 1일 00:00 KST에 값이 바뀐다.
create function kst_month_key(ts timestamptz default now()) returns text
language sql immutable as $$
  select to_char(ts at time zone 'Asia/Seoul', 'YYYY-MM')
$$;

create function kst_today(ts timestamptz default now()) returns date
language sql immutable as $$
  select (ts at time zone 'Asia/Seoul')::date
$$;

-- 이번 달 이용 현황 (서버가 호출)
create function get_ai_quota(p_user uuid, p_limit int)
returns table (used int, remaining int, month_key text, next_reset timestamptz)
language sql stable security definer set search_path = public as $$
  select
    coalesce((select u.used from ai_usage u where u.user_id = p_user and u.month_key = kst_month_key()), 0),
    greatest(p_limit - coalesce((select u.used from ai_usage u where u.user_id = p_user and u.month_key = kst_month_key()), 0), 0),
    kst_month_key(),
    (date_trunc('month', now() at time zone 'Asia/Seoul') + interval '1 month') at time zone 'Asia/Seoul'
$$;

-- AI 추천 1회 차감. 같은 request_id로 다시 불러도 한 번만 차감한다.
-- 검증을 통과한 정상 AI 추천 카드 3개를 제공했을 때만 차감한다(p_cards = 3).
-- 반환: 'charged' | 'already_charged' | 'not_charged' | 'limit_reached'
create function charge_ai_quota(p_user uuid, p_request_id uuid, p_cards int, p_limit int)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_month text := kst_month_key();
  v_req ai_requests;
  v_used int;
begin
  insert into ai_requests (request_id, user_id, month_key, cards)
  values (p_request_id, p_user, v_month, p_cards)
  on conflict (request_id) do nothing;

  -- 같은 요청 줄을 잠가 동시에 두 번 들어와도 한 번만 처리한다
  select * into v_req from ai_requests where request_id = p_request_id for update;

  if v_req.user_id <> p_user then
    raise exception 'request_id belongs to another user';
  end if;
  if v_req.charged then
    return 'already_charged';
  end if;
  if p_cards <> 3 then
    update ai_requests set outcome = 'not_charged', cards = p_cards where request_id = p_request_id;
    return 'not_charged';
  end if;

  insert into ai_usage (user_id, month_key, used) values (p_user, v_month, 0)
  on conflict (user_id, month_key) do nothing;

  select used into v_used from ai_usage where user_id = p_user and month_key = v_month for update;

  if v_used >= p_limit then
    update ai_requests set outcome = 'limit_reached', cards = p_cards where request_id = p_request_id;
    return 'limit_reached';
  end if;

  update ai_usage set used = used + 1 where user_id = p_user and month_key = v_month;
  update ai_requests set charged = true, outcome = 'charged', cards = p_cards where request_id = p_request_id;
  return 'charged';
end $$;

-- 일일 AI 비용 누적 후 현재 합계를 돌려준다
create function add_ai_cost(p_cost_usd numeric) returns numeric
language plpgsql security definer set search_path = public as $$
declare v_total numeric;
begin
  insert into ai_daily_cost (day, cost_usd) values (kst_today(), p_cost_usd)
  on conflict (day) do update set cost_usd = ai_daily_cost.cost_usd + excluded.cost_usd
  returning cost_usd into v_total;
  return v_total;
end $$;

-- 서버(service_role)만 실행할 수 있게 한다. 브라우저에서 직접 불러 한도를 건드리지 못하도록.
revoke all on function get_ai_quota(uuid, int) from public, anon, authenticated;
revoke all on function charge_ai_quota(uuid, uuid, int, int) from public, anon, authenticated;
revoke all on function add_ai_cost(numeric) from public, anon, authenticated;
grant execute on function get_ai_quota(uuid, int) to service_role;
grant execute on function charge_ai_quota(uuid, uuid, int, int) to service_role;
grant execute on function add_ai_cost(numeric) to service_role;

-- 화면용 단계. 기획서 6.3의 대응 규칙:
--   출시 전 → upcoming / 출시 초기 + hot → golden / 이후 hot → hot / cooling → cooling / 관리자 확인 상시 → evergreen
--   popularity_status = unknown 이면 null ("인기 확인 필요"로 표시)
create function compute_heat_stage(
  p_stage game_stage, p_phase release_phase, p_pop popularity_status, p_evergreen boolean
) returns text
language sql immutable as $$
  select case
    when p_phase = 'upcoming' or p_stage in ('announced', 'playtest') then 'upcoming'
    when p_evergreen then 'evergreen'
    when p_pop = 'unknown' then null
    when p_pop = 'hot' and p_phase = 'launch_window' then 'golden'
    when p_pop = 'hot' then 'hot'
    when p_pop = 'cooling' then 'cooling'
    when p_pop = 'evergreen' then 'evergreen'
  end
$$;

-- 공개 화면은 이 뷰로 읽는다. 뷰는 호출한 사용자의 권한(RLS)을 따른다.
create view games_public with (security_invoker = true) as
select g.*, compute_heat_stage(g.stage, g.release_phase, g.popularity_status, g.evergreen_confirmed) as heat_stage
from games g;
