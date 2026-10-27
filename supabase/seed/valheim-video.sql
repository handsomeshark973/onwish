-- Valheim 출시 트레일러 1개를 홈 영상 구역에 올리는 시드. 0006_game_videos.sql을 먼저 적용한 뒤 SQL 편집기에서 실행한다.
-- 영상 확인 결과(2026-10-27, oEmbed 200·퍼가기 허용): 제목 "Valheim: 1.0 Out Now", 채널 Iron Gate(@irongateofficial), 게시일 2026-09-09.
-- 출처: Valheim 1.0 보도자료(Swipe Right)가 이 영상을 "Valheim Official Launch Trailer"로 링크함.

-- 1) 공식 채널 허용 목록에 Iron Gate 추가. 채널 ID는 영상 페이지에서 읽은 값이므로 실행 전에 채널 페이지에서 한 번 더 확인할 것.
update games
set official_channel_ids = array['UCr3Yfz4Ts_K4bAyMCoVXeyA']
where slug = 'valheim';

-- 2) 인기 상태를 hot으로. 홈의 "최근 인기 신작"은 골든타임·붐 단계만 받는다. (이 줄은 운영자가 판단해서 실행)
--    출시 기준일(release_basis_date)은 Steam 출시일(2026-09-09)이 이미 들어 있다.
update games set popularity_status = 'hot' where slug = 'valheim';

-- 3) 영상. 채널이 허용 목록에 있으므로 approved로 넣는다.
insert into game_videos (game_id, youtube_id, kind, title_ko, title_en, channel_name, channel_id, published_at, source_url, verified_at, status)
select id, 'gsSWz6sfu-U', 'launch', 'Valheim: 1.0 Out Now', 'Valheim: 1.0 Out Now', 'Iron Gate', 'UCr3Yfz4Ts_K4bAyMCoVXeyA',
       '2026-09-09T12:56:05Z', 'https://www.youtube.com/watch?v=gsSWz6sfu-U', now(), 'approved'
from games where slug = 'valheim'
on conflict (game_id, youtube_id) do nothing;
