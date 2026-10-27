-- Grand Theft Auto VI를 "곧 출시" 게임으로 등록한다. 0008_device_xbox.sql(XBOX 기기 값)을 먼저 적용한 뒤 SQL 편집기에서 실행한다.
-- 확인일 2026-10-27, 출처: Rockstar 공식 사이트 https://www.rockstargames.com/VI
--   "Coming November 19, 2026" / 플랫폼 PlayStation 5, Xbox Series X|S. PC 버전은 공식 발표가 없어 넣지 않는다.
-- 일부러 비워 둔 값: 가격(price_note), 장르(genre), 크로스플레이, 공포·멀미·스포일러 태그, 이미지, 공식 채널 목록(영상 검증 뒤에 채운다).
-- 연령 등급은 저장하는 칸이 없다(공식 페이지의 ESRB 등급만 확인했고 국내 등급은 확인하지 못했다).
-- 여러 번 실행해도 중복으로 들어가지 않는다.

insert into games (
  slug, name, name_ko, developer, publisher,
  stage, release_phase, popularity_status, release_basis_label, release_basis_date,
  platforms, min_players, max_players, fixed_players,
  approval_status, last_checked_at
) values (
  'grand-theft-auto-vi', 'Grand Theft Auto VI', '그랜드 테프트 오토 VI', 'Rockstar North', 'Rockstar Games',
  'announced', 'upcoming', 'unknown', '공식 출시 예정일', '2026-11-19',
  '{PS5,XBOX}', 1, 1, null,
  'approved', '2026-10-27T00:00:00+09:00'
)
on conflict (slug) do nothing;

insert into game_key_dates (game_id, label, date, source)
select id, '출시', '2026-11-19', 'https://www.rockstargames.com/VI'
from games g
where g.slug = 'grand-theft-auto-vi'
  and not exists (select 1 from game_key_dates k where k.game_id = g.id and k.date = '2026-11-19');

insert into game_sources (game_id, title, url, checked_at)
select id, 'Rockstar 공식 사이트 · Grand Theft Auto VI', 'https://www.rockstargames.com/VI', '2026-10-27T00:00:00+09:00'
from games g
where g.slug = 'grand-theft-auto-vi'
  and not exists (select 1 from game_sources s where s.game_id = g.id and s.url = 'https://www.rockstargames.com/VI');
