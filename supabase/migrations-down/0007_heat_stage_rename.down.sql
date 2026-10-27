-- 0007 되돌리기: 함수를 0003의 원래 키(golden, hot)로 복원한다. 저장된 데이터는 건드리지 않는다.
create or replace function compute_heat_stage(
  p_stage game_stage, p_phase release_phase, p_pop popularity_status, p_evergreen boolean
) returns text
language sql immutable as $$
  select case
    when p_phase = 'upcoming' or p_stage in ('announced', 'playtest') then 'upcoming'
    when p_evergreen then 'evergreen'
    when p_pop = 'unknown' then null
    when p_pop = 'hot' and p_phase = 'launch_window' then 'golden'
    when p_pop = 'hot' then 'hot'
    when p_pop = 'cooling' then 'cooling'
    when p_pop = 'evergreen' then 'evergreen'
  end
$$;
