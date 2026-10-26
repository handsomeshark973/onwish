import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { isProtectedPath } from "@/config/protected";
import { REMEMBER_COOKIE, sessionCookieOptions } from "@/lib/supabase/cookies";
import { isLocale, routing } from "@/i18n/routing";

const intl = createMiddleware(routing);

// 1) 로그인 세션이 만료되면 새로 고친다(없으면 Supabase를 부르지 않아 공개 페이지가 빠르다)
// 2) 주소에 언어가 없으면 쿠키 → 브라우저 언어(Accept-Language) 순으로 언어를 정해 /ko, /en으로 보낸다
// 3) 보호 페이지(/profile 등)는 로그인 쿠키가 없으면 /login으로 보낸다
export async function proxy(request: NextRequest) {
  const hasSession = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));
  const refreshed: { name: string; value: string; options: Record<string, unknown> }[] = [];

  if (hasSession) {
    const remember = request.cookies.get(REMEMBER_COOKIE)?.value !== "0";
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (items) => {
          items.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            refreshed.push({ name, value, options: sessionCookieOptions(options, remember) });
          });
        },
      },
    });
    // 세션 쿠키를 읽고, 만료됐을 때만 새로 고친다(만료 전에는 Supabase를 부르지 않는다).
    // 예전에는 getUser()로 모든 이동마다 Supabase에 확인을 보내서 로그인 사용자의 언어 전환·페이지 이동이 70~380ms씩 느렸다.
    // 여기서는 권한 판단을 하지 않는다. 진짜 확인(getUser)은 각 페이지·서버 동작이 서버에서 한다.
    await supabase.auth.getSession();
  }

  // 보호 페이지: 언어 부분을 떼고 비교한다
  const seg = request.nextUrl.pathname.split("/");
  if (isLocale(seg[1] ?? "")) {
    const rest = "/" + seg.slice(2).join("/");
    if (isProtectedPath(rest) && !hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = `/${seg[1]}/login`;
      url.search = `?next=${encodeURIComponent(rest + request.nextUrl.search)}`;
      return NextResponse.redirect(url);
    }
  }

  const response = intl(request);
  refreshed.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}

export const config = {
  // 인증 처리 주소(/auth), API, 정적 파일은 언어 처리에서 뺀다
  matcher: ["/((?!auth|api|_next|_vercel|.*\\..*).*)"],
};
