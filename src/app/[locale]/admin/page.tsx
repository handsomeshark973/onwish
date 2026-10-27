import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { setApproval, setReportStatus, setVideoStatus } from "@/actions/admin";
import { VideoForm } from "@/components/admin/VideoForm";
import { hasYoutubeApiKey } from "@/lib/youtube-api";
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
  const tv = await getTranslations({ locale, namespace: "admin.video" });
  const [games, formats, contents, reports, sources, videos, allGames] = await Promise.all([
    supabase.from("games").select("*").eq("approval_status", "pending").order("created_at"),
    supabase.from("game_formats").select("*, games(name)").eq("approval_status", "pending").order("created_at"),
    supabase.from("contents").select("*").eq("approval_status", "pending").order("created_at"),
    supabase.from("error_reports").select("*").in("status", ["open", "in_progress"]).order("created_at"),
    supabase.from("game_sources").select("game_id"),
    supabase.from("game_videos").select("*, games(name)").in("status", ["pending", "hidden", "approved"]).order("created_at", { ascending: false }),
    supabase.from("games").select("id, name").order("name"),
  ]);
  const vids = (st: string) => (videos.data ?? []).filter((v: any) => v.status === st);
  const videoMeta = (v: any) => tv("meta", { game: v.games?.name ?? "", kind: tv(`kinds.${v.kind}`), channel: v.channel_name });
  const srcCount = (id: string) => (sources.data ?? []).filter((s: any) => s.game_id === id).length;
  const q = (v: unknown): string | number => (v as string | number | null) ?? "?";

  const ApprovalRow = ({ type, row, summary, extra }: { type: "game" | "game_format" | "content"; row: any; summary: string; extra: string }) => (
    <tr>
      <td><strong>{summary}</strong><div className="ow-meta">{extra}</div></td>
      <td>
        <form action={setApproval} className="ow-form ow-form-tight">
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="id" value={row.id} />
          <label className="ow-hint"><input type="checkbox" name="verified" /> {t("verified")}</label>
          <div className="ow-card-actions ow-actions-flush">
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

      <h2 className="ow-h2">{tv("title")}</h2>
      <VideoForm games={(allGames.data ?? []).map((g: any) => ({ id: g.id, name: g.name }))} hasApiKey={hasYoutubeApiKey()} />

      <h2 className="ow-h2">{tv("queueTitle", { n: vids("pending").length })}</h2>
      {vids("pending").length === 0 ? <EmptyState title={tv("noPending")} hint={tv("noPendingHint")} /> : (
        <div className="ow-table-wrap"><table className="ow-table"><thead><tr><th>{tv("thVideo")}</th><th>{t("thReview")}</th></tr></thead><tbody>
          {vids("pending").map((v: any) => (
            <tr key={v.id}>
              <td><strong>{v.title_ko ?? v.title_en}</strong><div className="ow-meta">{videoMeta(v)}</div><a href={v.source_url} target="_blank" rel="noopener noreferrer" className="ow-meta">{v.source_url}</a></td>
              <td>
                <form action={setVideoStatus} className="ow-form ow-form-tight">
                  <input type="hidden" name="id" value={v.id} />
                  <label className="ow-hint"><input type="checkbox" name="verified" /> {tv("verifiedLabel")}</label>
                  {v.channel_id && <label className="ow-hint"><input type="checkbox" name="addChannel" /> {tv("addChannel")}</label>}
                  <div className="ow-card-actions ow-actions-flush">
                    <Button type="submit" name="action" value="approve">{tv("approve")}</Button>
                    <Button type="submit" name="action" value="hide" variant="ghost" formNoValidate>{tv("hide")}</Button>
                  </div>
                </form>
              </td>
            </tr>
          ))}
        </tbody></table></div>
      )}

      <h2 className="ow-h2">{tv("hiddenTitle", { n: vids("hidden").length })}</h2>
      {vids("hidden").length === 0 ? <EmptyState title={tv("noHidden")} hint="" /> : (
        <div className="ow-table-wrap"><table className="ow-table"><thead><tr><th>{tv("thVideo")}</th><th>{t("thReview")}</th></tr></thead><tbody>
          {vids("hidden").map((v: any) => (
            <tr key={v.id}>
              <td><strong>{v.title_ko ?? v.title_en}</strong><div className="ow-meta">{videoMeta(v)} · {v.hidden_reason ? tv(`hiddenReason.${v.hidden_reason}`) : ""} · {tv("checkedAt", { date: day(v.verified_at) })}</div><a href={v.source_url} target="_blank" rel="noopener noreferrer" className="ow-meta">{v.source_url}</a></td>
              <td>
                <form action={setVideoStatus} className="ow-form ow-form-tight">
                  <input type="hidden" name="id" value={v.id} />
                  <label className="ow-hint"><input type="checkbox" name="verified" /> {tv("verifiedLabel")}</label>
                  <div className="ow-card-actions ow-actions-flush"><Button type="submit" name="action" value="approve">{tv("approve")}</Button></div>
                </form>
              </td>
            </tr>
          ))}
        </tbody></table></div>
      )}

      <h2 className="ow-h2">{tv("liveTitle", { n: vids("approved").length })}</h2>
      {vids("approved").length === 0 ? <EmptyState title={tv("noLive")} hint="" /> : (
        <div className="ow-table-wrap"><table className="ow-table"><thead><tr><th>{tv("thVideo")}</th><th>{t("thReview")}</th></tr></thead><tbody>
          {vids("approved").map((v: any) => (
            <tr key={v.id}>
              <td><strong>{v.title_ko ?? v.title_en}</strong>{v.is_featured ? <> <span className="ow-meta">· {tv("featured")}</span></> : null}<div className="ow-meta">{videoMeta(v)} · {tv("checkedAt", { date: day(v.verified_at) })}</div></td>
              <td>
                <form action={setVideoStatus} className="ow-card-actions ow-actions-flush">
                  <input type="hidden" name="id" value={v.id} />
                  <Button type="submit" name="action" value={v.is_featured ? "unfeature" : "feature"} variant="secondary">{v.is_featured ? tv("unfeature") : tv("feature")}</Button>
                  <Button type="submit" name="action" value="hide" variant="ghost">{tv("hide")}</Button>
                </form>
              </td>
            </tr>
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
                <form action={setReportStatus} className="ow-card-actions ow-actions-flush">
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
