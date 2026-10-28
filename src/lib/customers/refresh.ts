import "server-only";
import { EVENT_RETENTION_DAYS, INFER } from "@/config/customerTypes";
import { inferCustomerType, preferredTier, type EventRow } from "@/lib/customer-type";
import { createAdminClient } from "@/lib/supabase/admin";

const PAGE = 1000;

// 하루 한 번(크론) 또는 관리자 버튼으로 실행한다.
// 1) 최근 30일 행동으로 유형을 추정해 저장한다. 본인이 고른 유형(type_source = self)은 절대 바꾸지 않는다(많이 쓴 인원 규모만 갱신).
// 2) 행동이 사라진 추정 유형은 미분류로 되돌린다.  3) 180일 지난 이벤트를 지운다.
export async function refreshCustomers(now: Date = new Date()) {
  const admin = createAdminClient();
  const since = new Date(now.getTime() - INFER.windowDays * 86400_000).toISOString();

  // 최근 이벤트를 모두 읽는다(1000건씩)
  const byUser = new Map<string, EventRow[]>();
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin.from("user_events").select("user_id, type, created_at, payload").gte("created_at", since).order("id").range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    for (const e of data ?? []) {
      const list = byUser.get(e.user_id) ?? [];
      list.push({ type: e.type, at: e.created_at, payload: (e.payload ?? {}) as Record<string, unknown> });
      byUser.set(e.user_id, list);
    }
    if (!data || data.length < PAGE) break;
  }

  // 현재 저장된 값
  const ids = [...byUser.keys()];
  const current = new Map<string, { type_source: string | null; customer_type: string | null; solo_inferred: boolean; preferred_tier: string | null }>();
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await admin.from("customer_profiles").select("user_id, type_source, customer_type, solo_inferred, preferred_tier").in("user_id", ids.slice(i, i + 200));
    for (const r of data ?? []) current.set(r.user_id, r);
  }

  let changed = 0;
  const jobs: (() => Promise<void>)[] = [];
  for (const [userId, events] of byUser) {
    const cur = current.get(userId);
    if (!cur) continue; // 고객 정보가 아직 없으면(집계 전) 건너뛴다
    const tier = preferredTier(events);
    const patch: Record<string, unknown> = {};
    if (tier !== cur.preferred_tier) patch.preferred_tier = tier;
    if (cur.type_source !== "self") {
      const inf = inferCustomerType(events, now);
      const source = inf.customerType ? "inferred" : null;
      if (inf.customerType !== cur.customer_type) patch.customer_type = inf.customerType;
      if (source !== cur.type_source) patch.type_source = source;
      if (inf.soloInferred !== cur.solo_inferred) patch.solo_inferred = inf.soloInferred;
    }
    if (Object.keys(patch).length) {
      changed++;
      jobs.push(async () => {
        const { error } = await admin.from("customer_profiles").update(patch).eq("user_id", userId);
        if (error) console.error("[customer] 유형 갱신 실패", error.message);
      });
    }
  }

  // 최근 30일 행동이 없어진 추정 유형은 미분류(근거 부족)로 되돌린다
  const { data: stale } = await admin.from("customer_profiles").select("user_id").or("type_source.eq.inferred,solo_inferred.eq.true");
  for (const r of stale ?? []) {
    if (byUser.has(r.user_id)) continue;
    changed++;
    jobs.push(async () => {
      await admin.from("customer_profiles").update({ customer_type: null, type_source: null, solo_inferred: false }).eq("user_id", r.user_id);
    });
  }
  for (let i = 0; i < jobs.length; i += 10) await Promise.all(jobs.slice(i, i + 10).map((j) => j()));

  // 오래된 이벤트 삭제
  const cutoff = new Date(now.getTime() - EVENT_RETENTION_DAYS * 86400_000).toISOString();
  const del = await admin.from("user_events").delete({ count: "exact" }).lt("created_at", cutoff);
  if (del.error) console.error("[customer] 이벤트 삭제 실패", del.error.message);

  return { users: byUser.size, changed, eventsDeleted: del.count ?? 0 };
}
