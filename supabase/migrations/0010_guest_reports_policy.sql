-- 0010: 게스트(익명 사용자)는 오류 신고를 DB에 직접 넣을 수 없게 한다.
-- 익명 사용자도 authenticated 역할이라, 막지 않으면 브라우저에서 API를 직접 불러 서버의 하루 20건 제한을 피해 신고를 쌓을 수 있다.
-- 화면의 신고 버튼은 서버 동작(submitReport)이 제한을 확인한 뒤 서버 권한으로 기록하므로 게스트도 계속 신고할 수 있다.
drop policy if exists reports_insert on error_reports;
create policy reports_insert on error_reports for insert to authenticated
  with check (
    reporter_id = auth.uid() and status = 'open' and handled_by is null
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );
