import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { recomputeCustomers } from "@/actions/admin";
import { Button, ButtonLink } from "@/components/ui/Button";
import { MiniChart } from "@/components/ui/MiniChart";
import { EmptyState } from "@/components/ui/States";
import { CUSTOMER_TYPES, SEGMENTS, TYPE_BADGE_CLASS, type CustomerType, type Segment } from "@/config/customerTypes";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { filtersToQuery, PAGE_SIZE, parseFilters, PERIODS, type CustomerFilters } from "@/lib/customers/filters";
import { customerCompare, customerSummary, customerTrend, listCustomers, requireAdminClient } from "@/lib/customers/query";
import { getContents } from "@/lib/data/contents";
import { getGames } from "@/lib/data/games";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/customers">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.customers" });
  return { title: t("title"), robots: { index: false } };
}

const pct = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 100)}%` : "—");
const avg = (n: number, d: number) => (d > 0 ? (n / d).toFixed(1) : "—");
// 오늘부터 거슬러 n일의 한국 날짜(yyyy-mm-dd), 오래된 날부터
const lastDays = (n: number) => Array.from({ length: n }, (_, i) => new Date(Date.now() - (n - 1 - i) * 86400_000).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }));
const kst = (iso: string) => new Date(iso).toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 16);

async function Customers({ locale, searchParams }: { locale: string; searchParams: PageProps<"/[locale]/admin/customers">["searchParams"] }) {
  // 서버에서 로그인·관리자 권한을 모두 확인한다. 게스트와 일반 계정은 404(이 주소가 있다는 것도 알리지 않는다).
  const supabase = await requireAdminClient();
  if (!supabase) notFound();

  const f = parseFilters(await searchParams);
  const t = await getTranslations({ locale, namespace: "admin.customers" });
  const tx = await getTranslations({ locale, namespace: "taxonomy" });
  const [summary, trend, compare, rows, games, contents] = await Promise.all([
    customerSummary(supabase), customerTrend(supabase, 30), customerCompare(supabase, f), listCustomers(supabase, f), getGames(locale), getContents(locale),
  ]);

  const sum = (s: Segment) => summary.find((r) => r.segment === s);
  const all = summary.reduce((a, r) => a + r.total, 0);
  const guests = summary.reduce((a, r) => a + r.guests, 0);
  const gameName = new Map(games.map((g) => [g.slug, g.name]));
  const contentName = new Map(contents.map((c) => [c.slug, c.title]));
  const total = rows[0] ? Number(rows[0].total_count) : 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const q = (o: Partial<Record<keyof CustomerFilters, unknown>>) => filtersToQuery(f, { page: 1, ...o });
  const csvHref = `/api/admin/customers${filtersToQuery(f, { page: 1 })}${filtersToQuery(f, { page: 1 }) ? "&" : "?"}locale=${locale}`;
  const badge = (s: Segment) => (
    <span className={`ow-badge ${s in TYPE_BADGE_CLASS ? TYPE_BADGE_CLASS[s as CustomerType] : "ow-badge-plain"}`}>{tx(`customerType.${s}`)}</span>
  );
  const top = (list: { slug: string; n: number }[], names: Map<string, string>) =>
    list.length ? list.map((x) => `${names.get(x.slug) ?? x.slug} (${x.n})`).join(", ") : "—";

  // 최근 30일 일별 신규(한국 날짜)
  const days = lastDays(30);
  const series = (s: Segment) => days.map((d) => trend.filter((r) => r.segment === s && String(r.day).slice(0, 10) === d).reduce((a, r) => a + r.n, 0));

  return (
    <>
      <p className="ow-note ow-note-block">
        {t("overall", { all, guests, gp: pct(guests, all), members: all - guests, mp: pct(all - guests, all) })}
      </p>

      <div className="ow-cust-top">
        <div className="ow-grid ow-grid-tier">
          {CUSTOMER_TYPES.map((s) => {
            const r = sum(s);
            return (
              <article key={s} className="ow-card" aria-label={tx(`customerType.${s}`)}>
                <div>{badge(s)}</div>
                <p className="ow-cust-num">{r?.total ?? 0}<span className="ow-meta"> {t("people")}</span></p>
                <dl className="ow-facts ow-facts-flush">
                  <div className="ow-fact"><dt>{t("new7")}</dt><dd>{r?.new_7d ?? 0}</dd></div>
                  <div className="ow-fact"><dt>{t("active7")}</dt><dd>{r?.active_7d ?? 0}</dd></div>
                  <div className="ow-fact"><dt>{t("selfShare")}</dt><dd>{pct(r?.self_count ?? 0, r?.total ?? 0)}</dd></div>
                </dl>
              </article>
            );
          })}
        </div>
        <p className="ow-note ow-cust-unclassified">
          <strong>{t("unclassified", { n: (sum("solo_undecided")?.total ?? 0) + (sum("insufficient")?.total ?? 0) })}</strong>
          <span> · {tx("customerType.solo_undecided")} {sum("solo_undecided")?.total ?? 0}</span>
          <span> · {tx("customerType.insufficient")} {sum("insufficient")?.total ?? 0}</span>
        </p>
      </div>

      <div className="ow-card-actions">
        <span className="ow-label">{t("period")}</span>
        {PERIODS.map((p) => (
          <Link key={p} className={`ow-btn ${f.period === p ? "ow-btn-primary" : "ow-btn-secondary"} ow-btn-sm`} href={`/admin/customers${q({ period: p })}`} aria-current={f.period === p ? "true" : undefined}>
            {t(`periods.${p}`)}
          </Link>
        ))}
        <form action={recomputeCustomers}>
          <Button type="submit" variant="ghost">{t("recompute")}</Button>
        </form>
      </div>
      <p className="ow-meta">{t("periodNote")}</p>

      <h2 className="ow-h2">{t("trendTitle")}</h2>
      <div className="ow-table-wrap"><table className="ow-table"><tbody>
        {CUSTOMER_TYPES.map((s) => (
          <tr key={s}><th scope="row">{badge(s)}</th><td><MiniChart values={series(s)} label={`${tx(`customerType.${s}`)} · ${t("trendLabel")}`} width={240} height={40} /></td><td>{series(s).reduce((a, b) => a + b, 0)}</td></tr>
        ))}
      </tbody></table></div>

      <h2 className="ow-h2">{t("compareTitle")}</h2>
      <div className="ow-table-wrap"><table className="ow-table"><thead><tr>
        <th>{t("col.type")}</th><th>{t("cmp.users")}</th><th>{t("cmp.avgRecommend")}</th><th>{t("cmp.avgSaved")}</th><th>{t("cmp.appeal")}</th>
        <th>{t("cmp.participation")}</th><th>{t("cmp.topGames")}</th><th>{t("cmp.topContents")}</th>
      </tr></thead><tbody>
        {CUSTOMER_TYPES.map((s) => {
          const r = compare.find((c) => c.segment === s);
          if (!r) return null;
          return (
            <tr key={s}>
              <td>{badge(s)}{s === "crew" && <div className="ow-meta">{t("cmp.crewSplit", { small: pct(r.small_requests, r.small_requests + r.large_requests), large: pct(r.large_requests, r.small_requests + r.large_requests) })}</div>}</td>
              <td>{r.users}</td>
              <td>{avg(r.recommends, r.users)}</td>
              <td>{avg(r.saved, r.users)}</td>
              <td>{(["visual", "audio", "audiovisual"] as const).map((a) => `${tx(`appeal.${a}`)} ${pct(r.appeal[a], r.saved)}`).join(" · ")}</td>
              <td>{pct(r.participation_saved, r.saved)}</td>
              <td>{top(r.top_games, gameName)}</td>
              <td>{top(r.top_contents, contentName)}</td>
            </tr>
          );
        })}
      </tbody></table></div>

      <h2 className="ow-h2">{t("listTitle", { n: total })}</h2>
      <form method="get" className="ow-card-actions ow-cust-filters">
        <input type="hidden" name="period" value={f.period} />
        <label className="ow-label">{t("filters.type")}
          <select name="segment" className="ow-select" defaultValue={f.segment ?? ""}>
            <option value="">{t("filters.all")}</option>
            {SEGMENTS.map((s) => <option key={s} value={s}>{tx(`customerType.${s}`)}</option>)}
          </select>
        </label>
        <label className="ow-label">{t("filters.source")}
          <select name="source" className="ow-select" defaultValue={f.source ?? ""}>
            <option value="">{t("filters.all")}</option>
            {(["self", "inferred", "none"] as const).map((s) => <option key={s} value={s}>{t(`source.${s}`)}</option>)}
          </select>
        </label>
        <label className="ow-label">{t("filters.guest")}
          <select name="guest" className="ow-select" defaultValue={f.guest === null ? "" : f.guest ? "1" : "0"}>
            <option value="">{t("filters.all")}</option><option value="1">{t("guestOnly")}</option><option value="0">{t("membersOnly")}</option>
          </select>
        </label>
        <Button type="submit" variant="secondary">{t("filters.apply")}</Button>
        <ButtonLink href="/admin/customers" variant="ghost">{t("filters.reset")}</ButtonLink>
        <a className="ow-btn ow-btn-secondary" href={csvHref}>{t("csv")}</a>
      </form>

      {rows.length === 0 ? (
        <EmptyState title={t("emptyTitle")} hint={t("emptyHint")} />
      ) : (
        <div className="ow-table-wrap"><table className="ow-table"><thead><tr>
          <th>{t("col.id")}</th><th>{t("col.type")}</th><th>{t("col.source")}</th><th>{t("col.guest")}</th><th>{t("col.platforms")}</th><th>{t("col.experience")}</th><th>{t("col.tier")}</th>
          <th aria-sort={f.sort === "recommend" ? (f.dir === "asc" ? "ascending" : "descending") : undefined}>
            <Link href={`/admin/customers${q({ sort: "recommend", dir: f.sort === "recommend" && f.dir === "desc" ? "asc" : "desc" })}`}>{t("col.recommends")}</Link></th>
          <th>{t("col.saved")}</th><th>{t("col.firstSeen")}</th>
          <th aria-sort={f.sort === "last_active" ? (f.dir === "asc" ? "ascending" : "descending") : undefined}>
            <Link href={`/admin/customers${q({ sort: "last_active", dir: f.sort === "last_active" && f.dir === "desc" ? "asc" : "desc" })}`}>{t("col.lastActive")}</Link></th>
        </tr></thead><tbody>
          {rows.map((r) => (
            <tr key={r.short_id}>
              <td><code>{r.short_id}</code></td>
              <td>{badge(r.segment)}</td>
              <td>{r.type_source ? t(`source.${r.type_source}`) : "—"}</td>
              <td>{r.is_guest ? t("yes") : t("no")}</td>
              <td>{r.platforms.map((p) => tx(`platform.${p}`)).join(" · ") || "—"}</td>
              <td>{r.streaming_experience ? tx(`experience.${r.streaming_experience}`) : "—"}</td>
              <td>{r.preferred_tier ? tx(`tier.${r.preferred_tier}`) : "—"}</td>
              <td>{r.recommend_count}</td><td>{r.saved_count}</td><td>{kst(r.first_seen_at)}</td><td>{kst(r.last_active_at)}</td>
            </tr>
          ))}
        </tbody></table></div>
      )}
      <nav className="ow-card-actions" aria-label={t("pagination")}>
        {f.page > 1 && <Link className="ow-btn ow-btn-secondary ow-btn-sm" href={`/admin/customers${filtersToQuery(f, { page: f.page - 1 })}`}>{t("prev")}</Link>}
        <span className="ow-meta">{f.page} / {pages}</span>
        {f.page < pages && <Link className="ow-btn ow-btn-secondary ow-btn-sm" href={`/admin/customers${filtersToQuery(f, { page: f.page + 1 })}`}>{t("next")}</Link>}
      </nav>
    </>
  );
}

export default async function CustomersPage(props: PageProps<"/[locale]/admin/customers">) {
  const { locale } = await props.params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.customers" });
  return (
    <>
      <h1 className="ow-h1">{t("title")}</h1>
      <p><ButtonLink href="/admin" variant="ghost">{t("back")}</ButtonLink></p>
      <Suspense fallback={<p className="ow-meta">…</p>}>
        <Customers locale={locale} searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
