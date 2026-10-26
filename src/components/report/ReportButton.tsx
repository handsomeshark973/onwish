"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { submitReport } from "@/actions/report";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";

type Props = {
  targetType: "game" | "game_format" | "content" | "recommendation";
  targetId: string | null;
  label: string; // 신고 대상 이름(내용에 함께 적힌다)
  loginNext: string;
};

export function ReportButton({ targetType, targetId, label, loginNext }: Props) {
  const t = useTranslations("report");
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "sent" | "login" | "error" | "too_many">("idle");
  const [pending, start] = useTransition();

  if (state === "sent") return <p className="ow-meta" role="status">{t("sent")}</p>;

  const fieldId = `report-${targetType}-${targetId ?? label}`;
  return (
    <div>
      <Button variant="ghost" onClick={() => setOpen((v) => !v)} aria-expanded={open}>{t("button")}</Button>
      {open && (
        <form
          className="ow-form"
          method="post"
          style={{ marginTop: "var(--space-3)", maxWidth: 480 }}
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await submitReport({ targetType, targetId, message: `[${label}] ${text}` });
              setState(r.status === "sent" ? "sent" : r.status === "login_required" ? "login" : r.status === "too_many" ? "too_many" : "error");
            });
          }}
        >
          <div className="ow-field">
            <label className="ow-label" htmlFor={fieldId}>{t("question")}</label>
            <textarea id={fieldId} className="ow-textarea" required maxLength={1900} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("placeholder")} />
          </div>
          {state === "login" && <p className="ow-note" role="alert">{t("login")} <Link href={`/login?next=${encodeURIComponent(loginNext)}`}>{t("loginLink")}</Link></p>}
          {state === "too_many" && <p className="ow-note" role="alert">{t("tooMany")}</p>}
          {state === "error" && <p className="ow-note" role="alert">{t("error")}</p>}
          <Button type="submit" disabled={pending || !text.trim()}>{pending ? t("sending") : t("send")}</Button>
        </form>
      )}
    </div>
  );
}
