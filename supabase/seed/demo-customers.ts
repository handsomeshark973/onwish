// 관리자 고객 현황 화면용 가상 고객(데모)을 만든다. 실행: npm run seed:demo-customers  /  지우기: npm run seed:demo-customers -- --remove
// - 진짜 방문자와 같은 방식(익명 게스트 계정)으로 만들고, 이벤트·고객 정보를 채운다. 이름·이메일 등 개인정보는 없다.
// - 만든 계정의 ID를 outputs/demo-customers-ids.json에 적어 두고, --remove는 그 ID(게스트 계정)만 지운다. 다른 고객은 건드리지 않는다.
// - 운영 DB에 들어가므로 관리자 화면 숫자에 그대로 섞여 보인다. 시연이 끝나면 지우세요.
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { INFER } from "../../src/config/customerTypes";
import { inferCustomerType, preferredTier, type EventRow } from "../../src/lib/customer-type";

const IDS_FILE = new URL("../../outputs/demo-customers-ids.json", import.meta.url);
const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceKey) throw new Error("SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY가 .env에 없습니다");
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

// 같은 결과가 나오도록 고정 난수
let seed = 20261028;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T,>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)];
const between = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
const DAY = 86400_000;

type Persona = {
  kind: "crew_small" | "crew_large" | "solo_game" | "solo_talk" | "undecided" | "insufficient";
  type: "solo_game" | "solo_talk" | "crew" | null;
  self: boolean;
  platforms: string[];
  experience: string | null;
};
const P = (kind: Persona["kind"], type: Persona["type"], self: boolean, platforms: string[], experience: string | null): Persona => ({ kind, type, self, platforms, experience });
const PERSONAS: Persona[] = [
  // 합방 크루 9명 (소수 합방 6, 다수 합방 3)
  P("crew_small", "crew", true, ["soop"], "over_2y"), P("crew_small", "crew", true, ["chzzk", "youtube"], "6m_2y"), P("crew_small", "crew", false, ["soop"], "6m_2y"),
  P("crew_small", "crew", false, ["chzzk"], "over_2y"), P("crew_small", "crew", false, [], null), P("crew_small", "crew", true, ["youtube"], "under_6m"),
  P("crew_large", "crew", true, ["soop", "chzzk"], "over_2y"), P("crew_large", "crew", false, ["soop"], "over_2y"), P("crew_large", "crew", false, ["other"], "6m_2y"),
  // 게임 중심 솔로 7명
  P("solo_game", "solo_game", true, ["chzzk"], "6m_2y"), P("solo_game", "solo_game", true, ["soop"], "over_2y"), P("solo_game", "solo_game", false, ["youtube"], "under_6m"),
  P("solo_game", "solo_game", false, ["chzzk", "soop"], "6m_2y"), P("solo_game", "solo_game", false, [], null), P("solo_game", "solo_game", true, ["youtube"], "over_2y"),
  P("solo_game", "solo_game", false, ["soop"], "under_6m"),
  // 소통 중심 솔로 6명
  P("solo_talk", "solo_talk", true, ["soop"], "over_2y"), P("solo_talk", "solo_talk", true, ["chzzk"], "6m_2y"), P("solo_talk", "solo_talk", false, ["soop", "youtube"], "6m_2y"),
  P("solo_talk", "solo_talk", false, ["chzzk"], "under_6m"), P("solo_talk", "solo_talk", false, [], null), P("solo_talk", "solo_talk", false, ["soop"], "over_2y"),
  // 미분류 4명 (솔로 스타일 미정 2, 근거 부족 2)
  P("undecided", null, false, ["chzzk"], "under_6m"), P("undecided", null, false, [], null),
  P("insufficient", null, false, [], null), P("insufficient", null, false, ["soop"], "under_6m"),
];

type ContentRow = { slug: string; main_appeal: string; watch_mode: string; viewer_participation: string };

function buildEvents(p: Persona, contents: ContentRow[], gameSlugs: string[], firstSeen: number, now: number) {
  const at = () => new Date(firstSeen + rnd() * (now - firstSeen)).toISOString();
  const ev: { type: string; payload: Record<string, unknown>; created_at: string }[] = [];
  const talkish = contents.filter((c) => c.main_appeal === "audio" || c.viewer_participation !== "none");
  const gameish = contents.filter((c) => c.main_appeal === "visual" && c.watch_mode === "focus");
  const any = contents.length ? contents : [];
  const pool = p.kind === "solo_talk" ? (talkish.length ? talkish : any) : p.kind === "solo_game" ? (gameish.length ? gameish : any) : any;
  const content = (c: ContentRow) => ({ slug: c.slug, mainAppeal: c.main_appeal, watchMode: c.watch_mode, viewerParticipation: c.viewer_participation });
  // neutral: 스타일 신호가 없는 요청(캠 미사용·커뮤니티 활동 없음)
  const request = (tier: string, strengths: string[], neutral = false) =>
    ev.push({ type: "recommend_requested", payload: { tier, strengths, usesCam: neutral ? false : rnd() < 0.7, communityActivity: neutral ? null : pick(["low", "mid", "high", null]) }, created_at: at() });
  const save = () => { const c = pick(pool); ev.push({ type: "recommend_saved", payload: { mainAppeal: c.main_appeal, watchMode: c.watch_mode, viewerParticipation: c.viewer_participation, source: pick(["ai", "rule"]) }, created_at: at() }); };
  const viewContent = () => { const c = pick(pool); ev.push({ type: "content_viewed", payload: content(c), created_at: at() }); };
  const viewGame = () => ev.push({ type: "game_viewed", payload: { slug: pick(gameSlugs) }, created_at: at() });

  switch (p.kind) {
    case "crew_small": for (let i = between(3, 5); i--; ) request(rnd() < 0.85 ? "small" : "large", ["chemistry", "talk"]); for (let i = between(1, 3); i--; ) save(); for (let i = between(1, 3); i--; ) viewContent(); break;
    case "crew_large": for (let i = between(3, 4); i--; ) request("large", ["chemistry"]); for (let i = between(1, 2); i--; ) save(); viewContent(); break;
    case "solo_game": for (let i = between(3, 5); i--; ) request("solo", pick([["skill"], ["skill", "creation"]])); for (let i = between(1, 4); i--; ) save(); for (let i = between(3, 6); i--; ) viewGame(); viewContent(); break;
    case "solo_talk": for (let i = between(3, 5); i--; ) request("solo", pick([["talk"], ["talk", "reaction"]])); for (let i = between(2, 4); i--; ) save(); for (let i = between(1, 3); i--; ) viewContent(); break;
    case "undecided": request("solo", [], true); request("solo", [], true); break;
    case "insufficient": if (p.platforms.length) request("solo", ["talk"], true); break;
  }
  return ev.sort((a, b) => a.created_at.localeCompare(b.created_at));
}

async function remove() {
  if (!existsSync(IDS_FILE)) return console.log("지울 데모 고객 목록(outputs/demo-customers-ids.json)이 없습니다.");
  const ids: string[] = JSON.parse(readFileSync(IDS_FILE, "utf8"));
  let n = 0;
  for (const id of ids) {
    const u = await admin.auth.admin.getUserById(id);
    if (u.data.user?.is_anonymous !== true) { console.log("건너뜀(게스트 계정이 아님):", id.slice(0, 8)); continue; } // 안전장치: 게스트 계정만 지운다
    const d = await admin.auth.admin.deleteUser(id);
    if (!d.error) n++;
  }
  writeFileSync(IDS_FILE, "[]\n");
  console.log(`데모 고객 ${n}명을 지웠습니다.`);
}

async function create() {
  if (existsSync(IDS_FILE) && (JSON.parse(readFileSync(IDS_FILE, "utf8")) as string[]).length) throw new Error("이미 데모 고객이 있습니다. 먼저 npm run seed:demo-customers -- --remove 로 지우세요.");
  const [{ data: contents }, { data: games }] = await Promise.all([
    admin.from("contents").select("slug, main_appeal, watch_mode, viewer_participation").eq("approval_status", "approved"),
    admin.from("games").select("slug").eq("approval_status", "approved"),
  ]);
  if (!contents?.length || !games?.length) throw new Error("승인된 컨텐츠·게임이 없습니다");
  const gameSlugs = games.map((g) => g.slug);
  const now = Date.now();

  // 1) 먼저 메모리에서 만들고, 판정 로직이 의도한 유형을 내는지 확인한다(하루 한 번 계산이 값을 바꾸지 않도록)
  const plans = PERSONAS.map((p) => {
    const firstSeen = now - between(2, 28) * DAY - between(0, 20) * 3600_000;
    const events = buildEvents(p, contents as ContentRow[], gameSlugs, firstSeen, now);
    const rows: EventRow[] = events.map((e) => ({ type: e.type, at: e.created_at, payload: e.payload }));
    const inf = inferCustomerType(rows, new Date(now));
    if (!p.self && inf.customerType !== p.type) throw new Error(`판정 불일치: ${p.kind} 기대 ${p.type} / 결과 ${inf.customerType} (${inf.reason})`);
    if (p.kind === "undecided" && !inf.soloInferred) throw new Error("솔로(스타일 미정)로 판정되지 않았습니다");
    if (p.kind === "insufficient" && (inf.customerType !== null || inf.soloInferred)) throw new Error("근거 부족으로 판정되지 않았습니다");
    return { p, firstSeen, events, rows, inf };
  });

  // 2) 게스트 계정을 만들고 채운다
  const ids: string[] = [];
  for (const { p, firstSeen, events, rows, inf } of plans) {
    const s = createClient(url!, anonKey!, { auth: { persistSession: false } });
    const { data, error } = await s.auth.signInAnonymously();
    if (error || !data.user) throw new Error("게스트 생성 실패: " + (error?.message ?? ""));
    const id = data.user.id;
    ids.push(id);
    writeFileSync(IDS_FILE, JSON.stringify(ids, null, 2) + "\n"); // 중간에 실패해도 만든 계정을 지울 수 있게 바로 적는다
    const rec = events.filter((e) => e.type === "recommend_requested").length;
    const sav = events.filter((e) => e.type === "recommend_saved").length;
    await admin.rpc("customer_touch", { p_user: id, p_guest: true, p_recommend: rec, p_saved: sav });
    const last = events.length ? Math.max(...events.map((e) => Date.parse(e.created_at))) : firstSeen;
    const typed = p.self ? p.type : inf.customerType;
    const up = await admin.from("customer_profiles").update({
      customer_type: typed, type_source: typed ? (p.self ? "self" : "inferred") : null, solo_inferred: !p.self && inf.soloInferred,
      platforms: p.platforms, streaming_experience: p.experience, preferred_tier: preferredTier(rows),
      first_seen_at: new Date(firstSeen).toISOString(), last_active_at: new Date(last).toISOString(),
    }).eq("user_id", id);
    if (up.error) throw new Error(up.error.message);
    if (events.length) {
      const ins = await admin.from("user_events").insert(events.map((e) => ({ user_id: id, ...e })));
      if (ins.error) throw new Error(ins.error.message);
    }
    // 데모가 14일 뒤 자동 정리되지 않도록 만료일을 1년 뒤로 둔다(시연 후 --remove로 지우세요)
    await admin.from("guest_activity").upsert({ user_id: id, last_active_at: new Date().toISOString(), expires_at: new Date(now + 365 * DAY).toISOString() });
  }
  console.log(`데모 고객 ${ids.length}명을 만들었습니다. (최근 ${INFER.windowDays}일 행동 기준, 만든 ID는 outputs/demo-customers-ids.json)`);
}

(process.argv.includes("--remove") ? remove() : create()).catch((e) => { console.error(e.message ?? e); process.exit(1); });
