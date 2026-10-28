import "server-only";
import type { User } from "@supabase/supabase-js";
import { GUEST_CREATES_PER_IP_PER_HOUR, GUEST_TTL_DAYS } from "@/config/limits";
import { getUser } from "@/lib/auth";
import { allow, clientIp, hashKey } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type Ensured = { ok: true; user: User; supabase: Supabase; isGuest: boolean } | { ok: false; reason: "guest_limit" | "guest_failed" };

// 마지막 활동 시각과 만료일(14일 뒤)을 갱신한다. 0009 마이그레이션 전이거나 DB 오류여도 서비스는 계속 쓰게 하고 로그만 남긴다.
export async function touchGuest(userId: string) {
  try {
    const now = new Date();
    const { error } = await createAdminClient()
      .from("guest_activity")
      .upsert({ user_id: userId, last_active_at: now.toISOString(), expires_at: new Date(now.getTime() + GUEST_TTL_DAYS * 86400_000).toISOString() });
    if (error) console.error("[guest] 활동 기록 실패", error.message);
  } catch (e) {
    console.error("[guest] 활동 기록 실패", e instanceof Error ? e.message : e);
  }
}

// 사용자 정보가 필요한 행동(추천 받기·저장·신고)에서 부른다. 로그인한 사용자나 이미 있는 게스트는 그대로 쓰고,
// 세션이 없으면 그 자리에서 익명 사용자(게스트)를 만들어 쿠키를 심는다. 페이지를 그리는 중에는 부르지 않는다(쿠키를 쓸 수 있는 서버 동작·라우트 전용).
export async function ensureUser(): Promise<Ensured> {
  const existing = await getUser();
  if (existing) {
    const guest = existing.is_anonymous === true;
    if (guest) await touchGuest(existing.id);
    return { ok: true, user: existing, supabase: await createClient(), isGuest: guest };
  }

  // 게스트 생성 제한: 접속 주소별 1시간에 N명
  if (!(await allow(`guest:ip:${hashKey(await clientIp())}`, GUEST_CREATES_PER_IP_PER_HOUR, 3600))) return { ok: false, reason: "guest_limit" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    console.error("[guest] 게스트 세션 생성 실패", error?.message);
    return { ok: false, reason: "guest_failed" };
  }
  await touchGuest(data.user.id);
  return { ok: true, user: data.user, supabase, isGuest: true };
}
