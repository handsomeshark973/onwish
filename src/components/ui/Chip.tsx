"use client";

type Option = { value: string; label: string };

type Props = {
  label: string; // 그룹 이름 (스크린리더용)
  options: Option[];
  value: string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
};

// 칩 선택. multiple이면 복수 선택, 아니면 하나만 고른다.
export function ChipGroup({ label, options, value, onChange, multiple = false }: Props) {
  function toggle(v: string) {
    if (!multiple) return onChange(value.includes(v) ? [] : [v]);
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }
  return (
    <div className="ow-chips" role="group" aria-label={label}>
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            className="ow-chip"
            aria-pressed={on}
            onClick={() => toggle(o.value)}
          >
            {on ? "✓ " : ""}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
