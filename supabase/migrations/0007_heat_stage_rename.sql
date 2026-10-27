-- 0007: 트렌드 단계 이름 변경. 단계는 저장된 값이 아니라 이 함수가 games_public 뷰에서 계산하는 값이라(0003),
-- 데이터 이전 없이 함수가 돌려주는 키만 바꾼다. 판정 조건은 그대로다.
--   golden → rising (뜨는 중)   hot → peak (골든타임)
-- popularity_status의 'hot'은 인기 상태라는 다른 값이므로 바꾸지 않는다.
-- 반환 형식(text)과 인자가 같아서 create or replace로 충분하고, games_public 뷰는 다시 만들 필요가 없다.
create or replace function compute_heat_stage(
  p_stage game_stage, p_phase release_phase, p_pop popularity_status, p_evergreen boolean
) returns text
language sql immutable as $$
  select case
    when p_phase = 'upcoming' or p_stage in ('announced', 'playtest') then 'upcoming'
    when p_evergreen then 'evergreen'
    when p_pop = 'unknown' then null
    when p_pop = 'hot' and p_phase = 'launch_window' then 'rising'
    when p_pop = 'hot' then 'peak'
    when p_pop = 'cooling' then 'cooling'
    when p_pop = 'evergreen' then 'evergreen'
  end
$$;
