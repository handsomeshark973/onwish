-- GTA VI 런치 트레일러 연결. gta6.sql을 먼저 실행한 뒤 SQL 편집기에서 실행한다. 여러 번 실행해도 안전하다.
-- 영상 확인(2026-10-27): youtube.com/watch?v=yaTZE9NN3lE, oEmbed 200·퍼가기 허용, 재생 가능,
--   채널 "Rockstar Games 대한민국"(youtube.com/@rockstargameskorea, 채널 ID UCJ8Yo015gVoxahLW4JAjBjw), 게시일 2026-10-15, 90초.
--   이 채널은 운영자가 확인한 Rockstar 공식 지역 채널이다(공식 본 채널은 youtube.com/rockstargames).

-- 1) 공식 채널 허용 목록에 추가
update games
set official_channel_ids = array_append(official_channel_ids, 'UCJ8Yo015gVoxahLW4JAjBjw')
where slug = 'grand-theft-auto-vi' and not ('UCJ8Yo015gVoxahLW4JAjBjw' = any(official_channel_ids));

-- 2) 카드 이미지: Rockstar 미디어 페이지에는 이미지 사용 조건이 적혀 있지 않아("Download and share trailers, imagery, and more."뿐),
--    등록한 공식 영상의 YouTube 썸네일을 쓰고 출처를 표시한다. 영상이 지워지면 이미지도 함께 사라지므로 그때는 이 값을 비운다.
update games
set image_url = 'https://i.ytimg.com/vi/yaTZE9NN3lE/maxresdefault.jpg', image_source = 'Rockstar Games · YouTube'
where slug = 'grand-theft-auto-vi';

-- 3) 영상. 대표 영상은 한 번에 하나만 가질 수 있어서 다른 대표 지정을 먼저 푼다. 출시 후에는 관리자가 이 영상의 대표를 해제한다.
update game_videos set is_featured = false where is_featured and youtube_id <> 'yaTZE9NN3lE';

insert into game_videos (game_id, youtube_id, kind, title_ko, title_en, channel_name, channel_id, published_at, source_url, verified_at, status, is_featured)
select id, 'yaTZE9NN3lE', 'launch', 'GTA 6 런치 트레일러', 'Grand Theft Auto VI Launch Trailer', 'Rockstar Games 대한민국', 'UCJ8Yo015gVoxahLW4JAjBjw',
       '2026-10-15T14:14:49Z', 'https://www.youtube.com/watch?v=yaTZE9NN3lE', now(), 'approved', true
from games where slug = 'grand-theft-auto-vi'
on conflict (game_id, youtube_id) do nothing;
