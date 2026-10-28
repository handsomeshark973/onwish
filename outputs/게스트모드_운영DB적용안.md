# 게스트 모드 운영 DB 적용안

운영 DB에는 직접 실행하지 않았습니다. 아래 순서대로 적용해 주세요.

## 실행 순서
1. **Supabase 대시보드 → Authentication → Sign In / Providers → Anonymous Sign-Ins 를 켠다.** (끄면 게스트가 만들어지지 않고 추천 화면에 "지금은 바로 시작할 수 없어요"가 나옵니다.)
2. SQL 편집기에서 `supabase/migrations/0009_guest_mode.sql` 실행.
   - `guest_activity` 표(활동·만료일), `purge_expired_guests()` 함수, 게스트를 관리자에서 제외하는 `is_admin()` 보강이 들어 있습니다.
3. Vercel에 배포. `vercel.json`에 `/api/cron/guest-cleanup`(매일 04:30 한국 시간)이 추가되어 있고, 기존 `CRON_SECRET`을 그대로 씁니다.
4. (선택) Vercel 환경 변수로 한도 조정: `GUEST_AI_DAILY_LIMIT`(기본 3), `GUEST_AI_PER_IP_PER_DAY`(기본 30), `GUEST_CREATES_PER_IP_PER_HOUR`(기본 10).

## 순서를 지켜야 하는 이유
- 2번 전에 배포해도 서비스는 동작합니다(활동 기록만 못 남기고 로그를 남김). 다만 만료 정리는 2번 이후에 동작합니다.
- 1번을 안 켜면 게스트 생성이 실패합니다.

## 되돌리기
`supabase/migrations-down/0009_guest_mode.down.sql`

## 확인용 SQL
```sql
select count(*) from auth.users where is_anonymous;          -- 게스트 수
select purge_expired_guests();                                -- 수동 정리(만료분만)
```
