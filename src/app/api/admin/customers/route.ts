import { NextResponse, type NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";
import { toCsv } from "@/lib/customers/csv";
import { parseFilters } from "@/lib/customers/filters";
import { listCustomers, requireAdminClient } from "@/lib/customers/query";
import { isLocale, routing } from "@/i18n/routing";

const kst = (iso: string) => new Date(iso).toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 16);

// 현재 필터가 적용된 고객 목록을 CSV로 내려 준다. 표에 보이는 열만 담고, 이메일 등 개인정보는 없다(사용자 번호는 앞 8자리).
// 관리자가 아니면(로그아웃·일반 계정·게스트) 이 주소가 있다는 것도 알리지 않는다(404).
export async function GET(request: NextRequest) {
  const supabase = await requireAdminClient();
  if (!supabase) return new NextResponse("Not Found", { status: 404 });

  const sp = Object.fromEntries(request.nextUrl.searchParams);
  const f = parseFilters(sp);
  const l = sp.locale ?? "";
  const locale = isLocale(l) ? l : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "admin.customers" });
  const tx = await getTranslations({ locale, namespace: "taxonomy" });

  let rows;
  try {
    rows = await listCustomers(supabase, f, { limit: 10000, offset: 0 });
  } catch {
    return new NextResponse("Error", { status: 500 });
  }
  const csv = toCsv(
    [t("col.id"), t("col.type"), t("col.source"), t("col.guest"), t("col.platforms"), t("col.experience"), t("col.tier"), t("col.recommends"), t("col.saved"), t("col.firstSeen"), t("col.lastActive")],
    rows.map((r) => [
      r.short_id, tx(`customerType.${r.segment}`), r.type_source ? t(`source.${r.type_source}`) : "—", r.is_guest ? t("yes") : t("no"),
      r.platforms.map((p) => tx(`platform.${p}`)).join(" / "), r.streaming_experience ? tx(`experience.${r.streaming_experience}`) : "",
      r.preferred_tier ? tx(`tier.${r.preferred_tier}`) : "", r.recommend_count, r.saved_count, kst(r.first_seen_at), kst(r.last_active_at),
    ]),
  );
  const stamp = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }).replaceAll("-", "");
  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="customers-${stamp}.csv"`, "Cache-Control": "no-store" },
  });
}
