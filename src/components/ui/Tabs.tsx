"use client";

import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";

type Tab = { value: string; label: string };

type Props = {
  label: string;
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
  children: ReactNode; // 선택된 탭의 내용
};

// 혼방 / 소수 합방 / 다수 합방처럼 쓰는 탭. 좌우 화살표 키로 이동한다.
export function Tabs({ label, tabs, value, onChange, children }: Props) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent, index: number) {
    const last = tabs.length - 1;
    let next = index;
    if (e.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (e.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else return;
    e.preventDefault();
    onChange(tabs[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div>
      <div className="ow-tabs" role="tablist" aria-label={label}>
        {tabs.map((t, i) => {
          const selected = t.value === value;
          return (
            <button
              key={t.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              id={`${id}-tab-${t.value}`}
              role="tab"
              type="button"
              className="ow-tab"
              aria-selected={selected}
              aria-controls={`${id}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(t.value)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${value}`}
        className="ow-tabpanel"
      >
        {children}
      </div>
    </div>
  );
}
