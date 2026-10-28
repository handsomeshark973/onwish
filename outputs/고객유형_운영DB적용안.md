# 고객 유형 운영 DB 적용안

운영 DB에는 직접 실행하지 않았습니다. 게스트 모드(0009, 0010)가 이미 적용되어 있다는 전제입니다.

## 실행 순서
1. `supabase/migrations/0011_customer_profiles.sql` 실행 — `customer_profiles`, `user_events` 표, 권한 규칙, `customer_touch()` 함수.
2. `supabase/migrations/0012_admin_customers.sql` 실행 — 관리자 집계 함수 4개와 집계용 인덱스.
3. 배포. (코드는 0011이 없어도 오류 없이 동작하지만 고객 정보는 쌓이지 않습니다. `/admin/customers`는 0012가 있어야 열립니다.)
4. 크론: 새로 추가하지 않았습니다. 기존 `/api/cron/guest-cleanup`(매일 04:30 KST)이 게스트 정리 → 유형 추정 → 180일 지난 이벤트 삭제를 순서대로 합니다. Vercel 무료 플랜의 크론 2개 제한 안입니다.

## 되돌리기
`supabase/migrations-down/0012_admin_customers.down.sql` → `0011_customer_profiles.down.sql` 순서.

## 적용 후 확인
```sql
select count(*) from customer_profiles;
select type, count(*) from user_events group by 1;
select * from admin_customer_summary();  -- 관리자 로그인 상태가 아니면 forbidden 이 정상입니다
```
화면 확인: 관리자 계정으로 `/admin/customers`. 게스트나 일반 계정으로 열면 404, `/api/admin/customers`도 404입니다.
