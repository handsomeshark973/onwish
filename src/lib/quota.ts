import "server-only";
import { FREE_AI_RECOMMENDS_PER_MONTH } from "@/config/limits";
import { createAdminClient } from "@/lib/supabase/admin";

// 이번 달 이용 현황 (서버 전용 관리 키로 DB 함수 호출)
export async function getQuotaFor(userId: string) {
  const { data, error } = await createAdminClient().rpc("get_ai_quota", { p_user: userId, p_limit: FREE_AI_RECOMMENDS_PER_MONTH });
  if (error || !data?.[0]) return null;
  const r = data[0] as { used: number; remaining: number; next_reset: string };
  return { used: r.used, remaining: r.remaining, limit: FREE_AI_RECOMMENDS_PER_MONTH, nextReset: r.next_reset };
}
