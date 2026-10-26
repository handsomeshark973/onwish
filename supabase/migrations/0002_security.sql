-- ONWISH 데이터 틀 2/3: 접근 권한(RLS)
-- 원칙: 승인(approved)된 것만 공개, 사용자 데이터는 본인만, 관리·집계 테이블은 관리자 또는 서버(service_role)만.

create function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from app_admins where user_id = auth.uid())
$$;

alter table app_admins enable row level security;
alter table games enable row level security;
alter table game_key_dates enable row level security;
alter table game_sources enable row level security;
alter table game_formats enable row level security;
alter table game_metrics enable row level security;
alter table watchlist enable row level security;
alter table contents enable row level security;
alter table content_games enable row level security;
alter table field_verifications enable row level security;
alter table review_log enable row level security;
alter table streamer_profiles enable row level security;
alter table saved_recommendations enable row level security;
alter table ai_usage enable row level security;
alter table ai_requests enable row level security;
alter table ai_daily_cost enable row level security;
alter table error_reports enable row level security;

-- 관리자 명단은 관리자만 본다. 추가·삭제는 SQL 편집기에서 직접 한다(화면에서 관리자를 만들 수 없게).
create policy admins_read on app_admins for select using (is_admin());

-- 공개 콘텐츠: 승인된 것만 누구나 읽고, 쓰기는 관리자만
create policy games_read on games for select using (approval_status = 'approved' or is_admin());
create policy games_write on games for all using (is_admin()) with check (is_admin());

create policy formats_read on game_formats for select using (
  is_admin() or (approval_status = 'approved'
    and exists (select 1 from games g where g.id = game_id and g.approval_status = 'approved'))
);
create policy formats_write on game_formats for all using (is_admin()) with check (is_admin());

create policy key_dates_read on game_key_dates for select using (
  is_admin() or exists (select 1 from games g where g.id = game_id and g.approval_status = 'approved')
);
create policy key_dates_write on game_key_dates for all using (is_admin()) with check (is_admin());

create policy sources_read on game_sources for select using (
  is_admin() or exists (select 1 from games g where g.id = game_id and g.approval_status = 'approved')
);
create policy sources_write on game_sources for all using (is_admin()) with check (is_admin());

create policy metrics_read on game_metrics for select using (
  is_admin() or exists (select 1 from games g where g.id = game_id and g.approval_status = 'approved')
);
create policy metrics_write on game_metrics for all using (is_admin()) with check (is_admin());

create policy contents_read on contents for select using (approval_status = 'approved' or is_admin());
create policy contents_write on contents for all using (is_admin()) with check (is_admin());

create policy content_games_read on content_games for select using (
  is_admin() or (
    exists (select 1 from contents c where c.id = content_id and c.approval_status = 'approved')
    and exists (select 1 from games g where g.id = game_id and g.approval_status = 'approved')
  )
);
create policy content_games_write on content_games for all using (is_admin()) with check (is_admin());

-- 관리자 전용
create policy watchlist_admin on watchlist for all using (is_admin()) with check (is_admin());
create policy verifications_admin on field_verifications for all using (is_admin()) with check (is_admin());
create policy review_log_admin on review_log for select using (is_admin());

-- 사용자 데이터: 본인만 조회·변경·삭제
create policy profiles_owner on streamer_profiles for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy saved_owner on saved_recommendations for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 이용량: 본인은 읽기만. 차감·기록은 서버(service_role)가 함수로만 한다.
create policy usage_read on ai_usage for select using (user_id = auth.uid());
create policy ai_requests_read on ai_requests for select using (user_id = auth.uid());
-- ai_daily_cost 는 정책이 없어 service_role 외에는 접근할 수 없다.

-- 오류 신고: 로그인한 사용자가 본인 이름으로 접수, 본인 신고만 조회, 처리는 관리자
create policy reports_insert on error_reports for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'open' and handled_by is null);
create policy reports_read on error_reports for select using (reporter_id = auth.uid() or is_admin());
create policy reports_admin_update on error_reports for update using (is_admin()) with check (is_admin());
create policy reports_admin_delete on error_reports for delete using (is_admin());

-- 승인 상태가 바뀌면 검수 이력을 남긴다
create function log_approval_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.approval_status is distinct from old.approval_status then
    insert into review_log (entity_type, entity_id, action, actor, note)
    values (tg_argv[0], new.id, 'approval_status:' || new.approval_status::text, auth.uid(), null);
  end if;
  return new;
end $$;

create trigger games_review_log after insert or update on games
  for each row execute function log_approval_change('game');
create trigger formats_review_log after insert or update on game_formats
  for each row execute function log_approval_change('game_format');
create trigger contents_review_log after insert or update on contents
  for each row execute function log_approval_change('content');
