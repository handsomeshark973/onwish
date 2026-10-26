import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { REMEMBER_COOKIE, sessionCookieOptions } from "./cookies";

// 서버용. 로그인한 사용자의 쿠키로 요청하므로 RLS가 그 사용자 권한으로 적용된다.
export async function createClient(opts?: { remember?: boolean }) {
  const cookieStore = await cookies();
  // 로그인 직후에는 방금 고른 값(opts.remember)을, 그 밖에는 저장된 선택을 따른다
  const remember = opts?.remember ?? cookieStore.get(REMEMBER_COOKIE)?.value !== "0";
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        try {
          items.forEach(({ name, value, options }) => cookieStore.set(name, value, sessionCookieOptions(options, remember)));
        } catch {
          // 서버 컴포넌트에서는 쿠키를 쓸 수 없다. 세션 갱신은 프록시와 서버 동작이 한다.
        }
      },
    },
  });
}
