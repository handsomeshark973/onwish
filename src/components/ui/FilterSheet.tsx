"use client";

import { useTranslations } from "next-intl";
import { useRef, type ReactNode } from "react";
import { Button } from "./Button";

// 필터를 담는 시트. 휴대폰에서는 아래에서 올라오고, 넓은 화면에서는 가운데에 뜬다.
// <dialog>는 Esc 키와 포커스 가두기를 브라우저가 처리해 준다.
export function FilterSheet({ activeCount, onReset, children }: { activeCount: number; onReset: () => void; children: ReactNode }) {
  const t = useTranslations("filter");
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <Button variant="secondary" onClick={() => ref.current?.showModal()}>
        {activeCount > 0 ? t("withCount", { n: activeCount }) : t("title")}
      </Button>
      <dialog
        ref={ref}
        className="ow-sheet"
        aria-label={t("title")}
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close(); // 바깥을 누르면 닫힘
        }}
      >
        <div className="ow-sheet-inner">
          <div className="ow-sheet-head">
            <h2>{t("title")}</h2>
            <Button variant="ghost" onClick={() => ref.current?.close()}>{t("close")}</Button>
          </div>
          {children}
          <div className="ow-sheet-foot">
            <Button variant="ghost" onClick={onReset}>{t("reset")}</Button>
            <Button onClick={() => ref.current?.close()}>{t("show")}</Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
