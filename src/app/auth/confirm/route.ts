import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { isLocale, routing } from "@/i18n/routing";
import { safeNext } from "@/lib/auth";
import { RECOVERY_COOKIE } from "@/lib/auth-constants";
import { createClient } from "@/lib/supabase/server";

const TYPES: EmailOtpType[] = ["signup", "recovery", "email", "magiclink"];

// 우리가 만든 메일 링크(개발: 콘솔 출력, 운영: Resend)는 여기로 온다. 일회용 토큰을 확인해 로그인시킨다.
// 같은 링크를 다시 누르거나 1시간이 지나면 확인에 실패한다.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));
  const l = searchParams.get("locale") ?? "";
  const locale = isLocale(l) ? l : routing.defaultLocale;

  if (tokenHash && type && TYPES.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      const res = NextResponse.redirect(`${origin}/${locale}${next === "/" ? "" : next}`);
      if (type === "recovery") res.cookies.set(RECOVERY_COOKIE, "1", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 3600 });
      return res;
    }
  }
  return NextResponse.redirect(`${origin}/${locale}/login?error=link`);
}
