import { z } from "zod";

// 입력 검증. 브라우저(폼)와 서버(서버 동작)가 같은 규칙을 쓴다.
// 오류 문구는 번역 키(auth.errors.<키>)로 두고, 화면에서 현재 언어로 바꿔 보여 준다.
export const emailSchema = z.string().trim().min(1, "emailRequired").max(254, "emailInvalid").email("emailInvalid");

export const passwordSchema = z
  .string()
  .min(8, "passwordShort")
  .max(72, "passwordLong") // bcrypt는 72바이트까지만 읽는다
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "passwordWeak");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "passwordRequired").max(72, "passwordLong"),
  remember: z.boolean(),
});

export const signupSchema = z
  .object({
    name: z.string().trim().min(1, "nameRequired").max(50, "nameTooLong"),
    email: emailSchema,
    password: passwordSchema,
    passwordConfirm: z.string().min(1, "passwordRequired"),
    terms: z.literal(true, { error: "termsRequired" }),
  })
  .refine((v) => v.password === v.passwordConfirm, { path: ["passwordConfirm"], message: "passwordMismatch" });

export const forgotSchema = z.object({ email: emailSchema });

export const resetSchema = z
  .object({ password: passwordSchema, passwordConfirm: z.string().min(1, "passwordRequired") })
  .refine((v) => v.password === v.passwordConfirm, { path: ["passwordConfirm"], message: "passwordMismatch" });

export type FieldErrors = Record<string, string>;

/** zod 오류 → { 필드: 오류키 } (필드마다 첫 번째 오류만) */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
