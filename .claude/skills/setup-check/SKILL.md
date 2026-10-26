---
name: setup-check
description: 작업 폴더의 .env와 로그인 상태를 점검해서 9개 서비스(GitHub, Vercel, v0, Supabase, Resend, Sentry, Anthropic API, Inngest, ConvertAPI)가 연결됐는지 표로 보여 준다. "/setup-check", "연결 확인", "세팅 점검" 요청에 쓴다.
---

# 서비스 연결 점검

수강생이 9개 서비스에 가입하고 키를 .env에 넣었는지, 실제로 접속되는지 확인한다. 키 값을 화면에 절대 출력하지 않는다.

## 지켜야 할 것

- 키 값은 어디에도 출력하지 않는다. 필요하면 앞 4글자만 보이고 나머지는 `****`로 가린다.
- 읽기만 하는 요청만 보낸다. 메일 발송, 데이터 생성, 결제처럼 무언가를 만드는 요청은 보내지 않는다.
- 셸이 PowerShell이면 `curl` 대신 `curl.exe`를 쓴다.
- 확인이 안 되는 항목은 추측하지 말고 "직접 확인"으로 표시한다.

## 순서

1. 작업 폴더에 `.env`가 있는지 본다. 없고 `.env.example`만 있으면 복사해서 `.env`를 만들어 주고, 값을 채워야 한다고 안내한 뒤 멈춘다.
2. `.gitignore`에 `.env`가 들어 있는지 확인한다. 없으면 추가한다.
3. 아래 항목을 하나씩 점검한다.

| 서비스 | 확인 방법 | ✓ 기준 |
|---|---|---|
| Node.js | `node -v` | 버전이 나오면 ✓ |
| Git | `git --version` | 버전이 나오면 ✓ |
| GitHub | `gh auth status` (gh가 없으면 "직접 확인: github.com 로그인") | 로그인돼 있으면 ✓ |
| Vercel | `npx vercel whoami` | 계정 이름이 나오면 ✓. 로그인이 안 됐으면 터미널 패널에서 `npx vercel login`을 직접 하라고 안내 |
| v0.app | 확인할 키 없음 | "직접 확인: v0.app에 Vercel 계정으로 로그인" |
| Supabase | `SUPABASE_URL`, `SUPABASE_ANON_KEY` 있음 → `GET {SUPABASE_URL}/rest/v1/` 에 헤더 `apikey`와 `Authorization: Bearer` | 200이면 ✓ |
| Resend | `RESEND_API_KEY`가 `re_`로 시작 → `GET https://api.resend.com/domains` 에 `Authorization: Bearer` | 200이면 ✓. 401이면서 발송 전용 키라는 응답이면 ✓(발송 전용 키) |
| Sentry | `SENTRY_DSN`이 `https://…@….ingest….sentry.io/숫자` 모양 | 모양이 맞으면 ✓ |
| Anthropic API | `GET https://api.anthropic.com/v1/models` 에 헤더 `x-api-key`, `anthropic-version: 2023-06-01` | 200이면 ✓. 크레딧이 없어도 이 확인은 통과할 수 있다고 덧붙인다 |
| Inngest | `INNGEST_EVENT_KEY` 있음, `INNGEST_SIGNING_KEY`가 `signkey-`로 시작 | 둘 다 맞으면 ✓ |
| ConvertAPI | `CONVERTAPI_TOKEN` 있음 | 값이 있으면 ✓(형식만 확인) |

HTTP 확인은 응답 코드만 본다. 예: `curl -s -o /dev/null -w "%{http_code}" …`

## 결과 보여 주기

마지막에 아래 모양의 표 하나로 정리한다.

```
서비스          결과   메모
Node.js         ✓     v22.x
GitHub          ✓     로그인됨
Supabase        ✓     접속 성공
Inngest         ✗     Signing Key 없음
v0.app          ?     직접 확인
```

- ✗ 항목마다 "어디서 무엇을 받아서 .env의 어느 칸에 넣는지" 한 줄씩 알려 준다.
- 모두 ✓이면 "9개 서비스 연결 완료!"라고 마무리한다.
- 점검 결과를 log.md에 "날짜 | /setup-check | ✓ n개, ✗ n개" 한 줄로 남긴다 (키 값은 남기지 않는다).
