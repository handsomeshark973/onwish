"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLabels } from "@/i18n/labels";
import type { AudienceSize, HeatStage, MainAppeal } from "@/types/taxonomy";

const TIP_WIDTH = 256; // 툴팁 최대 폭(px). CSS의 .ow-tooltip max-width(16rem)와 같다

// 배지는 색과 글자를 항상 함께 쓴다. 색만으로 구분하지 않는다.
export function AppealBadge({ appeal }: { appeal: MainAppeal }) {
  const l = useLabels();
  return (
    <span className={`ow-badge ow-appeal-${appeal}`} title={l.appealHint[appeal]}>
      {l.appeal[appeal]}
    </span>
  );
}

// stage가 null이면 인기 상태를 아직 확인하지 못한 게임이다.
// 단계 배지는 짧은 설명 툴팁을 가진다: 마우스를 올리거나 키보드 포커스가 오면 열리고, 터치에서는 탭으로 열고 닫는다(바깥을 탭하거나 Esc로도 닫힌다).
// tip={false}는 링크 안처럼 버튼을 넣을 수 없는 곳에서 쓴다(설명은 그 화면의 다른 곳에 글자로 보인다).
export function StageBadge({ stage, tip = true }: { stage: HeatStage | null; tip?: boolean }) {
  const l = useLabels();
  const g = useTranslations("game");
  const id = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const lastPointer = useRef<string>("mouse");
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  // 열려 있는 동안 위치를 잡고, 스크롤·크기 변화·바깥 탭이 오면 닫는다
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const r = btnRef.current?.getBoundingClientRect();
      if (!r) return;
      const w = Math.min(TIP_WIDTH, window.innerWidth - 16);
      setPos({ left: Math.max(8, Math.min(r.left, window.innerWidth - w - 8)), top: r.bottom + 6 });
    };
    place();
    const close = () => setOpen(false);
    const outside = (e: PointerEvent) => {
      if (!btnRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", outside);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  if (!stage) return <span className="ow-badge ow-size">{g("popularityUnknown")}</span>;
  const cls = `ow-badge ow-stage-${stage}`;
  if (!tip) return <span className={cls}>{l.stage[stage]}</span>;
  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`${cls} ow-tip-btn`}
        aria-describedby={open ? id : undefined}
        onPointerDown={(e) => { lastPointer.current = e.pointerType; }}
        onPointerEnter={(e) => { if (e.pointerType === "mouse") setOpen(true); }}
        onPointerLeave={(e) => { if (e.pointerType === "mouse" && document.activeElement !== btnRef.current) setOpen(false); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        // 터치는 탭이 곧 열고 닫기. 마우스·키보드는 hover·포커스가 이미 열어 두었으므로 클릭으로 닫지 않는다.
        onClick={() => { if (lastPointer.current === "touch" || lastPointer.current === "pen") setOpen((v) => !v); }}
        onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
      >
        {l.stage[stage]}
      </button>
      {open && pos && createPortal(<span id={id} role="tooltip" className="ow-tooltip" ref={(el) => { if (el) { el.style.left = `${pos.left}px`; el.style.top = `${pos.top}px`; } }}>{l.stageHint[stage]}</span>, document.body)}
    </>
  );
}

export function SizeBadge({ size }: { size: AudienceSize }) {
  const l = useLabels();
  return <span className={`ow-badge ow-size ow-size-${size}`}>{l.audience[size]}</span>;
}
