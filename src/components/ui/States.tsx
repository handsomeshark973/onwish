import type { ReactNode } from "react";

// 로딩 · 빈 상태 · 오류. 모두 "다음에 할 일"을 함께 안내한다.
export function LoadingState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="ow-state" role="status" aria-live="polite">
      <span className="ow-spinner" aria-hidden="true" />
      <p className="ow-state-title">{title}</p>
      {hint && <p className="ow-state-hint">{hint}</p>}
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint: string; action?: ReactNode }) {
  return (
    <div className="ow-state">
      <p className="ow-state-title">{title}</p>
      <p className="ow-state-hint">{hint}</p>
      {action}
    </div>
  );
}

export function ErrorState({ title, hint, action }: { title: string; hint: string; action?: ReactNode }) {
  return (
    <div className="ow-state ow-state-error" role="alert">
      <p className="ow-state-title">{title}</p>
      <p className="ow-state-hint">{hint}</p>
      {action}
    </div>
  );
}
