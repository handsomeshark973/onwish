import { NextResponse, type NextRequest } from "next/server";
import { isLocale, routing } from "@/i18n/routing";
import { safeNext } from "@/lib/auth";
import { RECOVERY_COOKIE } from "@/lib/auth-constants";
import { createClient } from "@/lib/supabase/server";

// 이메일 링크(PKCE 방식)를 누르면 여기로 온다. 일회용 코드를 세션으로 바꾼 뒤 원래 가려던 곳으로 보낸다.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));
  const l = searchParams.get("locale") ?? "";
  const locale = isLocale(l) ? l : routing.defaultLocale;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const res = NextResponse.redirect(`${origin}/${locale}${next === "/" ? "" : next}`);
      // 비밀번호 재설정 링크로 들어온 경우, 새 비밀번호 화면을 쓸 수 있도록 표시한다(1시간)
      if (next.startsWith("/reset-password")) res.cookies.set(RECOVERY_COOKIE, "1", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 3600 });
      return res;
    }
  }
  return NextResponse.redirect(`${origin}/${locale}/login?error=link`);
}
