"use client";

import { useTranslations } from "next-intl";
import { useRef, useState, useSyncExternalStore, useTransition } from "react";
import { saveCustomerProfile } from "@/actions/customer";
import { EXPERIENCES, PLATFORMS, type CustomerType, type Experience, type Platform, CUSTOMER_TYPES } from "@/config/customerTypes";
import { ChipGroup } from "@/components/ui/Chip";

export type CustomerInit = { customerType: CustomerType | null; platforms: Platform[]; experience: Experience | null };

// 추천 폼 맨 앞의 "주로 어떻게 방송하세요?" 질문. 필수가 아니고 진행을 막지 않는다.
// 처음 오면 눈에 띄게 보이고, [나중에 할게요]로 닫으면 이 브라우저에서는 다시 묻지 않는다(한 줄로 줄어든다).
const KEY = "ow_ctype_prompt_dismissed";
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => void listeners.delete(cb);
};
const read = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

export function CustomerTypeQuestion({ initial }: { initial: CustomerInit }) {
  const t = useTranslations("recommend.customer");
  const tx = useTranslations("taxonomy");
  const dismissed = useSyncExternalStore(subscribe, read, () => true); // 서버 화면에서는 줄인 모양으로 시작해 깜빡임을 막는다
  const [type, setType] = useState<CustomerType | null>(initial.customerType);
  const [platforms, setPlatforms] = useState<string[]>(initial.platforms);
  const [exp, setExp] = useState<string | null>(initial.experience);
  const [opened, setOpened] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [, start] = useTransition();
  const seq = useRef(0);

  function save(next: { type: CustomerType | null; platforms: string[]; exp: string | null }) {
    const my = ++seq.current;
    start(async () => {
      try {
        const r = await saveCustomerProfile({ customerType: next.type, platforms: next.platforms, experience: next.exp });
        if (my === seq.current) setStatus(r.status === "saved" ? "saved" : "error");
      } catch {
        if (my === seq.current) setStatus("error");
      }
    });
  }

  const full = type !== null || opened || !dismissed;
  if (!full) {
    return (
      <p className="ow-note ow-ctype-compact">
        {t("compact")} <button type="button" className="ow-btn ow-btn-ghost ow-btn-sm" onClick={() => setOpened(true)}>{t("choose")}</button>
      </p>
    );
  }

  return (
    <fieldset className="ow-field ow-ctype">
      <legend>{t("question")}</legend>
      <ChipGroup
        label={t("question")}
        options={CUSTOMER_TYPES.map((v) => ({ value: v, label: t(`choice.${v}`) }))}
        value={type ? [type] : []}
        onChange={(n) => {
          const v = (n[0] as CustomerType | undefined) ?? null;
          setType(v);
          save({ type: v, platforms, exp });
        }}
      />
      <p className="ow-hint">{t("hint")}</p>
      <details className="ow-details" open={platforms.length > 0 || exp !== null}>
        <summary>{t("more")}</summary>
        <div className="ow-field">
          <span className="ow-label">{t("platforms")}</span>
          <ChipGroup
            label={t("platforms")}
            multiple
            options={PLATFORMS.map((v) => ({ value: v, label: tx(`platform.${v}`) }))}
            value={platforms}
            onChange={(n) => { setPlatforms(n); save({ type, platforms: n, exp }); }}
          />
        </div>
        <div className="ow-field">
          <span className="ow-label">{t("experience")}</span>
          <ChipGroup
            label={t("experience")}
            options={EXPERIENCES.map((v) => ({ value: v, label: tx(`experience.${v}`) }))}
            value={exp ? [exp] : []}
            onChange={(n) => { const v = n[0] ?? null; setExp(v); save({ type, platforms, exp: v }); }}
          />
        </div>
      </details>
      {status === "saved" && <p className="ow-meta" role="status">{t("saved")}</p>}
      {status === "error" && <p className="ow-meta" role="alert">{t("saveError")}</p>}
      {type === null && !dismissed && (
        <button
          type="button"
          className="ow-btn ow-btn-ghost ow-btn-sm"
          onClick={() => {
            try { localStorage.setItem(KEY, "1"); } catch { /* 저장할 수 없으면 이번 화면에서만 닫힌다 */ }
            listeners.forEach((l) => l());
          }}
        >
          {t("later")}
        </button>
      )}
    </fieldset>
  );
}
