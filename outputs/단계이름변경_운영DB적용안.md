# 트렌드 단계 이름 변경 — 운영 DB 적용 순서 (직접 실행용)

단계(`golden`/`hot`)는 DB에 저장된 값이 아니라 `compute_heat_stage()` 함수가 계산하는 값입니다. 그래서 **데이터는 바뀌지 않고, 함수 한 개만 교체**합니다.

## 순서

1. **(코드 먼저) 옛 키·새 키를 모두 받는 코드를 배포합니다.** 2단계 작업에서 `heat_stage` 값을 읽을 때 `golden→rising`, `hot→peak`로 변환하도록 해 두므로, 이 코드는 함수가 바뀌기 전과 후 모두 정상 동작합니다. (이 파일의 순서 3은 이 배포가 끝난 뒤에 합니다.)
2. **적용 전 개수 저장** — Supabase SQL Editor에서 [heat-stage-count.sql](../supabase/ops/heat-stage-count.sql)을 실행하고 결과를 복사해 둡니다.
3. **마이그레이션 적용** — [0007_heat_stage_rename.sql](../supabase/migrations/0007_heat_stage_rename.sql) 전체를 붙여 넣고 Run. `Success. No rows returned`가 나오면 됩니다. (여러 번 실행해도 안전합니다.)
4. **적용 후 개수 비교** — 같은 쿼리를 다시 실행합니다. `golden`이던 수 = `rising` 수, `hot`이던 수 = `peak` 수, 나머지는 같아야 합니다.
5. 사이트 `/ko/radar`, `/ko`에서 배지 이름과 정렬을 확인합니다. (캐시가 몇 분 있어 바로 안 바뀔 수 있습니다.)

## 함께 할 일: 저장된 "붐" 문구 정리

옛 시드로 운영 DB에 들어간 문구 중 "붐 기간은…" 같은 일반어가 있습니다(단계 이름과는 무관). [replace-boom-text.sql](../supabase/ops/replace-boom-text.sql)의 1)로 대상을 확인하고 2)를 실행하면 바뀝니다. 코드·i18n·문서에는 "붐"이 남아 있지 않습니다.

## 되돌리기

[0007_heat_stage_rename.down.sql](../supabase/migrations-down/0007_heat_stage_rename.down.sql)을 실행하면 함수가 원래 키로 돌아갑니다. 1단계의 코드는 두 키를 모두 받으므로 코드를 되돌릴 필요가 없습니다.

## 시험 결과 (임시 DB, `npm run db:verify:heat`)

게임 19개(모든 단계 조합)로 시험했습니다. 적용 전 golden 4 / hot 4 → 적용 후 rising 4 / peak 4, 나머지 단계 수 불변, 저장된 `popularity_status` 불변, 되돌리기·재적용 모두 통과.
