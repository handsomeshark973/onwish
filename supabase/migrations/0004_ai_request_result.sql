-- 같은 요청을 다시 보내면 AI를 다시 부르지 않고, 처음 만든 결과를 그대로 돌려주기 위해 결과를 함께 저장한다.
alter table ai_requests add column if not exists result jsonb;
