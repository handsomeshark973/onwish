-- ONWISH 데이터 틀 1/3: 분류값, 테이블
-- 기획서 4·5·12장 기준. 출시 경과(release_phase)와 인기 상태(popularity_status)는 따로 저장하고,
-- 화면용 heat_stage는 games_public 뷰(0003)에서 계산한다.


-- ───── 분류값 ─────
create type player_tier as enum ('solo', 'small', 'large');
create type audience_size as enum ('s', 'm', 'l');
create type origin_kind as enum ('game', 'in_game_creation', 'stream_native', 'variety_adapted');
create type structure_kind as enum ('coop', 'versus', 'mind_game', 'talk');
create type lifecycle_kind as enum ('trend', 'evergreen', 'series');
create type viewer_participation as enum ('none', 'enriches', 'required');
create type participation_channel as enum ('chat_vote', 'donation_mission', 'direct_play', 'community_task');
create type device_kind as enum ('PC', 'PS5', 'SWITCH', 'VR');
create type main_appeal as enum ('visual', 'audio', 'audiovisual');
create type watch_mode as enum ('focus', 'background');
create type participation_mode as enum ('simultaneous', 'rotation', 'league');
create type game_stage as enum ('announced', 'playtest', 'early_access', 'released');
create type release_phase as enum ('upcoming', 'launch_window', 'post_launch');
create type popularity_status as enum ('unknown', 'hot', 'cooling', 'evergreen');
create type metric_kind as enum ('steam_ccu', 'twitch_viewers', 'youtube_views', 'chzzk_viewers', 'soop_viewers', 'official_players', 'wishlist');
create type approval_status as enum ('pending', 'approved', 'rejected', 'archived');
create type verify_status as enum ('unverified', 'verified', 'disputed');
create type report_status as enum ('open', 'in_progress', 'resolved', 'dismissed');

-- ───── 공통 함수 ─────
create function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ───── 관리자 ─────
create table app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ───── 게임 ─────
create table games (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  name_ko text,
  developer text not null,
  publisher text,
  stage game_stage not null,
  release_phase release_phase not null default 'upcoming',
  popularity_status popularity_status not null default 'unknown',
  release_basis_label text,            -- 출시 경과 계산에 쓴 날짜 종류: 얼리 액세스 / 정식 출시
  release_basis_date date,
  evergreen_confirmed boolean not null default false,  -- 관리자가 상시로 확인
  platforms device_kind[] not null default '{}',
  min_players int check (min_players is null or min_players >= 1),
  max_players int check (max_players is null or max_players >= 1),
  fixed_players boolean,               -- 정확히 N명이어야 하는 게임. null은 미확인
  crossplay boolean,                   -- null은 미확인(false와 구분)
  price_note text,
  genre text[] not null default '{}',
  asymmetric_roles boolean not null default false,
  proximity_voice boolean not null default false,
  moddable boolean not null default false,
  stream_point text,
  cautions text,
  -- 제외 조건 판정 태그. null은 "확인되지 않음"이라 해당 회피 조건을 고른 사용자에게는 추천하지 않는다
  is_horror boolean,
  motion_sickness_risk boolean,
  spoiler_risk boolean,
  base_metric_kind metric_kind,        -- 인기 계산에 쓰는 기준 지표 하나
  image_url text,
  image_source text,
  approval_status approval_status not null default 'pending',
  last_checked_at timestamptz,
  info_stale boolean not null default false,  -- 수집 실패 시 "갱신 지연" 표시
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (min_players is null or max_players is null or min_players <= max_players)
);

create table game_key_dates (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  label text not null,
  date date not null,
  source text not null
);

create table game_sources (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  title text not null,
  url text not null,
  checked_at timestamptz
);

-- 게임 × 진행 방식. 어필은 여기에 붙는다.
create table game_formats (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  title text not null,
  required_min int check (required_min is null or required_min >= 1),
  required_max int check (required_max is null or required_max >= 1),
  participation_mode participation_mode not null default 'simultaneous',
  required_devices device_kind[] not null default '{}',
  player_tiers player_tier[] not null default '{}',
  main_appeal main_appeal not null,
  appeal_points text[] not null default '{}',   -- 0~2개. 비워 둘 수 있다
  appeal_text text not null,
  how_to text not null,
  mods_or_setup text,
  approval_status approval_status not null default 'pending',
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cardinality(appeal_points) <= 2),
  check (required_min is null or required_max is null or required_min <= required_max)
);

-- 지표 이력. 수집 실패·결측은 행을 만들지 않는다(0으로 기록하지 않음).
create table game_metrics (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  kind metric_kind not null,
  value numeric not null check (value >= 0),
  observed_at timestamptz not null,
  source text not null,
  unique (game_id, kind, observed_at)
);
create index game_metrics_lookup on game_metrics (game_id, kind, observed_at desc);

-- 인기 IP 감시 목록
create table watchlist (
  id uuid primary key default gen_random_uuid(),
  developer_or_ip text not null unique,
  note text,
  created_at timestamptz not null default now()
);

-- ───── 컨텐츠 라이브러리 ─────
create table contents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  player_tier player_tier not null,
  required_min int check (required_min is null or required_min >= 1),
  required_max int check (required_max is null or required_max >= 1),
  participation_mode participation_mode not null default 'simultaneous',
  origin origin_kind not null,
  borrowed_from text,                  -- 참고한 예능·방송 뼈대. 표기 전용
  structures structure_kind[] not null default '{}',
  lifecycle lifecycle_kind not null,
  audience_fit audience_size[] not null default '{}',
  devices device_kind[] not null default '{}',
  games_text text,                     -- DB에 없는 게임은 이름만
  mods_or_setup text,
  main_appeal main_appeal not null,
  appeal_points text[] not null default '{}',
  appeal_text text not null,
  watch_mode watch_mode not null,
  how_to text not null,
  multi_pov_point text,
  viewer_participation viewer_participation not null,
  participation_channels participation_channel[] not null default '{}',
  participation_by_size jsonb not null default '{}'::jsonb,
  continuity text,
  cautions text,
  -- 제외 조건 판정 태그 (null = 확인되지 않음)
  is_horror boolean,
  motion_sickness_risk boolean,
  spoiler_risk boolean,
  approval_status approval_status not null default 'pending',
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(participation_by_size) = 'object'),
  check (required_min is null or required_max is null or required_min <= required_max)
);

create table content_games (
  content_id uuid not null references contents(id) on delete cascade,
  game_id uuid not null references games(id) on delete cascade,
  primary key (content_id, game_id)
);

-- ───── 검수 ─────
-- 필드별 검증 상태. "출처가 있다"와 "확인했다"는 다르다.
create table field_verifications (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('game', 'game_format', 'content')),
  entity_id uuid not null,
  field text not null,
  status verify_status not null default 'unverified',
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  note text,
  unique (entity_type, entity_id, field)
);

create table review_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  actor uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index review_log_entity on review_log (entity_type, entity_id, created_at desc);

-- ───── 사용자 ─────
create table streamer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  mode player_tier not null,
  strengths text[] not null default '{}' check (strengths <@ array['talk','chemistry','skill','creation','reaction']),
  persona text not null default '' check (char_length(persona) <= 500),
  uses_cam boolean not null default false,
  audience audience_size not null,
  devices device_kind[] not null default '{PC}',
  length text not null default 'single' check (length in ('single', 'full_day', 'series')),
  time_slot text not null default 'evening' check (time_slot in ('day', 'evening', 'late_night')),
  goal text not null default 'both' check (goal in ('acquire', 'retain', 'both')),
  has_community boolean not null default false,
  community_activity text check (community_activity in ('low', 'mid', 'high')),
  allow_rotation boolean not null default false,
  allow_league boolean not null default false,
  excluded_game_ids uuid[] not null default '{}',
  excluded_genres text[] not null default '{}',
  avoid_horror boolean not null default false,
  avoid_motion_sickness boolean not null default false,
  avoid_spoilers boolean not null default false,
  include_trend boolean not null default true,
  member_count int check (member_count is null or member_count >= 2),
  -- 별명·방송상 역할·기기·보유 게임만. 실명·연락처 항목은 만들지 않는다.
  members jsonb not null default '[]'::jsonb check (jsonb_typeof(members) = 'array'),
  chemistry_level text check (chemistry_level in ('first', 'some', 'long')),
  desired_structures structure_kind[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table saved_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('ai', 'rule')),  -- AI 추천 / 기본 추천
  profile_snapshot jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);
create index saved_recommendations_user on saved_recommendations (user_id, created_at desc);

-- ───── AI 이용량과 비용 통제 ─────
-- month_key는 한국 시간 기준 'YYYY-MM'. 매월 1일 00:00(KST)에 새 키가 생겨 자동 초기화된다.
create table ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  month_key text not null check (month_key ~ '^\d{4}-\d{2}$'),
  used int not null default 0 check (used >= 0),
  primary key (user_id, month_key)
);

-- 요청 식별자 하나당 한 번만 차감한다. 차감하지 않은 요청도 반복 요청 제한을 위해 기록한다.
create table ai_requests (
  request_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  month_key text not null,
  cards int not null default 0,
  charged boolean not null default false,
  outcome text not null default 'pending' check (outcome in ('pending', 'charged', 'not_charged', 'limit_reached')),
  created_at timestamptz not null default now()
);
create index ai_requests_rate on ai_requests (user_id, created_at desc);

-- 서비스 전체 일일 AI 비용(한국 시간 날짜 기준)
create table ai_daily_cost (
  day date primary key,
  cost_usd numeric not null default 0 check (cost_usd >= 0)
);

-- ───── 오류 신고 ─────
create table error_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete set null,
  target_type text not null check (target_type in ('game', 'game_format', 'content', 'recommendation')),
  target_id uuid,
  message text not null check (char_length(message) between 1 and 2000),
  status report_status not null default 'open',
  handled_by uuid references auth.users(id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now()
);
create index error_reports_status on error_reports (status, created_at desc);

-- ───── updated_at 자동 갱신 ─────
create trigger games_updated before update on games for each row execute function set_updated_at();
create trigger game_formats_updated before update on game_formats for each row execute function set_updated_at();
create trigger contents_updated before update on contents for each row execute function set_updated_at();
create trigger streamer_profiles_updated before update on streamer_profiles for each row execute function set_updated_at();
