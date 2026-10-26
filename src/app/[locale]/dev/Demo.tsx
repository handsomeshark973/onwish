"use client";

import { useState } from "react";
import { ChipGroup } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";

export function Demo() {
  const [tab, setTab] = useState("small");
  const [strengths, setStrengths] = useState<string[]>(["talk"]);
  return (
    <Tabs
      label="인원 규모"
      value={tab}
      onChange={setTab}
      tabs={[
        { value: "solo", label: "혼방" },
        { value: "small", label: "소수 합방" },
        { value: "large", label: "다수 합방" },
      ]}
    >
      <p className="ow-meta">선택한 탭: {tab} · 강점은 여러 개 고를 수 있어요</p>
      <ChipGroup
        label="강점"
        multiple
        value={strengths}
        onChange={setStrengths}
        options={[
          { value: "talk", label: "입담" },
          { value: "chemistry", label: "케미" },
          { value: "skill", label: "실력·피지컬" },
          { value: "creation", label: "창작" },
          { value: "reaction", label: "리액션" },
        ]}
      />
    </Tabs>
  );
}
