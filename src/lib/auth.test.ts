// 인증 입력 검증·쿠키·주소 안전 규칙 시험. 실행: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { forgotSchema, loginSchema, passwordSchema, resetSchema, signupSchema, toFieldErrors } from "./auth-validation";
import { sessionCookieOptions } from "./supabase/cookies";
import { safeNext } from "./auth";

const err = (r: { success: boolean; error?: import("zod").ZodError }) => (r.success ? {} : toFieldErrors(r.error!));
const good = { name: "홍길동", email: "a@b.co", password: "abcd1234", passwordConfirm: "abcd1234", terms: true as const };

test("비밀번호: 8자 이상 + 영문과 숫자 함께", () => {
  assert.equal(passwordSchema.safeParse("abcd1234").success, true);
  assert.equal(passwordSchema.safeParse("abc123").success, false); // 짧음
  assert.equal(passwordSchema.safeParse("abcdefgh").success, false); // 숫자 없음
  assert.equal(passwordSchema.safeParse("12345678").success, false); // 영문 없음
  assert.equal(passwordSchema.safeParse("a1" + "x".repeat(71)).success, false); // 72자 초과
});

test("가입: 이름·이메일·비밀번호 확인·약관", () => {
  assert.equal(signupSchema.safeParse(good).success, true);
  assert.equal(err(signupSchema.safeParse({ ...good, name: "  " })).name, "nameRequired");
  assert.equal(err(signupSchema.safeParse({ ...good, email: "nope" })).email, "emailInvalid");
  assert.equal(err(signupSchema.safeParse({ ...good, passwordConfirm: "zzzz1234" })).passwordConfirm, "passwordMismatch");
  assert.equal(err(signupSchema.safeParse({ ...good, terms: false })).terms, "termsRequired");
});

test("로그인·비밀번호 찾기·재설정", () => {
  assert.equal(loginSchema.safeParse({ email: "a@b.co", password: "x", remember: true }).success, true);
  assert.equal(err(loginSchema.safeParse({ email: "", password: "", remember: false })).email, "emailRequired");
  assert.equal(forgotSchema.safeParse({ email: "a@b.co" }).success, true);
  assert.equal(err(resetSchema.safeParse({ password: "abcd1234", passwordConfirm: "abcd12345" })).passwordConfirm, "passwordMismatch");
});

test("쿠키: 항상 httpOnly, 로그인 상태 유지를 끄면 만료 기간을 뺀다(세션 쿠키)", () => {
  const base = { maxAge: 34560000, expires: new Date(), path: "/" };
  const keep = sessionCookieOptions(base, true);
  const session = sessionCookieOptions(base, false);
  assert.equal(keep.httpOnly, true);
  assert.equal(session.httpOnly, true);
  assert.equal(keep.sameSite, "lax");
  assert.ok(keep.maxAge);
  assert.equal(session.maxAge, undefined);
  assert.equal(session.expires, undefined);
});

test("로그인 후 이동 주소는 이 사이트 안만 허용", () => {
  assert.equal(safeNext("/profile"), "/profile");
  assert.equal(safeNext("//evil.com"), "/");
  assert.equal(safeNext("https://evil.com"), "/");
  assert.equal(safeNext("/\\evil.com"), "/");
  assert.equal(safeNext(null), "/");
});
