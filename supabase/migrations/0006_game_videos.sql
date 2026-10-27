-- 0006: 게임 공식 영상(티저·공개·출시 트레일러) + 게임별 공식 채널 허용 목록

-- 1) 공식 채널 허용 목록. 영상을 등록할 때 channel_id가 여기 있어야 바로 승인할 수 있다.
alter table games add column if not exists official_channel_ids text[] not null default '{}';

-- games_public 뷰는 g.*를 쓰는데, 뷰는 만들 때의 열 목록을 고정해 두므로 다시 만든다(0005와 같은 이유).
drop view if exists games_public;
create view games_public with (security_invoker = true) as
select g.*, compute_heat_stage(g.stage, g.release_phase, g.popularity_status, g.evergreen_confirmed) as heat_stage
from games g;

-- 2) 영상
create type video_kind as enum ('teaser', 'reveal', 'launch', 'gameplay');
create type video_status as enum ('pending', 'approved', 'hidden');

create table game_videos (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  youtube_id text not null check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),  -- 11자리 영상 ID만. URL은 저장하지 않는다
  kind video_kind not null,
  title_ko text,
  title_en text,
  channel_name text not null,
  channel_id text,                     -- 모르면 null(관리자가 나중에 채운다). null이면 자동 승인되지 않는다
  published_at timestamptz,            -- 영상 게시일. 모르면 null
  source_url text not null,
  verified_at timestamptz,             -- 마지막으로 재생 가능 여부를 확인한 시각
  status video_status not null default 'pending',
  hidden_reason text,                  -- 자동 점검이 숨겼을 때 이유(unavailable / embed_blocked 등)
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (title_ko is not null or title_en is not null),
  unique (game_id, youtube_id)
);
create index game_videos_status on game_videos (status, kind);
-- 홈 대표 영상은 한 번에 하나만
create unique index game_videos_one_featured on game_videos (is_featured) where is_featured;
create trigger game_videos_updated before update on game_videos
  for each row execute function set_updated_at();

-- 3) 접근 권한: 승인된 영상은 (게임도 승인된 경우) 누구나 읽고, 쓰기는 관리자만. 자동 점검은 서버(service_role)가 한다.
alter table game_videos enable row level security;
create policy videos_read on game_videos for select using (
  is_admin() or (status = 'approved'
    and exists (select 1 from games g where g.id = game_id and g.approval_status = 'approved'))
);
create policy videos_write on game_videos for all using (is_admin()) with check (is_admin());
