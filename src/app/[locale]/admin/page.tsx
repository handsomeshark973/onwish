import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { setApproval, setReportStatus } from "@/actions/admin";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { getLabels } from "@/i18n/labels";
import { routing } from "@/i18n/routing";
import { getUser, isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("title"), robots: { index: false } };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const day = (iso: string | null) => (iso ? iso.slice(0, 10) : "—");

async function Admin({ locale }: { locale: string }) {
  // 서버에서 로그인과 관리자 권한을 모두 확인한다. 아니면 이 주소가 있다는 것도 알리지 않는다(404).
  const user = await getUser();
  if (!user || !(await isAdmin())) notFound();

  const t = await getTranslations({ locale, namespace: "admin" });
  const l = await getLabels(locale);
  const supabase = await createClient();
  const [games, formats, contents, reports, sources] = await Promise.all([
    supabase.from("games").select("*").eq("approval_status", "pending").order("created_at"),
    supabase.from("game_formats").select("*, games(name)").eq("approval_status", "pending").order("created_at"),
    supabase.from("contents").select("*").eq("approval_status", "pending").order("created_at"),
    supabase.from("error_reports").select("*").in("status", ["open", "in_progress"]).order("created_at"),
    supabase.from("game_sources").select("game_id"),
  ]);
  const srcCount = (id: string) => (sources.data ?? []).filter((s: any) => s.game_id === id).length;
  const q = (v: unknown): string | number => (v as string | number | null) ?? "?";

  const ApprovalRow = ({ type, row, summary, extra }: { type: "game" | "game_format" | "content"; row: any; summary: string; extra: string }) => (
    <tr>
      <td><strong>{summary}</strong><div className="ow-meta">{extra}</div></td>
      <td>
        <form action={setApproval} className="ow-form" style={{ gap: "var(--space-2)" }}>
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="id" value={row.id} />
          <label className="ow-hint"><input type="checkbox" name="verified" /> {t("verified")}</label>
          <div className="ow-card-actions" style={{ marginTop: 0 }}>
            <Button type="submit" name="status" value="approved">{t("approve")}</Button>
            <Button type="submit" name="status" value="rejected" variant="ghost" formNoValidate>{t("reject")}</Button>
          </div>
        </form>
      </td>
    </tr>
  );

  return (
    <>
      <p className="ow-meta">{t("note")}</p>

      <h2 className="ow-h2">{t("games", { n: games.data?.length ?? 0 })}</h2>
      {(games.data ?? []).length === 0 ? <EmptyState title={t("noGames")} hint={t("noGamesHint")} /> : (
        <div className="ow-table-wrap"><table className="ow-table"><thead><tr><th>{t("thGame")}</th><th>{t("thReview")}</th></tr></thead><tbody>
          {games.data!.map((g: any) => (
            <ApprovalRow key={g.id} type="game" row={g} summary={g.name} extra={t("gameMeta", { dev: g.developer, min: q(g.min_players), max: q(g.max_players), sources: srcCount(g.id), date: day(g.created_at) })} />
          ))}
        </tbody></table></div>
      )}

      <h2 className="ow-h2">{t("formats", { n: formats.data?.length ?? 0 })}</h2>
      {(formats.data ?? []).length === 0 ? <EmptyState title={t("noFormats")} hint={t("noFormatsHint")} /> : (
        <div className="ow-table-wrap"><table className="ow-table"><thead><tr><th>{t("thFormat")}</th><th>{t("thReview")}</th></tr></thead><tbody>
          {formats.data!.map((f: any) => (
            <ApprovalRow key={f.id} type="game_format" row={f} summary={`${f.games?.name ?? ""} · ${f.title}`} extra={t("formatMeta", { min: q(f.required_min), max: q(f.required_max), appeal: l.appeal[f.main_appeal] ?? f.main_appeal })} />
          ))}
        </tbody></table></div>
      )}

      <h2 className="ow-h2">{t("contents", { n: contents.data?.length ?? 0 })}</h2>
      {(contents.data ?? []).length === 0 ? <EmptyState title={t("noContents")} hint="" /> : (
        <div className="ow-table-wrap"><table className="ow-table"><thead><tr><th>{t("thContent")}</th><th>{t("thReview")}</th></tr></thead><tbody>
          {contents.data!.map((c: any) => (
            <ApprovalRow key={c.id} type="content" row={c} summary={c.title} extra={t("contentMeta", { tier: l.tier[c.player_tier] ?? c.player_tier, min: q(c.required_min), max: q(c.required_max), devices: (c.devices ?? []).join(",") || t("unchecked") })} />
          ))}
        </tbody></table></div>
      )}

      <h2 className="ow-h2">{t("reports", { n: reports.data?.length ?? 0 })}</h2>
      {(reports.data ?? []).length === 0 ? <EmptyState title={t("noReports")} hint="" /> : (
        <div className="ow-table-wrap"><table className="ow-table"><thead><tr><th>{t("thReport")}</th><th>{t("thStatus")}</th></tr></thead><tbody>
          {reports.data!.map((r: any) => (
            <tr key={r.id}>
              <td>
                <div>{r.message}</div>
                <div className="ow-meta">{r.target_type}{r.target_id ? ` · ${r.target_id}` : ""} · {day(r.created_at)}</div>
              </td>
              <td>
                <form action={setReportStatus} className="ow-card-actions" style={{ marginTop: 0 }}>
                  <input type="hidden" name="id" value={r.id} />
                  <select name="status" className="ow-select" defaultValue={r.status} aria-label={t("statusLabel")}>
                    {(["open", "in_progress", "resolved", "dismissed"] as const).map((v) => <option key={v} value={v}>{t(`status.${v}`)}</option>)}
                  </select>
                  <Button type="submit" variant="secondary">{t("saveStatus")}</Button>
                </form>
              </td>
            </tr>
          ))}
        </tbody></table></div>
      )}
    </>
  );
}

export default async function AdminPage({ params }: PageProps<"/[locale]/admin">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin" });
  return (
    <>
      <h1 className="ow-h1">{t("title")}</h1>
      <Suspense fallback={<p className="ow-meta">…</p>}>
        <Admin locale={locale} />
      </Suspense>
    </>
  );
}
