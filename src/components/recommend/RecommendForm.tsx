"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { requestRecommendation } from "@/actions/recommend";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/Chip";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { Tabs } from "@/components/ui/Tabs";
import { useLabels } from "@/i18n/labels";
import { Link } from "@/i18n/navigation";
import { useReady } from "@/lib/use-ready";
import type { ProfileInput } from "@/lib/recommend/schema";
import type { RecommendNotice, RecommendResult } from "@/lib/recommend/types";
import { TAXONOMY_KEYS, type PlayerTier } from "@/types/taxonomy";
import { PickCard } from "./PickCard";

type Device = "PC" | "PS5" | "SWITCH" | "VR";
type Member = { name: string; note: string; devices: Device[]; ownedGameIds: string[] };
type Quota = { used: number; remaining: number; limit: number; nextReset: string } | null;

const opts = (keys: readonly string[], map: Record<string, string>) => keys.map((k) => ({ value: k, label: map[k] }));
const DEVICES = (["PC", "PS5", "SWITCH", "VR"] as Device[]).map((d) => ({ value: d, label: d }));
const yn = (b: boolean) => (b ? "yes" : "no");
const emptyMember = (): Member => ({ name: "", note: "", devices: ["PC"], ownedGameIds: [] });

// 한 칸짜리 선택(칩). 값이 없으면 빈 문자열.
function Single({ label, options, value, onChange }: { label: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <fieldset className="ow-field">
      <legend>{label}</legend>
      <ChipGroup label={label} options={options} value={value ? [value] : []} onChange={(n) => onChange(n[0] ?? "")} />
    </fieldset>
  );
}

export function RecommendForm({ games, initial, quota: initialQuota, aiOn }: { games: { id: string; name: string }[]; initial: Partial<ProfileInput> | null; quota: Quota; aiOn: boolean }) {
  const t = useTranslations("recommend");
  const common = useTranslations("common");
  const te = useTranslations("recoErrors");
  const locale = useLocale();
  const l = useLabels();
  const YES_NO = [{ value: "yes", label: common("yes") }, { value: "no", label: common("no") }];
  const resetDate = (iso: string) => new Date(iso).toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", { timeZone: "Asia/Seoul", month: "long", day: "numeric" });
  const noticeText = (n: RecommendNotice, q: Quota) => (n === "quota" ? t("notice.quota", { date: q ? t("notice.quotaDate", { date: resetDate(q.nextReset) }) : "" }) : t(`notice.${n}`));

  const i = initial;
  const [tier, setTier] = useState<PlayerTier>(i?.mode ?? "solo");
  const [strengths, setStrengths] = useState<string[]>(i?.strengths ?? []);
  const [persona, setPersona] = useState(i?.persona ?? "");
  const [usesCam, setUsesCam] = useState(yn(i?.usesCam ?? true));
  const [audience, setAudience] = useState<string>(i?.audience ?? "m");
  const [devices, setDevices] = useState<string[]>(i?.devices ?? ["PC"]);
  const [length, setLength] = useState<string>(i?.length ?? "single");
  const [timeSlot, setTimeSlot] = useState<string>(i?.timeSlot ?? "evening");
  const [goal, setGoal] = useState<string>(i?.goal ?? "both");
  const [hasCommunity, setHasCommunity] = useState(yn(i?.hasCommunity ?? false));
  const [communityActivity, setCommunityActivity] = useState<string>(i?.communityActivity ?? "mid");
  const [allowRotation, setAllowRotation] = useState(yn(i?.allowRotation ?? false));
  const [allowLeague, setAllowLeague] = useState(yn(i?.allowLeague ?? false));
  const [excludedGenres, setExcludedGenres] = useState((i?.excludedGenres ?? []).join(", "));
  const [avoid, setAvoid] = useState<string[]>([i?.avoidHorror && "horror", i?.avoidMotionSickness && "motion", i?.avoidSpoilers && "spoiler"].filter(Boolean) as string[]);
  const [includeTrend, setIncludeTrend] = useState(yn(i?.includeTrend ?? true));
  const [chemistry, setChemistry] = useState<string>(i?.chemistryLevel ?? "some");
  const [structures, setStructures] = useState<string[]>(i?.desiredStructures ?? []);
  const [members, setMembers] = useState<Member[]>(
    i?.members?.length ? i.members.map((m) => ({ name: m.name, note: m.note, devices: m.devices, ownedGameIds: m.ownedGameIds ?? [] })) : [emptyMember(), emptyMember()],
  );

  const ready = useReady(); // 화면이 연결되기 전에 제출되어 입력값이 주소창에 붙는 것을 막는다
  const [pending, start] = useTransition();
  const [state, setState] = useState<{ kind: "idle" } | { kind: "ok"; result: RecommendResult; profile: ProfileInput } | { kind: "login" } | { kind: "invalid"; message: string } | { kind: "error" }>({ kind: "idle" });
  const [quota, setQuota] = useState<Quota>(initialQuota);
  const requestId = useRef<string | null>(null);

  const isGroup = tier !== "solo";
  const patch = (idx: number, p: Partial<Member>) => setMembers((m) => m.map((x, j) => (j === idx ? { ...x, ...p } : x)));

  function buildProfile(): ProfileInput {
    const base = {
      mode: tier,
      strengths: strengths as ProfileInput["strengths"],
      persona,
      usesCam: usesCam === "yes",
      audience: audience as ProfileInput["audience"],
      devices: (devices.length ? devices : ["PC"]) as Device[],
      length: length as ProfileInput["length"],
      timeSlot: timeSlot as ProfileInput["timeSlot"],
      goal: goal as ProfileInput["goal"],
      hasCommunity: hasCommunity === "yes",
      communityActivity: hasCommunity === "yes" ? (communityActivity as "low" | "mid" | "high") : undefined,
      allowRotation: isGroup && allowRotation === "yes",
      allowLeague: isGroup && allowLeague === "yes",
      excludedGameIds: [], // 제외할 게임 선택 칸은 없앴다(장르 제외와 공포·멀미·스포일러 회피는 그대로)
      excludedGenres: excludedGenres.split(",").map((s) => s.trim()).filter(Boolean),
      avoidHorror: avoid.includes("horror"),
      avoidMotionSickness: avoid.includes("motion"),
      avoidSpoilers: avoid.includes("spoiler"),
      includeTrend: includeTrend === "yes",
    };
    if (!isGroup) return base;
    return {
      ...base,
      memberCount: members.length,
      members: members.map((m) => ({ name: m.name, note: m.note, devices: (m.devices.length ? m.devices : ["PC"]) as Device[], ownedGameIds: m.ownedGameIds })),
      chemistryLevel: chemistry as "first" | "some" | "long",
      desiredStructures: structures as ProfileInput["desiredStructures"],
    };
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    requestId.current = crypto.randomUUID(); // 요청마다 번호를 붙여 같은 요청이 두 번 차감되지 않게 한다
    const profile = buildProfile();
    setState({ kind: "idle" });
    start(async () => {
      try {
        const res = await requestRecommendation(profile, requestId.current!, locale);
        if (res.status === "ok") {
          setState({ kind: "ok", result: res.result, profile });
          if (res.result.quota) setQuota(res.result.quota);
        } else if (res.status === "login_required") setState({ kind: "login" });
        else if (res.status === "invalid") setState({ kind: "invalid", message: res.message });
        else setState({ kind: "error" });
      } catch {
        setState({ kind: "error" });
      }
    });
  }

  return (
    <div className="ow-reco-layout">
      <form className="ow-form" method="post" onSubmit={submit}>
        {aiOn && quota && <p className="ow-note">{t("quota", { n: quota.remaining, limit: quota.limit, date: resetDate(quota.nextReset) })}</p>}
        <Tabs label={t("formTab")} value={tier} onChange={(v) => setTier(v as PlayerTier)} tabs={TAXONOMY_KEYS.tier.map((v) => ({ value: v, label: l.tier[v] }))}>
          <div className="ow-form">
            <fieldset className="ow-field">
              <legend>{t("strengths")}</legend>
              <ChipGroup label={t("strengths")} multiple options={opts(TAXONOMY_KEYS.strength, l.strength)} value={strengths} onChange={setStrengths} />
            </fieldset>
            <div className="ow-field">
              <label className="ow-label" htmlFor="persona">{t("persona")}</label>
              <input id="persona" className="ow-input" maxLength={500} value={persona} onChange={(e) => setPersona(e.target.value)} placeholder={t("personaPh")} />
            </div>
            <Single label={t("usesCam")} options={YES_NO} value={usesCam} onChange={setUsesCam} />
            <Single label={t("audience")} options={opts(TAXONOMY_KEYS.audience, l.audience)} value={audience} onChange={setAudience} />
            <fieldset className="ow-field">
              <legend>{t("devices")}</legend>
              <ChipGroup label={t("devices")} multiple options={DEVICES} value={devices} onChange={setDevices} />
            </fieldset>
            <Single label={t("length")} options={opts(TAXONOMY_KEYS.length, l.length)} value={length} onChange={setLength} />
            <Single label={t("timeSlot")} options={opts(TAXONOMY_KEYS.timeSlot, l.timeSlot)} value={timeSlot} onChange={setTimeSlot} />
            <Single label={t("goal")} options={opts(TAXONOMY_KEYS.goal, l.goal)} value={goal} onChange={setGoal} />
            <Single label={t("hasCommunity")} options={YES_NO} value={hasCommunity} onChange={setHasCommunity} />
            {hasCommunity === "yes" && (
              <Single label={t("communityActivity")} options={[{ value: "low", label: t("act.low") }, { value: "mid", label: t("act.mid") }, { value: "high", label: t("act.high") }]} value={communityActivity} onChange={setCommunityActivity} />
            )}
            <Single label={t("includeTrend")} options={YES_NO} value={includeTrend} onChange={setIncludeTrend} />

            {isGroup && (
              <>
                <h2 className="ow-h2" style={{ margin: 0 }}>{t("groupInfo")}</h2>
                <p className="ow-hint">{t("groupHint")}</p>
                {members.map((m, idx) => (
                  <div key={idx} className="ow-member">
                    <label className="ow-label" htmlFor={`m-name-${idx}`}>{t("memberNo", { n: idx + 1 })}</label>
                    <input id={`m-name-${idx}`} className="ow-input" maxLength={30} value={m.name} onChange={(e) => patch(idx, { name: e.target.value })} />
                    <label className="ow-label" htmlFor={`m-note-${idx}`}>{t("memberRole")}</label>
                    <input id={`m-note-${idx}`} className="ow-input" maxLength={100} value={m.note} onChange={(e) => patch(idx, { note: e.target.value })} placeholder={t("memberRolePh")} />
                    <ChipGroup label={t("memberDevices", { n: idx + 1 })} multiple options={DEVICES} value={m.devices} onChange={(d) => patch(idx, { devices: d as Device[] })} />
                    {games.length > 0 && (
                      <fieldset className="ow-field">
                        <legend>{t("memberOwned", { n: idx + 1 })}</legend>
                        <ChipGroup label={t("memberOwnedLabel", { n: idx + 1 })} multiple options={games.map((g) => ({ value: g.id, label: g.name }))} value={m.ownedGameIds} onChange={(g) => patch(idx, { ownedGameIds: g })} />
                      </fieldset>
                    )}
                    {members.length > 2 && <Button variant="ghost" onClick={() => setMembers((x) => x.filter((_, j) => j !== idx))}>{t("memberRemove", { n: idx + 1 })}</Button>}
                  </div>
                ))}
                <Button variant="secondary" disabled={members.length >= (tier === "small" ? 5 : 12)} onClick={() => setMembers((x) => [...x, emptyMember()])}>{t("memberAdd")}</Button>
                <p className="ow-hint">{t("countHint", { range: tier === "small" ? t("rangeSmall") : t("rangeLarge"), n: members.length })}</p>
                <Single label={t("closeness")} options={opts(TAXONOMY_KEYS.chemistry, l.chemistry)} value={chemistry} onChange={setChemistry} />
                <fieldset className="ow-field">
                  <legend>{t("desired")}</legend>
                  <ChipGroup label={t("desired")} multiple options={opts(TAXONOMY_KEYS.structure, l.structure)} value={structures} onChange={setStructures} />
                </fieldset>
                <Single label={t("rotation")} options={YES_NO} value={allowRotation} onChange={setAllowRotation} />
                <Single label={t("league")} options={YES_NO} value={allowLeague} onChange={setAllowLeague} />
              </>
            )}

            <h2 className="ow-h2" style={{ margin: 0 }}>{t("exclude")}</h2>
            <fieldset className="ow-field">
              <legend>{t("avoid")}</legend>
              <ChipGroup label={t("avoid")} multiple options={[{ value: "horror", label: t("avoidHorror") }, { value: "motion", label: t("avoidMotion") }, { value: "spoiler", label: t("avoidSpoiler") }]} value={avoid} onChange={setAvoid} />
            </fieldset>
            <div className="ow-field">
              <label className="ow-label" htmlFor="genres">{t("excludeGenres")}</label>
              <input id="genres" className="ow-input" value={excludedGenres} onChange={(e) => setExcludedGenres(e.target.value)} />
            </div>

            <p className="ow-hint">{aiOn ? t("disclosureAi") : t("disclosureRule")}</p>
            <Button type="submit" disabled={pending || !ready}>{pending ? t("submitting") : t("submit")}</Button>
          </div>
        </Tabs>
      </form>

      <section aria-live="polite" aria-label={t("result")}>
        {pending ? (
          <LoadingState title={t("loadingTitle")} hint={t("loadingHint")} />
        ) : state.kind === "idle" ? (
          <EmptyState title={t("idleTitle")} hint={t("idleHint")} />
        ) : state.kind === "login" ? (
          <ErrorState title={t("needLoginTitle")} hint={t("needLoginHint")} action={<Link className="ow-btn ow-btn-secondary" href="/login?next=/recommend">{t("loginCta")}</Link>} />
        ) : state.kind === "invalid" ? (
          <ErrorState title={t("invalidTitle")} hint={te.has(state.message) ? te(state.message) : te("checkInput")} />
        ) : state.kind === "error" ? (
          <ErrorState title={t("errorTitle")} hint={t("errorHint")} />
        ) : (
          <div className="ow-form">
            {state.result.source === "rule" && <p className="ow-note"><strong>{t("basicTag")}</strong> · {state.result.notice ? noticeText(state.result.notice, state.result.quota) : t("basicDefault")}</p>}
            {state.result.summary && <p className="ow-lead" style={{ fontSize: "var(--fs-body)" }}>{state.result.summary}</p>}
            {state.result.picks.length === 0 ? (
              <EmptyState title={t("noneTitle")} hint={t("noneHint")} />
            ) : (
              state.result.picks.map((p, idx) => <PickCard key={`${p.contentId ?? p.formatId}-${idx}`} pick={p} profile={state.profile} source={state.result.source} />)
            )}
          </div>
        )}
      </section>
    </div>
  );
}
