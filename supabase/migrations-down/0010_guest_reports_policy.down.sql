drop policy if exists reports_insert on error_reports;
create policy reports_insert on error_reports for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'open' and handled_by is null);
