import "server-only";
import { FREE_AI_RECOMMENDS_PER_MONTH, GUEST_AI_DAILY_LIMIT } from "@/config/limits";
import { guestQuota, kstDayStart } from "@/lib/guest-quota";
import { createAdminClient } from "@/lib/supabase/admin";

// 게스트의 오늘 이용 현황: 오늘(한국 시간) 차감된 AI 추천 수. ipBlocked이면 남은 횟수를 0으로 본다.
export async function getGuestQuota(userId: string, ipBlocked = false) {
  const { count, error } = await createAdminClient()
    .from("ai_requests")
    .select("request_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("charged", true)
    .gte("created_at", kstDayStart());
  if (error) throw new Error("이용량을 확인하지 못했어요");
  return guestQuota(count ?? 0, GUEST_AI_DAILY_LIMIT, ipBlocked);
}

// 이용 현황. 로그인 사용자는 이번 달(월 한도), 게스트는 오늘(하루 한도)
export async function getQuotaFor(userId: string, isGuest = false) {
  if (isGuest) return getGuestQuota(userId).catch(() => null);
  const { data, error } = await createAdminClient().rpc("get_ai_quota", { p_user: userId, p_limit: FREE_AI_RECOMMENDS_PER_MONTH });
  if (error || !data?.[0]) return null;
  const r = data[0] as { used: number; remaining: number; next_reset: string };
  return { used: r.used, remaining: r.remaining, limit: FREE_AI_RECOMMENDS_PER_MONTH, nextReset: r.next_reset, period: "month" as const };
}
