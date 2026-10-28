import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deleteAccount, deleteAllSaved, deleteSaved, resetProfile } from "@/actions/profile";
import { PickCard } from "@/components/recommend/PickCard";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { aiEnabled } from "@/config/ai";
import { getLabels } from "@/i18n/labels";
import { routing } from "@/i18n/routing";
import { getUser } from "@/lib/auth";
import { getQuotaFor } from "@/lib/quota";
import { normalizePick } from "@/lib/recommend/normalize";
import type { RecommendPick } from "@/lib/recommend/types";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: PageProps<"/[locale]/profile">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profile" });
  return { title: t("title"), robots: { index: false } };
}

async function Profile({ locale, searchParams }: { locale: string; searchParams: PageProps<"/[locale]/profile">["searchParams"] }) {
  const t = await getTranslations({ locale, namespace: "profile" });
  const l = await getLabels(locale);
  const sp = await searchParams;
  const user = await getUser();
  if (!user) {
    return <EmptyState title={t("guestEmptyTitle")} hint={t("guestEmptyHint")} action={<ButtonLink href="/recommend">{t("getReco")}</ButtonLink>} />;
  }

  const supabase = await createClient();
  const [profile, saved, quota] = await Promise.all([
    supabase.from("streamer_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("saved_recommendations").select("id, source, profile_snapshot, result, created_at").order("created_at", { ascending: false }),
    aiEnabled() ? getQuotaFor(user.id, user.is_anonymous === true) : Promise.resolve(null),
  ]);
  const p = profile.data;
  const resetDate = (iso: string) => new Date(iso).toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", { timeZone: "Asia/Seoul", month: "long", day: "numeric" });
  const word = t("confirmWord");
  const isGuest = user.is_anonymous === true;
  const tn = await getTranslations({ locale, namespace: "nav" });

  return (
    <>
      <div className="ow-account-head">
        <span className="ow-avatar ow-avatar-lg" aria-hidden="true">{isGuest ? "G" : (user.email ?? "?").slice(0, 1).toUpperCase()}</span>
        <p className="ow-account-email">{isGuest ? tn("guestName") : user.email}</p>
      </div>

      {quota && (
        <p className="ow-note ow-note-block">
          {t(quota.period === "day" ? "quotaDay" : "quota", { n: quota.remaining, used: quota.used, limit: quota.limit, date: resetDate(quota.nextReset) })}
        </p>
      )}

      <h2 className="ow-h2">{t("saved")}</h2>
      {p ? (
        <div className="ow-card">
          <dl className="ow-facts ow-facts-flush">
            <div className="ow-fact"><dt>{t("mode")}</dt><dd>{l.tier[p.mode]}{p.member_count ? t("membersN", { n: p.member_count }) : ""}</dd></div>
            <div className="ow-fact"><dt>{t("strengths")}</dt><dd>{(p.strengths as string[]).map((s) => l.strength[s]).join(", ") || t("none")}</dd></div>
            <div className="ow-fact"><dt>{t("audience")}</dt><dd>{l.audience[p.audience]}</dd></div>
            <div className="ow-fact"><dt>{t("lengthTime")}</dt><dd>{l.length[p.length]} · {l.timeSlot[p.time_slot]}</dd></div>
            <div className="ow-fact"><dt>{t("goal")}</dt><dd>{l.goal[p.goal]}</dd></div>
            <div className="ow-fact"><dt>{t("devices")}</dt><dd>{(p.devices as string[]).join(" · ")}</dd></div>
          </dl>
          <div className="ow-card-actions">
            <ButtonLink href="/recommend" variant="secondary">{t("edit")}</ButtonLink>
            <form action={resetProfile}><Button type="submit" variant="ghost">{t("reset")}</Button></form>
          </div>
        </div>
      ) : (
        <EmptyState title={t("noProfileTitle")} hint={t("noProfileHint")} action={<ButtonLink href="/recommend">{t("getReco")}</ButtonLink>} />
      )}

      <h2 className="ow-h2">{t("savedPicks")}</h2>
      {!saved.data || saved.data.length === 0 ? (
        <EmptyState title={t("noPicksTitle")} hint={t("noPicksHint")} action={<ButtonLink href="/recommend">{t("goReco")}</ButtonLink>} />
      ) : (
        <>
          <div className="ow-grid">
            {saved.data.map((s) => (
              <PickCard
                key={s.id}
                pick={normalizePick(s.result as RecommendPick)}
                source={s.source as "ai" | "rule"}
                readOnly
                extra={
                  <form action={deleteSaved}>
                    <input type="hidden" name="id" value={s.id} />
                    <Button type="submit" variant="ghost">{t("savedDelete")}</Button>
                  </form>
                }
              />
            ))}
          </div>
          <form action={deleteAllSaved} className="ow-mt">
            <Button type="submit" variant="ghost">{t("deleteAll")}</Button>
          </form>
        </>
      )}

      {!isGuest && <><h2 className="ow-h2">{t("withdraw")}</h2>
      <details className="ow-details ow-details-narrow">
        <summary>{t("withdrawSummary")}</summary>
        <p>{t("withdrawWarn")}</p>
        <form action={deleteAccount} className="ow-form">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="word" value={word} />
          <div className="ow-field">
            <label className="ow-label" htmlFor="confirm">{t("confirmLabel", { word })}</label>
            <input id="confirm" name="confirm" className="ow-input" autoComplete="off" required />
          </div>
          {sp.error === "confirm" && <p className="ow-note" role="alert">{t("confirmError", { word })}</p>}
          {sp.error === "delete" && <p className="ow-note" role="alert">{t("deleteError")}</p>}
          <Button type="submit" variant="ghost">{t("withdrawConfirm")}</Button>
        </form>
      </details></>}
    </>
  );
}

export default async function ProfilePage(props: PageProps<"/[locale]/profile">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "profile" });
  return (
    <>
      <h1 className="ow-h1">{t("title")}</h1>
      <Suspense fallback={<p className="ow-meta">…</p>}>
        <Profile locale={locale} searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
