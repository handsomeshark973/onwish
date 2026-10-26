import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { isProtectedPath } from "@/config/protected";
import { REMEMBER_COOKIE, sessionCookieOptions } from "@/lib/supabase/cookies";
import { isLocale, routing } from "@/i18n/routing";

const intl = createMiddleware(routing);

// 1) 로그인 세션이 있으면 만료 전에 새로 고친다(없으면 Supabase를 부르지 않아 공개 페이지가 빠르다)
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
    await supabase.auth.getUser(); // 서버에서 토큰을 확인하며 필요하면 갱신한다
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
