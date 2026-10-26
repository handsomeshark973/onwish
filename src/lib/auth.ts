import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// 로그인한 사용자. 쿠키를 읽으므로 Suspense 안에서만 부를 것.
export async function getUser() {
  // 로그인 확인은 요청이 올 때마다 해야 하므로 미리 만들어 두는(prerender) 대상에서 뺀다.
  // Supabase가 만료 시각을 계산하느라 Date.now()를 쓰는데, 이 값이 미리 만들어지면 안 된다.
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function requireUser(next = "/") {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

// 관리자 여부는 DB의 is_admin() 함수가 판단한다(app_admins 표). 화면 숨김만으로 보호하지 않는다.
export async function isAdmin() {
  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_admin");
  return !error && data === true;
}

// 로그인 후 돌아갈 주소는 이 사이트 안의 경로만 허용한다(외부 주소로 보내는 공격 방지).
export function safeNext(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}
