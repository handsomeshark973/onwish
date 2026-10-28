"use server";

import { cookies } from "next/headers";
import { isLocale, routing, type Locale } from "@/i18n/routing";
import { safeNext } from "@/lib/auth";
import { RECOVERY_COOKIE } from "@/lib/auth-constants";
import { forgotSchema, loginSchema, resetSchema, signupSchema, toFieldErrors, type FieldErrors } from "@/lib/auth-validation";
import { currentGuestId, mergeGuestInto } from "@/lib/guest-merge";
import { mailMode, renderMail, sendMail } from "@/lib/mailer";
import { siteOrigin } from "@/lib/origin";
import { allow, clear, clientIp, hashKey } from "@/lib/rate-limit";
import { REMEMBER_COOKIE } from "@/lib/supabase/cookies";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";


export type AuthResult = { ok: true; next?: string } | { ok: false; error?: string; fieldErrors?: FieldErrors };

const loc = (v: string): Locale => (isLocale(v) ? v : routing.defaultLocale);
const prod = process.env.NODE_ENV === "production";

// ───────── 로그인 ─────────
export async function loginAction(input: unknown, localeInput: string, nextInput?: string): Promise<AuthResult> {
  void loc(localeInput);
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  const { email, password, remember } = parsed.data;

  // 시도 횟수 제한: 이메일별 15분에 5번, 접속 주소별 15분에 30번
  const emailKey = `login:e:${hashKey(email)}`;
  const ipKey = `login:ip:${hashKey(await clientIp())}`;
  if (!(await allow(emailKey, 5, 900)) || !(await allow(ipKey, 30, 900))) return { ok: false, error: "rateLimited" };

  // "로그인 상태 유지"를 끄면 세션 쿠키(브라우저를 닫으면 사라짐)로 저장한다
  const store = await cookies();
  store.set(REMEMBER_COOKIE, remember ? "1" : "0", { httpOnly: true, sameSite: "lax", secure: prod, path: "/", ...(remember ? { maxAge: 60 * 60 * 24 * 400 } : {}) });
  const guestId = await currentGuestId(); // 로그인하면 세션이 바뀌므로 그 전에 게스트인지 확인해 둔다
  const supabase = await createClient({ remember });
  const { data: signedIn, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "email_not_confirmed") return { ok: false, error: "emailNotConfirmed" };
    if (error.status === 429) return { ok: false, error: "rateLimited" };
    // 이메일이 없는지 비밀번호가 틀렸는지는 알려 주지 않는다
    return { ok: false, error: error.code === "invalid_credentials" || error.status === 400 ? "invalidCredentials" : "generic" };
  }
  await clear(emailKey);
  if (guestId && signedIn.user) await mergeGuestInto(guestId, signedIn.user.id); // 게스트로 저장한 프로필·추천을 이 계정으로 합친다
  return { ok: true, next: safeNext(nextInput) };
}

// ───────── 회원가입 ─────────
export async function signupAction(input: unknown, localeInput: string): Promise<AuthResult> {
  const locale = loc(localeInput);
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  const { name, email, password } = parsed.data;

  if (!(await allow(`signup:ip:${hashKey(await clientIp())}`, 10, 3600))) return { ok: false, error: "rateLimited" };

  const origin = await siteOrigin();
  const data = { name, locale, terms_accepted_at: new Date().toISOString() };
  try {
    if (mailMode() === "supabase") {
      const supabase = await createClient();
      await supabase.auth.signUp({ email, password, options: { data, emailRedirectTo: `${origin}/auth/callback?next=/&locale=${locale}` } });
    } else {
      // 우리 쪽에서 메일을 보낸다(개발: 콘솔 출력, 운영: Resend). 이미 가입된 이메일이면 오류가 나지만 같은 응답을 준다.
      const { data: link, error } = await createAdminClient().auth.admin.generateLink({ type: "signup", email, password, options: { data } });
      if (!error && link?.properties?.hashed_token) {
        const url = `${origin}/auth/confirm?token_hash=${encodeURIComponent(link.properties.hashed_token)}&type=signup&next=/&locale=${locale}`;
        const t = await getTranslations({ locale, namespace: "auth.email" });
        await sendMail({ to: email, subject: t("signupSubject"), link: url, ...renderMail({ subject: t("signupSubject"), body: t("signupBody"), button: t("signupButton"), link: url }) });
      } else if (error) console.log("[signup] 메일을 보내지 않았습니다:", error.message);
    }
  } catch (e) {
    console.error("[signup] 처리 실패", e instanceof Error ? e.message : e);
    return { ok: false, error: "generic" };
  }
  return { ok: true };
}

// ───────── 비밀번호 찾기 ─────────
// 이메일이 등록돼 있든 아니든, 한도를 넘었든 아니든 항상 같은 응답을 준다(이메일 존재 여부를 알려 주지 않기 위해).
export async function forgotAction(input: unknown, localeInput: string): Promise<AuthResult> {
  const locale = loc(localeInput);
  const parsed = forgotSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };
  const { email } = parsed.data;

  const okIp = await allow(`forgot:ip:${hashKey(await clientIp())}`, 10, 3600);
  const okEmail = await allow(`forgot:e:${hashKey(email)}`, 3, 3600);
  if (!okIp || !okEmail) return { ok: true };

  try {
    const origin = await siteOrigin();
    if (mailMode() === "supabase") {
      const supabase = await createClient();
      await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=/reset-password&locale=${locale}` });
    } else {
      const { data: link, error } = await createAdminClient().auth.admin.generateLink({ type: "recovery", email });
      if (!error && link?.properties?.hashed_token) {
        const url = `${origin}/auth/confirm?token_hash=${encodeURIComponent(link.properties.hashed_token)}&type=recovery&next=/reset-password&locale=${locale}`;
        const t = await getTranslations({ locale, namespace: "auth.email" });
        await sendMail({ to: email, subject: t("resetSubject"), link: url, ...renderMail({ subject: t("resetSubject"), body: t("resetBody"), button: t("resetButton"), link: url }) });
      }
    }
  } catch (e) {
    console.error("[forgot] 처리 실패", e instanceof Error ? e.message : e);
  }
  return { ok: true };
}

// ───────── 새 비밀번호 ─────────
export async function resetAction(input: unknown): Promise<AuthResult> {
  const parsed = resetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  // 재설정 링크로 들어온 사람만 바꿀 수 있다(링크는 1회용이라, 확인 때 이 쿠키가 만들어진다)
  const store = await cookies();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user || store.get(RECOVERY_COOKIE)?.value !== "1") return { ok: false, error: "linkInvalid" };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: error.code === "same_password" ? "samePassword" : "generic" };

  store.delete(RECOVERY_COOKIE);
  await supabase.auth.signOut({ scope: "global" }); // 모든 기기에서 로그아웃해 새 비밀번호로 다시 로그인하게 한다
  return { ok: true };
}
