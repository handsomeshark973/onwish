import "server-only";
import type { EventType } from "@/config/customerTypes";
import { createAdminClient } from "@/lib/supabase/admin";

// 행동 1건을 기록하고 고객 집계(추천 수·저장 수·마지막 활동)에 반영한다. 서버만 쓴다(브라우저가 직접 쓰는 길은 없다).
// 기록에 실패해도 사용자 기능은 계속 돼야 하므로 오류는 로그만 남긴다(0011 적용 전에도 서비스는 동작한다).
// payload에는 이름·이메일·채널 주소·IP를 넣지 않는다. 호출하는 쪽이 필요한 값만 골라 넘긴다.
export async function recordEvent(
  userId: string,
  isGuest: boolean,
  type: EventType,
  payload: Record<string, string | number | boolean | string[] | null> = {},
  bump: { recommend?: number; saved?: number } = {},
) {
  try {
    const admin = createAdminClient();
    const t = await admin.rpc("customer_touch", { p_user: userId, p_guest: isGuest, p_recommend: bump.recommend ?? 0, p_saved: bump.saved ?? 0 });
    if (t.error) console.error("[customer] 집계 실패", t.error.message);
    const e = await admin.from("user_events").insert({ user_id: userId, type, payload });
    if (e.error) console.error("[customer] 이벤트 기록 실패", e.error.message);
  } catch (err) {
    console.error("[customer] 기록 실패", err instanceof Error ? err.message : err);
  }
}
