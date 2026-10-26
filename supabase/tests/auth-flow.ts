// 인증 흐름 시험(서버 쪽). 실행: npm run test:auth
// 임시 계정을 만들어 가입 인증 → 로그인 → 비밀번호 재설정 → 새 비밀번호 로그인까지 돌리고 마지막에 계정을 지운다.
// 비밀번호와 링크 토큰은 이 스크립트 안에서만 쓰고 화면에 출력하지 않는다.
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

const url = process.env.SUPABASE_URL!, anon = process.env.SUPABASE_ANON_KEY!, service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const mk = (key: string) => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const pw = () => `Ow${randomBytes(8).toString("hex")}9`;
let fails = 0;
const ok = (name: string, cond: boolean, extra = "") => { console.log(`${cond ? "PASS" : "FAIL"} ${name}${extra ? " " + extra : ""}`); if (!cond) fails++; };

async function main() {
  const admin = mk(service);
  const email = `ow-flow-${randomBytes(5).toString("hex")}@example.com`;
  const first = pw(), second = pw();
  let userId = "";
  try {
    // 1) 가입: 링크 생성(메일 대신) → 인증 전에는 로그인이 막힌다
    const gen = await admin.auth.admin.generateLink({ type: "signup", email, password: first, options: { data: { name: "Flow Test", locale: "en" } } });
    ok("가입 링크 생성", !gen.error && !!gen.data?.properties?.hashed_token);
    userId = gen.data?.user?.id ?? "";
    const early = await mk(anon).auth.signInWithPassword({ email, password: first });
    ok("이메일 인증 전 로그인 막힘", early.error?.code === "email_not_confirmed", early.error?.code ?? "");

    // 2) 인증: 토큰 확인 → 로그인됨 → 같은 토큰 재사용 불가(1회용)
    const client = mk(anon);
    const verify = await client.auth.verifyOtp({ type: "signup", token_hash: gen.data?.properties?.hashed_token as string });
    ok("가입 인증 토큰 확인", !verify.error && !!verify.data?.session);
    const reuse = await mk(anon).auth.verifyOtp({ type: "signup", token_hash: gen.data?.properties?.hashed_token as string });
    ok("가입 토큰은 1회용", !!reuse.error);

    // 3) 로그인
    const good = await mk(anon).auth.signInWithPassword({ email, password: first });
    ok("올바른 비밀번호로 로그인", !good.error && !!good.data?.session);
    ok("이름이 가입 정보에 저장됨", good.data?.user?.user_metadata?.name === "Flow Test");
    const bad = await mk(anon).auth.signInWithPassword({ email, password: pw() });
    ok("틀린 비밀번호는 같은 오류 코드", bad.error?.code === "invalid_credentials");
    const ghost = await mk(anon).auth.signInWithPassword({ email: `nobody-${randomBytes(4).toString("hex")}@example.com`, password: pw() });
    ok("없는 이메일도 같은 오류 코드(존재 여부 비노출)", ghost.error?.code === "invalid_credentials" && ghost.error?.message === bad.error?.message);

    // 4) 비밀번호 재설정: 링크 → 토큰 확인 → 새 비밀번호 → 전 기기 로그아웃 → 새 비밀번호 로그인
    const rec = await admin.auth.admin.generateLink({ type: "recovery", email });
    ok("재설정 링크 생성", !rec.error && !!rec.data?.properties?.hashed_token);
    const ghostRec = await admin.auth.admin.generateLink({ type: "recovery", email: `nobody-${randomBytes(4).toString("hex")}@example.com` });
    ok("없는 이메일의 재설정은 링크가 만들어지지 않음(앱은 같은 응답을 줌)", !!ghostRec.error);
    const rc = mk(anon);
    const rv = await rc.auth.verifyOtp({ type: "recovery", token_hash: rec.data?.properties?.hashed_token as string });
    ok("재설정 토큰 확인", !rv.error && !!rv.data?.session);
    const reuse2 = await mk(anon).auth.verifyOtp({ type: "recovery", token_hash: rec.data?.properties?.hashed_token as string });
    ok("재설정 토큰은 1회용", !!reuse2.error);
    const same = await rc.auth.updateUser({ password: first });
    ok("이전과 같은 비밀번호는 거부", same.error?.code === "same_password", same.error?.code ?? "");
    const upd = await rc.auth.updateUser({ password: second });
    ok("새 비밀번호 저장", !upd.error);
    await rc.auth.signOut({ scope: "global" });
    const old = await mk(anon).auth.signInWithPassword({ email, password: first });
    ok("예전 비밀번호는 더 이상 안 됨", !!old.error);
    const neu = await mk(anon).auth.signInWithPassword({ email, password: second });
    ok("새 비밀번호로 로그인", !neu.error && !!neu.data?.session);
  } finally {
    if (userId) await admin.auth.admin.deleteUser(userId);
    console.log("임시 계정 삭제함");
  }
  console.log(fails ? `${fails}개 실패` : "ALL PASSED");
  process.exit(fails ? 1 : 0);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
