// 시험용 계정을 만든다. 실행: npm run seed:test-account
// 이메일·비밀번호는 .env의 ONWISH_TEST_EMAIL / ONWISH_TEST_PASSWORD에 있다(없으면 만들어서 .env에 적는다. 화면에는 출력하지 않는다).
// 이미 있는 계정이면 비밀번호만 다시 맞춘다. 공개하기 전에 Supabase 대시보드(Authentication > Users)에서 이 계정을 지우세요.
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { appendFileSync, readFileSync } from "node:fs";

const ENV_FILE = new URL("../../.env", import.meta.url);


function ensureEnv(name: string, make: () => string): string {
  const current = process.env[name];
  if (current) return current;
  const value = make();
  appendFileSync(ENV_FILE, `${readFileSync(ENV_FILE, "utf8").endsWith("\n") ? "" : "\n"}${name}=${value}\n`);
  return value;
}

async function main() {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY가 .env에 없습니다");
  const email = ensureEnv("ONWISH_TEST_EMAIL", () => "onwish.test@example.com");
  // 영문 대소문자 + 숫자를 섞은 무작위 비밀번호 (검증 규칙: 8자 이상, 영문과 숫자 포함)
  const password = ensureEnv("ONWISH_TEST_PASSWORD", () => `Ow${randomBytes(9).toString("base64url").replace(/[-_]/g, "x")}7`);

  const admin = createClient(url, key, { auth: { persistSession: false } }).auth.admin;
  const meta = { name: "Test User", locale: "en", terms_accepted_at: new Date().toISOString() };
  const created = await admin.createUser({ email, password, email_confirm: true, user_metadata: meta });
  if (!created.error) return console.log(`시험 계정을 만들었습니다: ${email} (비밀번호는 .env의 ONWISH_TEST_PASSWORD)`);

  if (/already|registered|exists/i.test(created.error.message)) {
    const list = await admin.listUsers({ page: 1, perPage: 1000 });
    const user = list.data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error("이미 있는 계정을 찾지 못했습니다");
    const upd = await admin.updateUserById(user.id, { password, email_confirm: true, user_metadata: meta });
    if (upd.error) throw new Error(upd.error.message);
    return console.log(`이미 있는 시험 계정의 비밀번호를 .env 값에 맞췄습니다: ${email}`);
  }
  throw new Error(created.error.message);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
