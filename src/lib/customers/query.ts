import "server-only";
import type { Segment } from "@/config/customerTypes";
import { PAGE_SIZE, periodDays, type CustomerFilters } from "@/lib/customers/filters";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type ListRow = {
  short_id: string; segment: Segment; type_source: "self" | "inferred" | null; is_guest: boolean; platforms: string[];
  streaming_experience: string | null; preferred_tier: string | null; recommend_count: number; saved_count: number;
  first_seen_at: string; last_active_at: string; total_count: number;
};
export type SummaryRow = { segment: Segment; total: number; new_7d: number; active_7d: number; self_count: number; guests: number };
export type CompareRow = {
  segment: Segment; users: number; recommends: number; saved: number; appeal: { visual: number; audio: number; audiovisual: number };
  participation_saved: number; small_requests: number; large_requests: number;
  top_games: { slug: string; n: number }[]; top_contents: { slug: string; n: number }[];
};

// 집계는 DB 함수(0012)가 한다. 호출한 사람의 권한으로 부르므로, 관리자가 아니면 함수가 오류로 거부한다(서버에서 먼저 확인한 뒤에도 한 번 더).
export async function listCustomers(supabase: Supabase, f: CustomerFilters, opts: { limit?: number; offset?: number } = {}) {
  const { data, error } = await supabase.rpc("admin_customer_list", {
    p_segment: f.segment, p_source: f.source, p_guest: f.guest, p_days: periodDays(f.period),
    p_sort: f.sort, p_dir: f.dir, p_limit: opts.limit ?? PAGE_SIZE, p_offset: opts.offset ?? (f.page - 1) * PAGE_SIZE,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as ListRow[];
}

export async function customerSummary(supabase: Supabase) {
  const { data, error } = await supabase.rpc("admin_customer_summary");
  if (error) throw new Error(error.message);
  return (data ?? []) as SummaryRow[];
}

export async function customerTrend(supabase: Supabase, days = 30) {
  const { data, error } = await supabase.rpc("admin_customer_trend", { p_days: days });
  if (error) throw new Error(error.message);
  return (data ?? []) as { day: string; segment: Segment; n: number }[];
}

export async function customerCompare(supabase: Supabase, f: CustomerFilters) {
  const { data, error } = await supabase.rpc("admin_customer_compare", { p_days: periodDays(f.period) });
  if (error) throw new Error(error.message);
  return (data ?? []) as CompareRow[];
}

// 서버에서 관리자 여부를 확인한다(로그인한 일반 계정·게스트는 false). 관리자 화면·내보내기 모두 이 함수를 쓴다.
export async function requireAdminClient(): Promise<Supabase | null> {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user || u.user.is_anonymous === true) return null;
  const { data } = await supabase.rpc("is_admin");
  return data === true ? supabase : null;
}
