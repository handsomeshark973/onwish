-- 0012: 관리자 고객 현황(/admin/customers) 집계 함수
-- 모든 함수는 관리자만 쓸 수 있다(함수 안에서 is_admin()을 다시 검사). 개인정보(이메일 등)는 돌려주지 않고, 사용자 번호는 앞 8자리만 돌려준다.

-- 고객 칸: 유형이 있으면 유형, 없으면 솔로(스타일 미정) 또는 근거 부족
create function customer_segment(p_type text, p_solo_inferred boolean) returns text
language sql immutable as $$
  select coalesce(p_type, case when p_solo_inferred then 'solo_undecided' else 'insufficient' end)
$$;
create index customer_profiles_segment on customer_profiles (customer_segment(customer_type, solo_inferred));
create index customer_profiles_guest on customer_profiles (is_guest);

-- 칸별 요약: 전체, 최근 7일 신규, 최근 7일 활동, 본인 선택 수, 게스트 수
create function admin_customer_summary()
returns table (segment text, total int, new_7d int, active_7d int, self_count int, guests int)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
  select customer_segment(cp.customer_type, cp.solo_inferred), count(*)::int,
         (count(*) filter (where cp.first_seen_at >= now() - interval '7 days'))::int,
         (count(*) filter (where cp.last_active_at >= now() - interval '7 days'))::int,
         (count(*) filter (where cp.type_source = 'self'))::int,
         (count(*) filter (where cp.is_guest))::int
  from customer_profiles cp group by 1;
end $$;

-- 최근 N일 칸별 신규 인원(한국 날짜 기준)
create function admin_customer_trend(p_days int default 30)
returns table (day date, segment text, n int)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
  select (cp.first_seen_at at time zone 'Asia/Seoul')::date, customer_segment(cp.customer_type, cp.solo_inferred), count(*)::int
  from customer_profiles cp
  where cp.first_seen_at >= now() - make_interval(days => greatest(p_days, 1))
  group by 1, 2;
end $$;

-- 칸별 비교. p_days가 null이면 전체 기간. 이벤트는 해당 기간의 것만 센다.
create function admin_customer_compare(p_days int default 30)
returns table (segment text, users int, recommends int, saved int, appeal jsonb, participation_saved int, small_requests int, large_requests int, top_games jsonb, top_contents jsonb)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
  with segs(s) as (values ('solo_game'), ('solo_talk'), ('crew'), ('solo_undecided'), ('insufficient')),
  seg as (select cp.user_id, customer_segment(cp.customer_type, cp.solo_inferred) as s from customer_profiles cp),
  ev as (
    select e.type, e.payload, sg.s from user_events e join seg sg on sg.user_id = e.user_id
    where p_days is null or e.created_at >= now() - make_interval(days => greatest(p_days, 1))
  ),
  base as (select s, count(*)::int as users from seg group by s),
  agg as (
    select s,
      (count(*) filter (where type = 'recommend_requested'))::int as recs,
      (count(*) filter (where type = 'recommend_saved'))::int as sv,
      (count(*) filter (where type = 'recommend_saved' and payload->>'viewerParticipation' in ('enriches', 'required')))::int as part,
      (count(*) filter (where type = 'recommend_requested' and payload->>'tier' = 'small'))::int as sm,
      (count(*) filter (where type = 'recommend_requested' and payload->>'tier' = 'large'))::int as lg,
      jsonb_build_object(
        'visual', count(*) filter (where type = 'recommend_saved' and payload->>'mainAppeal' = 'visual'),
        'audio', count(*) filter (where type = 'recommend_saved' and payload->>'mainAppeal' = 'audio'),
        'audiovisual', count(*) filter (where type = 'recommend_saved' and payload->>'mainAppeal' = 'audiovisual')) as appeal
    from ev group by s
  ),
  tg as (
    select s, payload->>'slug' as slug, count(*)::int as n, row_number() over (partition by s order by count(*) desc, payload->>'slug') as rn
    from ev where type = 'game_viewed' and payload ? 'slug' group by s, payload->>'slug'
  ),
  tc as (
    select s, payload->>'slug' as slug, count(*)::int as n, row_number() over (partition by s order by count(*) desc, payload->>'slug') as rn
    from ev where type = 'content_viewed' and payload ? 'slug' group by s, payload->>'slug'
  )
  select segs.s, coalesce(b.users, 0), coalesce(a.recs, 0), coalesce(a.sv, 0),
    coalesce(a.appeal, '{"visual":0,"audio":0,"audiovisual":0}'::jsonb),
    coalesce(a.part, 0), coalesce(a.sm, 0), coalesce(a.lg, 0),
    coalesce((select jsonb_agg(jsonb_build_object('slug', tg.slug, 'n', tg.n) order by tg.rn) from tg where tg.s = segs.s and tg.rn <= 3), '[]'::jsonb),
    coalesce((select jsonb_agg(jsonb_build_object('slug', tc.slug, 'n', tc.n) order by tc.rn) from tc where tc.s = segs.s and tc.rn <= 3), '[]'::jsonb)
  from segs left join base b on b.s = segs.s left join agg a on a.s = segs.s;
end $$;

-- 고객 목록. 필터: 칸, 판정 방식(self/inferred/none), 게스트 여부, 최근 활동 기간. 정렬: last_active | recommend. 한 번에 최대 10000명.
create function admin_customer_list(
  p_segment text default null, p_source text default null, p_guest boolean default null, p_days int default null,
  p_sort text default 'last_active', p_dir text default 'desc', p_limit int default 50, p_offset int default 0)
returns table (short_id text, segment text, type_source text, is_guest boolean, platforms text[], streaming_experience text, preferred_tier text,
               recommend_count int, saved_count int, first_seen_at timestamptz, last_active_at timestamptz, total_count bigint)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
  select left(cp.user_id::text, 8), customer_segment(cp.customer_type, cp.solo_inferred), cp.type_source, cp.is_guest, cp.platforms,
         cp.streaming_experience, cp.preferred_tier, cp.recommend_count, cp.saved_count, cp.first_seen_at, cp.last_active_at,
         count(*) over ()
  from customer_profiles cp
  where (p_segment is null or customer_segment(cp.customer_type, cp.solo_inferred) = p_segment)
    and (p_source is null or (p_source = 'none' and cp.type_source is null) or cp.type_source = p_source)
    and (p_guest is null or cp.is_guest = p_guest)
    and (p_days is null or cp.last_active_at >= now() - make_interval(days => greatest(p_days, 1)))
  order by
    case when p_sort = 'recommend' and p_dir = 'asc' then cp.recommend_count end asc,
    case when p_sort = 'recommend' and p_dir <> 'asc' then cp.recommend_count end desc,
    case when p_sort <> 'recommend' and p_dir = 'asc' then cp.last_active_at end asc,
    cp.last_active_at desc, cp.user_id
  limit least(greatest(p_limit, 1), 10000) offset greatest(p_offset, 0);
end $$;

revoke all on function admin_customer_summary(), admin_customer_trend(int), admin_customer_compare(int),
  admin_customer_list(text, text, boolean, int, text, text, int, int) from public, anon;
grant execute on function admin_customer_summary(), admin_customer_trend(int), admin_customer_compare(int),
  admin_customer_list(text, text, boolean, int, text, text, int, int) to authenticated, service_role;
