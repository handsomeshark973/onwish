// "로그인 상태 유지"를 끄면 로그인 쿠키를 브라우저를 닫을 때 사라지는 세션 쿠키로 만든다.
// 켜면(기본) Supabase가 정한 긴 만료 기간을 그대로 쓴다.
export const REMEMBER_COOKIE = "ow_remember";

type Opts = Record<string, unknown>;

export function sessionCookieOptions(options: Opts | undefined, remember: boolean): Opts {
  // 모든 로그인 처리를 서버가 하므로(브라우저 코드가 쿠키를 읽을 일이 없다) httpOnly로 막고, 운영(https)에서는 secure를 켠다.
  const o: Opts = { ...(options ?? {}), httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" };
  if (!remember) {
    delete o.maxAge;
    delete o.expires;
  }
  return o;
}
