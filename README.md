# my-startup 스타터 킷

국민대 AX-Startup 부트캠프에서 쓰는 Claude Code 작업 폴더입니다.
이 폴더 하나에 스타트업 하나의 결과물이 차례로 쌓입니다.

## 들어 있는 것

| 파일·폴더 | 하는 일 |
|---|---|
| `CLAUDE.md` | Claude가 대화를 시작할 때마다 먼저 읽는 업무 메모. 나·말투·프로젝트·규칙을 적습니다 |
| `.env.example` | 서비스 키를 넣는 양식. 복사해서 `.env`로 이름을 바꾸고 값을 채웁니다 |
| `.gitignore` | `.env`(키)가 GitHub에 올라가지 않게 막습니다 |
| `input/` | 내가 넣는 자료 (슘페터 PDF, 참고 자료 등) |
| `outputs/` | Claude가 만든 결과물 |
| `brand/` | `brand.json`, 로고 등 브랜드 키트. 모든 결과물이 여기 색·글꼴을 따릅니다 |
| `prompts.md` | 수업에서 쓰는 요청 예시 모음 |
| `.claude/skills/setup-check/` | `/setup-check` 한 줄로 서비스 연결을 점검하는 스킬 |
| `.claude/hooks/`, `.claude/settings.json` | 코드에 키가 직접 적히면 자동으로 경고하는 훅 |

## 처음 쓸 때

1. 압축을 풀어 문서 폴더에 둡니다. (폴더 이름은 영어, 띄어쓰기 없이)
2. Claude 앱 → Code 탭 → Local → 이 폴더 선택
3. `.env.example`을 `.env`로 복사하고 키를 채운 뒤 `/setup-check`

## 다음 프로젝트에 다시 쓰기

- **새 아이디어로 시작**: 이 폴더를 통째로 복사해 이름을 바꾸고(예: `my-startup-2`),
  `CLAUDE.md`의 프로젝트 칸과 `input/`, `outputs/`, `brand/`를 비웁니다.
  `.claude/` 안의 스킬과 훅, `.env`는 그대로 둡니다.
- **내가 만든 스킬 옮기기**: 수업에서 만든 `/cardnews`처럼 `.claude/skills/` 안의 폴더를
  새 프로젝트의 같은 위치에 복사하면 그대로 쓸 수 있습니다.
- **모든 프로젝트에서 쓰고 싶은 스킬**: 내 컴퓨터 사용자 폴더의 `.claude/skills/`에 두면
  어느 폴더에서든 불러올 수 있습니다.
- **스킬 늘리기**: 같은 일을 두 번 이상 하면 "방금 한 과정을 스킬로 저장해 줘"라고 하세요.
  예: `/weekly-report`, `/press-release`, `/sns-post`
- **회사 일에 쓰기**: `CLAUDE.md`에 회사·직무·문서 양식 규칙을 적어 두면
  매번 설명하지 않아도 회사 말투로 일합니다.

## 지켜 주세요

- 키는 `.env`에만. CLAUDE.md, 채팅, 캡처, 메신저에 붙이지 않습니다.
- 키가 새면 해당 서비스에서 바로 삭제하고 새로 받습니다.
