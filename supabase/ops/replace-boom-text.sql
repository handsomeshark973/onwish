-- 단계 이름 변경 후 정리: 예전 시드에 들어간 "붐"(한창 인기라는 일반어) 문구를 바꾼다. 운영 DB에서 SQL Editor로 직접 실행한다.
-- 단계 이름(옛 "붐" 단계)과는 무관한 저장 문구다. 먼저 1)로 대상을 확인하고, 2)를 실행한 뒤 1)을 다시 돌려 0건인지 본다.

-- 1) 대상 확인
select 'games' as tbl, slug as ref, cautions from games where cautions like '%붐%'
union all
select 'contents', slug, cautions from contents where cautions like '%붐%';

-- 2) 바꾸기 (시드에 들어간 문장 그대로만 바꾼다. 다른 문장은 건드리지 않는다)
update games
set cautions = replace(cautions, '붐 기간은 짧게 잡고 큰 업데이트 때 다시 추천한다', '화제가 되는 기간은 짧게 잡고 큰 업데이트 때 다시 추천한다')
where cautions like '%붐 기간은 짧게 잡고 큰 업데이트 때 다시 추천한다%';

update contents
set cautions = replace(replace(cautions,
      '게임이 최신이라 붐 기간이 짧을 수 있어요. 붐이 지나면 상시 컨텐츠의 한 회차로 내려 가세요.',
      '게임이 최신이라 화제가 되는 기간이 짧을 수 있어요. 인기가 식으면 상시 컨텐츠의 한 회차로 내려 가세요.'),
    '붐 기간은 짧게 잡고 큰 업데이트 때 다시 추천한다', '화제가 되는 기간은 짧게 잡고 큰 업데이트 때 다시 추천한다')
where cautions like '%붐%';

-- 3) 남은 곳이 있으면(위 문장과 다르게 적힌 것) 1)이 알려 준다. 그때는 해당 행의 문장을 직접 고친다.
