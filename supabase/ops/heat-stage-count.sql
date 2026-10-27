-- 단계별 게임 수. 0007 적용 "전"에 한 번, "후"에 한 번 실행해서 결과를 비교한다.
-- 기대: 전의 golden 수 = 후의 rising 수, 전의 hot 수 = 후의 peak 수, 나머지(upcoming, cooling, evergreen, null)는 같다.
-- 승인된 게임만 보이는 화면과 맞추려면 where approval_status = 'approved'를 쓰고, 전체 수를 보려면 이 조건을 빼도 된다.
select coalesce(heat_stage, '(인기 확인 필요)') as stage, count(*) as games
from games_public
where approval_status = 'approved'
group by 1
order by 1;
