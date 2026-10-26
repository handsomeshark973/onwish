"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isLocale, routing } from "@/i18n/routing";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// 모든 삭제는 로그인한 본인의 데이터에만 적용된다(DB 권한 정책이 한 번 더 막는다).
export async function resetProfile() {
  const user = await getUser();
  if (!user) redirect(`/${routing.defaultLocale}/login?next=/profile`);
  const supabase = await createClient();
  await supabase.from("streamer_profiles").delete().eq("user_id", user.id);
  revalidatePath("/[locale]/profile", "page");
}

export async function deleteSaved(formData: FormData) {
  const user = await getUser();
  if (!user) redirect(`/${routing.defaultLocale}/login?next=/profile`);
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("saved_recommendations").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/[locale]/profile", "page");
}

export async function deleteAllSaved() {
  const user = await getUser();
  if (!user) redirect(`/${routing.defaultLocale}/login?next=/profile`);
  const supabase = await createClient();
  await supabase.from("saved_recommendations").delete().eq("user_id", user.id);
  revalidatePath("/[locale]/profile", "page");
}

// 회원 탈퇴: 계정과 연결된 프로필·저장 추천·이용 기록은 DB가 함께 삭제한다(on delete cascade).
export async function deleteAccount(formData: FormData) {
  const l = String(formData.get("locale") ?? "");
  const locale = isLocale(l) ? l : routing.defaultLocale;
  const user = await getUser();
  if (!user) redirect(`/${locale}/login`);
  // 확인 단어는 화면(언어별)이 정해 숨은 칸으로 보낸다. 입력과 정확히 같아야 한다.
  const word = String(formData.get("word") ?? "");
  if (!word || String(formData.get("confirm") ?? "").trim().toLowerCase() !== word.toLowerCase()) redirect(`/${locale}/profile?error=confirm`);
  const { error } = await createAdminClient().auth.admin.deleteUser(user.id);
  if (error) redirect(`/${locale}/profile?error=delete`);
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}?deleted=1`);
}
