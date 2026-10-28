import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// 로그인·가입 확인으로 세션이 바뀌기 "전에" 부른다. 지금 세션이 게스트이면 그 ID를 돌려준다(서버가 확인한 값).
export async function currentGuestId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.is_anonymous === true ? data.user.id : null;
  } catch {
    return null;
  }
}

// 게스트로 저장한 프로필·추천을 로그인한 계정으로 옮기고 게스트 계정을 지운다.
// 덮어쓰지 않고 합친다: 계정에 이미 프로필이 있으면 그대로 두고(게스트 프로필은 버림), 저장한 추천은 모두 옮긴다.
// 실패해도 로그인은 그대로 진행한다(게스트 데이터는 만료 정리 때 지워진다).
export async function mergeGuestInto(guestId: string, userId: string): Promise<void> {
  if (!guestId || guestId === userId) return;
  try {
    const admin = createAdminClient();
    const { data: g } = await admin.auth.admin.getUserById(guestId);
    if (g.user?.is_anonymous !== true) return; // 게스트가 아닌 계정의 데이터는 절대 옮기지 않는다

    const existing = await admin.from("streamer_profiles").select("user_id").eq("user_id", userId).maybeSingle();
    if (!existing.data) await admin.from("streamer_profiles").update({ user_id: userId }).eq("user_id", guestId);
    await admin.from("saved_recommendations").update({ user_id: userId }).eq("user_id", guestId);
    await admin.auth.admin.deleteUser(guestId); // 남은 기록(이용 횟수 등)은 on delete cascade로 함께 지워진다
  } catch (e) {
    console.error("[guest] 게스트 데이터 이전 실패", e instanceof Error ? e.message : e);
  }
}
