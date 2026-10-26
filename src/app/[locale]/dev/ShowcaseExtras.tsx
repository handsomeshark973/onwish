"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FilterSheet } from "@/components/ui/FilterSheet";
import { ChipGroup } from "@/components/ui/Chip";
import { ErrorState } from "@/components/ui/States";

// 클라이언트 동작이 필요한 부품 예시(필터 시트·칩 단일 선택·오류 다시 시도)
export function ShowcaseExtras() {
  const [mode, setMode] = useState<string[]>(["solo"]);
  const [tries, setTries] = useState(0);
  return (
    <>
      <div className="ow-card-badges">
        <FilterSheet activeCount={mode.length} onReset={() => setMode([])}>
          <fieldset className="ow-field">
            <legend>진행 방식(단일 선택)</legend>
            <ChipGroup label="진행 방식" options={[{ value: "solo", label: "혼방" }, { value: "small", label: "소수" }, { value: "large", label: "다수" }]} value={mode} onChange={setMode} />
          </fieldset>
        </FilterSheet>
        <Button variant="ghost" onClick={() => setTries((n) => n + 1)}>오류 화면 다시 시도 {tries}회</Button>
      </div>
      <ErrorState onRetry={() => setTries((n) => n + 1)} />
    </>
  );
}
