# ONWISH 배포 안내

## 1. Vercel 환경변수 (Production)

| 이름 | 값 | 비고 |
|---|---|---|
| `SUPABASE_URL` | Supabase 프로젝트 주소 | 빌드에 쓰이므로 Production·Preview 모두 |
| `SUPABASE_ANON_KEY` | 공개(anon/publishable) 키 | 〃 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 관리 키 | **Sensitive로 저장.** 브라우저로 나가지 않음 |
| `NEXT_PUBLIC_SITE_DOMAIN` | `onwish.live` | 비워 두면 기본값 onwish.live |
| `ONWISH_AI` | `off` | AI 추천 끄기. Anthropic 키가 정상일 때 이 줄을 지우면 켜짐 |
| `ANTHROPIC_API_KEY`, `CLAUDE_MODEL` | (선택) | `ONWISH_AI=off`이면 쓰이지 않음 |
| `AUTH_EMAIL_MODE` | 비움(= Resend 키 있으면 `resend`, 없으면 `supabase`) | 아래 3번 참고 |
| `RESEND_API_KEY`, `AUTH_EMAIL_FROM` | (선택) | Resend로 인증 메일을 보낼 때 |

넣지 말 것: `ONWISH_SAMPLE_DATA`(개발 전용), `ONWISH_TEST_EMAIL`, `ONWISH_TEST_PASSWORD`(시험 계정)

## 2. Supabase 설정 (Authentication → URL Configuration)
- Site URL: `https://onwish.live`
- Redirect URLs: `https://onwish.live/auth/callback`, `http://localhost:3000/auth/callback`
- Sign In / Providers → Email: Confirm email 켜기, 메일 링크 유효시간(OTP expiry) 3600초
- Resend 없이 운영하면 Supabase 기본 메일은 시간당 발송 수가 매우 적다. 공개 전에 Custom SMTP(또는 Resend) 연결을 권장한다.

## 3. 인증 메일 방식
- `supabase`: Supabase가 자기 양식으로 보낸다(영문 기본 양식).
- `resend`: 우리 코드가 한국어/영어 메일을 Resend로 보낸다. Resend에서 도메인 인증 후 `AUTH_EMAIL_FROM`에 그 주소를 쓴다.

## 4. 도메인 연결 (onwish.live)
Vercel 프로젝트 → Settings → Domains → `onwish.live` 추가 → 안내되는 DNS 레코드를 도메인 등록 업체에서 설정.

## 5. 배포 직후 점검
- `/ko`, `/en` 열림, `/robots.txt`, `/sitemap.xml`
- 가입 → 인증 메일 → 로그인 → 로그아웃 → 비밀번호 찾기 → 재설정
- Supabase에서 시험 계정(`onwish.test@example.com`) 삭제
- `/ko/dev` 가 404인지
