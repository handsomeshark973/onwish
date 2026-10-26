-- 기획서 9.1의 시드 후보. 전부 approval_status = 'pending'(미검수)이라 공개 화면과 추천에 나오지 않는다.
-- 기획서에 적힌 값만 옮겼고, 원문 출처와 필드별 사실을 관리자가 확인한 뒤 approved로 바꾼다.
-- 값이 적혀 있지 않은 항목(크로스플레이, 공포·멀미·스포일러 태그 등)은 null = 확인 안 됨으로 둔다.
-- 지표(공식 발표 수치)는 game_metrics에 넣지 않았다: 기준 지표 종류와 관측 시각이 정해지지 않았다.

insert into games (slug, name, name_ko, developer, stage, release_phase, release_basis_label, release_basis_date,
                   platforms, min_players, max_players, fixed_players, genre, asymmetric_roles, moddable,
                   stream_point, cautions, approval_status)
values
('bombanana', 'BOMBANANA!', '봄바나나!', 'Lefto Studio, TARK', 'released', 'post_launch', 'Steam 출시', '2026-09-02',
 '{PC}', 3, 3, true, '{}', true, true,
 '말해야만 풀리는 구조라 소통 자체가 컨텐츠가 된다. 보지 못하는·말하지 못하는·듣지 못하는 원숭이 세 역할로 정보가 갈린다.',
 '정확히 3명이어야 한다.', 'pending'),
('escape-from-playtime', 'Escape From Playtime', null, 'Mob Entertainment', 'early_access', 'post_launch', 'Steam 얼리 액세스 출시', '2026-10-21',
 '{PC}', 1, 8, false, '{협동 서바이벌 호러 익스트랙션}', false, false,
 'Smiling Critters로 Playtime Co. 공장을 탐험한다. 장난감 크기로 기어오르는 미니 모드가 있다.',
 '얼리 액세스라 초기 콘텐츠가 적다. 붐 기간은 짧게 잡고 큰 업데이트 때 다시 추천한다.', 'pending');

update games set is_horror = true where slug = 'escape-from-playtime';

insert into game_key_dates (game_id, label, date, source)
select id, '2026-09-02 Steam 출시', '2026-09-02'::date, 'store.steampowered.com' from games where slug = 'bombanana'
union all
select id, '게임스컴 Future Games Show 공개', '2026-08-26'::date, 'mobentertainment.com 뉴스' from games where slug = 'escape-from-playtime'
union all
select id, 'Steam 얼리 액세스 출시', '2026-10-21'::date, 'mobentertainment.com 뉴스' from games where slug = 'escape-from-playtime';

-- 출처는 기획서에 적힌 표기 그대로 저장한다. 전체 주소와 확인일은 검수 때 채운다.
insert into game_sources (game_id, title, url)
select id, 'Inven Global', 'invenglobal.com/articles/26215' from games where slug = 'bombanana'
union all select id, 'Steam 스토어', 'store.steampowered.com' from games where slug = 'bombanana'
union all select id, 'Co-Optimus', 'co-optimus.com/article/17868' from games where slug = 'bombanana'
union all select id, 'Mob Entertainment 뉴스', 'mobentertainment.com' from games where slug = 'escape-from-playtime'
union all select id, 'Inven Global', 'invenglobal.com/articles/27496' from games where slug = 'escape-from-playtime'
union all select id, 'PC Gamer', 'pcgamer.com' from games where slug = 'escape-from-playtime';

insert into game_formats (game_id, title, required_min, required_max, player_tiers, main_appeal, appeal_points, appeal_text, how_to, approval_status)
select g.id, v.title, v.rmin, v.rmax, v.tiers, v.appeal, v.points, v.appeal_text, v.how_to, 'pending'
from (values
  ('bombanana', '캠페인 3인 합방', 3, 3, '{small}'::player_tier[], 'audio'::main_appeal, '{forced_comm,chemistry}'::text[],
   '말해야만 풀리는 구조라 처음 합방하는 사이도 대화가 끊기지 않는다.',
   '세 사람이 각자 방송을 켜고 같은 캠페인 스테이지를 진행한다. 시청자는 한 사람 시점만 보기 때문에 다른 멤버의 정보는 말로만 전달된다.'),
  ('bombanana', '커스텀 기록 리그', 3, 3, '{large}', 'audiovisual', '{skill_highlight,scream_sound}',
   '같은 커스텀 조건으로 3인 팀들이 클리어 기록을 겨룬다. 팀마다 다른 소통 스타일과 폭발 순간이 볼거리다.',
   '여러 3인 팀이 같은 커스텀 설정으로 각자 송출하며 기록을 겨루고, 시청자는 팀 응원과 기록 예측으로 참여한다.'),
  ('bombanana', '시청자 공모 폭탄 도전', 3, 3, '{small}', 'audiovisual', '{}',
   '팬카페에서 커스텀 설정을 공모받아 도전한다.',
   '팬카페에서 받은 커스텀 설정(폭탄 난이도·타이머·모듈)으로 3인이 도전한다.'),
  ('escape-from-playtime', '4인 탈출 런', 4, 4, '{small}', 'audiovisual', '{scream_sound,chemistry}',
   '비명과 케미가 함께 터지는 4인 탈출.', '4명이 각자 송출하며 공장을 탈출한다.'),
  ('escape-from-playtime', '8인 대인원 런', 8, 8, '{large}', 'audiovisual', '{scream_sound}',
   '8명의 비명이 각자 시점에서 다르게 들린다.', '8명이 각자 송출하며 같은 판에 들어가고, 시청자는 방송을 옮겨 다니며 본다.'),
  ('escape-from-playtime', '미니 모드 탐험', null, null, '{small}', 'visual', '{}',
   '익숙한 장소를 장난감 크기 시점으로 다시 보는 재미.', '장난감 크기로 줄어든 상태로 공장을 기어오르며 탐험한다.')
) as v(slug, title, rmin, rmax, tiers, appeal, points, appeal_text, how_to)
join games g on g.slug = v.slug;

insert into watchlist (developer_or_ip, note) values ('Mob Entertainment', 'Poppy Playtime');
