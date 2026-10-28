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

// 헤더에 이름을 보여 주는 용도 전용. 세션 쿠키만 읽고 Supabase에 확인을 보내지 않아 빠르다.
// 쿠키 내용은 서버가 검증하지 않았으므로 권한 판단에는 절대 쓰지 말고, 그럴 때는 getUser()를 쓴다.
export async function getDisplayUser() {
  // 세션 확인은 요청마다 해야 한다. 미리 만들어 두는(prerender) 대상에서 빼지 않으면 Supabase가 쓰는 Date.now()가 오류로 보고된다(getUser와 같은 이유).
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

export async function requireUser(next = "/") {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

// 관리자 여부는 DB의 is_admin() 함수가 판단한다(app_admins 표). 화면 숨김만으로 보호하지 않는다.
// 게스트(익명 사용자)는 서버에서 먼저 거부한다. DB의 is_admin()도 0009 이후 익명 사용자를 거부한다.
export async function isAdmin() {
  await connection();
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user || u.user.is_anonymous === true) return false;
  const { data, error } = await supabase.rpc("is_admin");
  return !error && data === true;
}

// 로그인 후 돌아갈 주소는 이 사이트 안의 경로만 허용한다(외부 주소로 보내는 공격 방지).
export function safeNext(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}
