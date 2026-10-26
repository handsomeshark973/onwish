import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "./Button";

// 로딩 · 빈 상태 · 오류. 모두 "다음에 할 일"을 함께 안내한다.
// 제목·안내를 넘기지 않으면 공통 문구(states 번역)를 쓰고, action으로 다음 행동 버튼을 붙인다.
type Props = { title?: string; hint?: string; action?: ReactNode };

export function LoadingState({ title, hint }: Omit<Props, "action">) {
  const t = useTranslations("states");
  return (
    <div className="ow-state" role="status" aria-live="polite">
      <span className="ow-spinner" aria-hidden="true" />
      <p className="ow-state-title">{title ?? t("loadingTitle")}</p>
      <p className="ow-state-hint">{hint ?? t("loadingHint")}</p>
    </div>
  );
}

export function EmptyState({ title, hint, action }: Props) {
  const t = useTranslations("states");
  return (
    <div className="ow-state">
      <p className="ow-state-title">{title ?? t("emptyTitle")}</p>
      <p className="ow-state-hint">{hint ?? t("emptyHint")}</p>
      {action}
    </div>
  );
}

// onRetry를 주면 "다시 시도" 버튼이 붙는다(클라이언트 컴포넌트에서 쓸 때).
export function ErrorState({ title, hint, action, onRetry }: Props & { onRetry?: () => void }) {
  const t = useTranslations("states");
  return (
    <div className="ow-state ow-state-error" role="alert">
      <p className="ow-state-title">{title ?? t("errorTitle")}</p>
      <p className="ow-state-hint">{hint ?? t("errorHint")}</p>
      {action}
      {onRetry && <Button variant="secondary" onClick={onRetry}>{t("retry")}</Button>}
    </div>
  );
}
