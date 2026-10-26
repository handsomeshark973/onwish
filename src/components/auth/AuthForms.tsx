"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId, useState, useTransition, type FormEvent } from "react";
import { forgotAction, loginAction, resetAction, signupAction, type AuthResult } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Link, useRouter } from "@/i18n/navigation";
import { useReady } from "@/lib/use-ready";
import { forgotSchema, loginSchema, resetSchema, signupSchema, toFieldErrors, type FieldErrors } from "@/lib/auth-validation";

// ───────── 공통 입력 칸 ─────────
// 오류는 입력 칸 바로 아래에 보이고(aria-describedby), 스크린리더에는 role="alert"로 알려 준다.
type FieldProps = {
  label: string;
  name: string;
  type?: "text" | "email" | "password";
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  autoComplete?: string;
  autoFocus?: boolean;
};

function Field({ label, name, type = "text", value, onChange, error, hint, autoComplete, autoFocus }: FieldProps) {
  const t = useTranslations("auth");
  const id = useId();
  const [shown, setShown] = useState(false);
  const isPw = type === "password";
  const describedBy = [error ? `${id}-err` : "", hint ? `${id}-hint` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className="ow-field">
      <label className="ow-label" htmlFor={id}>{label}</label>
      <div className={isPw ? "ow-pw" : undefined}>
        <input
          id={id}
          name={name}
          className="ow-input"
          type={isPw && shown ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          spellCheck={false}
          autoCapitalize="none"
        />
        {isPw && (
          <button type="button" className="ow-pw-toggle" onClick={() => setShown((v) => !v)} aria-pressed={shown} aria-label={shown ? t("field.hide") : t("field.show")}>
            {shown ? "◉" : "○"}
          </button>
        )}
      </div>
      {hint && !error && <p id={`${id}-hint`} className="ow-hint">{hint}</p>}
      {error && <p id={`${id}-err`} className="ow-field-error" role="alert">{t(`errors.${error}`)}</p>}
    </div>
  );
}

function FormError({ code }: { code?: string }) {
  const t = useTranslations("auth.errors");
  if (!code) return null;
  return <p className="ow-note ow-note-error" role="alert">{t(code)}</p>;
}

// 서버 결과를 화면 상태로 옮긴다
function useResult() {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();
  const apply = (r: AuthResult) => {
    if (r.ok) return true;
    setFieldErrors(r.fieldErrors ?? {});
    setFormError(r.error);
    return false;
  };
  const reset = () => { setFieldErrors({}); setFormError(undefined); };
  return { fieldErrors, setFieldErrors, formError, apply, reset };
}

// ───────── 로그인 ─────────
export function LoginForm({ next, notice }: { next: string; notice?: "link" | "reset" | "confirmed" }) {
  const t = useTranslations("auth.login");
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [pending, start] = useTransition();
  const r = useResult();
  const ready = useReady();

  function submit(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    r.reset();
    const input = { email, password, remember };
    const v = loginSchema.safeParse(input);
    if (!v.success) return r.setFieldErrors(toFieldErrors(v.error));
    start(async () => {
      const res = await loginAction(input, locale, next).catch((): AuthResult => ({ ok: false, error: "generic" }));
      if (r.apply(res) && res.ok) {
        router.replace(res.next ?? "/");
        router.refresh();
      }
    });
  }

  return (
    <form className="ow-form ow-auth-form" method="post" onSubmit={submit} noValidate>
      {notice === "link" && <p className="ow-note ow-note-error" role="alert">{t("linkExpired")}</p>}
      {notice === "reset" && <p className="ow-note" role="status">{t("resetDone")}</p>}
      {notice === "confirmed" && <p className="ow-note" role="status">{t("confirmed")}</p>}
      <Field label={useTranslations("auth.field")("email")} name="email" type="email" value={email} onChange={setEmail} error={r.fieldErrors.email} autoComplete="email" autoFocus />
      <Field label={useTranslations("auth.field")("password")} name="password" type="password" value={password} onChange={setPassword} error={r.fieldErrors.password} autoComplete="current-password" />
      <label className="ow-check">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        <span>{t("remember")}</span>
      </label>
      <FormError code={r.formError} />
      <Button type="submit" disabled={pending || !ready}>{pending ? t("submitting") : t("submit")}</Button>
      <p className="ow-auth-links">
        <Link href="/forgot-password">{t("forgot")}</Link>
        <span>{t("noAccount")} <Link href="/signup">{t("toSignup")}</Link></span>
      </p>
    </form>
  );
}

// ───────── 회원가입 ─────────
export function SignupForm() {
  const t = useTranslations("auth.signup");
  const f = useTranslations("auth.field");
  const tf = useTranslations("footer");
  const locale = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [pending, start] = useTransition();
  const [sent, setSent] = useState(false);
  const r = useResult();
  const ready = useReady();

  function submit(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    r.reset();
    const input = { name, email, password, passwordConfirm, terms };
    const v = signupSchema.safeParse(input);
    if (!v.success) return r.setFieldErrors(toFieldErrors(v.error));
    start(async () => {
      const res = await signupAction(input, locale).catch((): AuthResult => ({ ok: false, error: "generic" }));
      if (r.apply(res)) setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="ow-state" role="status">
        <p className="ow-state-title">{t("sentTitle")}</p>
        <p className="ow-state-hint">{t("sentHint")}</p>
        <p className="ow-state-hint">{t("sentGeneric")}</p>
        <Link className="ow-btn ow-btn-secondary" href="/login">{t("toLogin")}</Link>
      </div>
    );
  }

  return (
    <form className="ow-form ow-auth-form" method="post" onSubmit={submit} noValidate>
      <Field label={f("name")} name="name" value={name} onChange={setName} error={r.fieldErrors.name} autoComplete="name" autoFocus />
      <Field label={f("email")} name="email" type="email" value={email} onChange={setEmail} error={r.fieldErrors.email} autoComplete="email" />
      <Field label={f("password")} name="password" type="password" value={password} onChange={setPassword} error={r.fieldErrors.password} hint={f("passwordHint")} autoComplete="new-password" />
      <Field label={f("passwordConfirm")} name="passwordConfirm" type="password" value={passwordConfirm} onChange={setPasswordConfirm} error={r.fieldErrors.passwordConfirm} autoComplete="new-password" />
      <div className="ow-field">
        <label className="ow-check">
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} aria-invalid={r.fieldErrors.terms ? true : undefined} />
          <span>
            {t.rich("agree", {
              terms: () => <Link href="/terms" target="_blank">{tf("terms")}</Link>,
              privacy: () => <Link href="/privacy" target="_blank">{tf("privacy")}</Link>,
            })}
          </span>
        </label>
        {r.fieldErrors.terms && <ErrorLine code={r.fieldErrors.terms} />}
      </div>
      <FormError code={r.formError} />
      <Button type="submit" disabled={pending || !ready}>{pending ? t("submitting") : t("submit")}</Button>
      <p className="ow-auth-links"><span>{t("haveAccount")} <Link href="/login">{t("toLogin")}</Link></span></p>
    </form>
  );
}

function ErrorLine({ code }: { code: string }) {
  const t = useTranslations("auth.errors");
  return <p className="ow-field-error" role="alert">{t(code)}</p>;
}

// ───────── 비밀번호 찾기 ─────────
export function ForgotForm() {
  const t = useTranslations("auth.forgot");
  const f = useTranslations("auth.field");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [pending, start] = useTransition();
  const [sent, setSent] = useState(false);
  const r = useResult();
  const ready = useReady();

  function submit(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    r.reset();
    const v = forgotSchema.safeParse({ email });
    if (!v.success) return r.setFieldErrors(toFieldErrors(v.error));
    start(async () => {
      const res = await forgotAction({ email }, locale).catch((): AuthResult => ({ ok: false, error: "generic" }));
      if (r.apply(res)) setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="ow-state" role="status">
        <p className="ow-state-title">{t("sentTitle")}</p>
        <p className="ow-state-hint">{t("sentHint")}</p>
        <Link className="ow-btn ow-btn-secondary" href="/login">{t("back")}</Link>
      </div>
    );
  }

  return (
    <form className="ow-form ow-auth-form" method="post" onSubmit={submit} noValidate>
      <Field label={f("email")} name="email" type="email" value={email} onChange={setEmail} error={r.fieldErrors.email} autoComplete="email" autoFocus />
      <FormError code={r.formError} />
      <Button type="submit" disabled={pending || !ready}>{pending ? t("submitting") : t("submit")}</Button>
      <p className="ow-auth-links"><Link href="/login">{t("back")}</Link></p>
    </form>
  );
}

// ───────── 새 비밀번호 ─────────
export function ResetForm() {
  const t = useTranslations("auth.reset");
  const f = useTranslations("auth.field");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [pending, start] = useTransition();
  const r = useResult();
  const ready = useReady();

  function submit(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    r.reset();
    const input = { password, passwordConfirm };
    const v = resetSchema.safeParse(input);
    if (!v.success) return r.setFieldErrors(toFieldErrors(v.error));
    start(async () => {
      const res = await resetAction(input).catch((): AuthResult => ({ ok: false, error: "generic" }));
      if (r.apply(res)) {
        router.replace("/login?reset=1");
        router.refresh();
      }
    });
  }

  return (
    <form className="ow-form ow-auth-form" method="post" onSubmit={submit} noValidate>
      <Field label={f("passwordNew")} name="password" type="password" value={password} onChange={setPassword} error={r.fieldErrors.password} hint={f("passwordHint")} autoComplete="new-password" autoFocus />
      <Field label={f("passwordConfirm")} name="passwordConfirm" type="password" value={passwordConfirm} onChange={setPasswordConfirm} error={r.fieldErrors.passwordConfirm} autoComplete="new-password" />
      <FormError code={r.formError} />
      <Button type="submit" disabled={pending || !ready}>{pending ? t("submitting") : t("submit")}</Button>
    </form>
  );
}
