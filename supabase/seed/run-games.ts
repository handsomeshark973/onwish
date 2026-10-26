// games.json(Steam 조회 결과)과 games-other.ts를 DB에 넣는다. 실행: npm run seed:games
// 같은 slug가 있으면 덮어쓴다. 직접 등록한 BOMBANANA!, Escape From Playtime은 건드리지 않는다.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { OTHER_GAMES } from "./games-other";
import { FORMAT_EN, GAME_EN, GENRE_EN } from "./games.en";

type Steam = {
  appid: number; name: string; nameKo: string | null; developers: string[]; publishers: string[]; windows: boolean; isFree: boolean;
  priceKrw: string | null; comingSoon: boolean; releaseDate: string | null; earlyAccess: boolean; genresKo: string[]; moddable: boolean;
  image: string | null; storeUrl: string;
};

const slugify = (s: string) => s.replace(/[™®©'’]/g, "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const toIso = (s: string | null) => { const d = s ? new Date(`${s} UTC`) : null; return d && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : null; };
// 기획서 9.1이 "공포"라고 적은 게임, 근접 보이스를 쓴다고 적은 게임
const HORROR = new Set(["lethal-company", "r-e-p-o", "content-warning", "phasmophobia"]);
const PROXIMITY = HORROR;

async function main() {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY가 .env에 없습니다");
  const db = createClient(url, key, { auth: { persistSession: false } });
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const daysAgo = (iso: string | null) => (iso ? (now.getTime() - new Date(iso).getTime()) / 86400000 : null);

  const steam: Steam[] = JSON.parse(readFileSync(new URL("./games.json", import.meta.url), "utf8"));
  const games: Record<string, unknown>[] = [];
  const sources: { slug: string; title: string; url: string }[] = [];
  const dates: { slug: string; label: string; date: string; source: string }[] = [];

  for (const g of steam) {
    const slug = slugify(g.name);
    const release = toIso(g.releaseDate);
    const age = daysAgo(release);
    const won = g.priceKrw?.replace("₩ ", "₩");
    const price = g.isFree ? "무료 (Steam)" : won ? `${won} (Steam, ${today} 확인)` : null;
    const priceEn = g.isFree ? "Free (Steam)" : won ? `${won} (Steam, checked ${today})` : null;
    games.push({
      slug, name: g.name.replace(/[™®©]/g, ""), name_ko: g.nameKo?.replace(/[™®©]/g, "") ?? null,
      developer: g.developers.slice(0, 3).join(", ") || "확인 필요", publisher: g.publishers.slice(0, 2).join(", ") || null,
      stage: g.comingSoon ? "announced" : g.earlyAccess ? "early_access" : "released",
      release_phase: g.comingSoon ? "upcoming" : age !== null && age <= 14 ? "launch_window" : "post_launch",
      release_basis_label: g.earlyAccess ? "Steam 얼리 액세스 출시일" : "Steam 출시일", release_basis_date: release,
      // 오래전부터 많이 알려진 게임은 관리자(요청자)가 상시로 확인한 것으로 둔다. 출시 후 180일이 넘은 게임만.
      evergreen_confirmed: !g.comingSoon && age !== null && age > 180,
      platforms: g.windows ? ["PC"] : [], genre: g.genresKo, price_note: price,
      moddable: g.moddable, asymmetric_roles: false, proximity_voice: PROXIMITY.has(slug), is_horror: HORROR.has(slug) ? true : null,
      image_url: g.image, image_source: "Steam 스토어",
      translations: { en: { genre: g.genresKo.map((x) => GENRE_EN[x] ?? x), priceNote: priceEn } },
      approval_status: "approved", last_checked_at: now.toISOString(),
    });
    sources.push({ slug, title: "Steam 스토어", url: g.storeUrl });
    if (release) dates.push({ slug, label: g.earlyAccess ? "얼리 액세스 출시" : "출시", date: release, source: g.storeUrl });
  }

  for (const o of OTHER_GAMES) {
    const age = daysAgo(o.releaseDate);
    games.push({
      slug: o.slug, name: o.name, name_ko: o.nameKo, developer: o.developer, publisher: o.publisher,
      stage: "released", release_phase: "post_launch", release_basis_date: o.releaseDate, release_basis_label: o.releaseDate ? "공식 페이지 출시일" : null,
      evergreen_confirmed: age !== null && age > 180 || o.slug === "roblox",
      platforms: o.platforms, crossplay: o.crossplay, price_note: o.priceNote, genre: o.genre,
      moddable: false, asymmetric_roles: false, proximity_voice: false,
      min_players: "players" in o ? (o as { players: { min: number; max: number } }).players.min : null,
      max_players: "players" in o ? (o as { players: { min: number; max: number } }).players.max : null,
      translations: { en: { genre: o.genre.map((x) => GENRE_EN[x] ?? x), priceNote: o.priceNote ? "US$59.99 (Nintendo US store, checked 2026-10-26)" : null } },
      approval_status: "approved", last_checked_at: now.toISOString(),
    });
    for (const s of o.sources) sources.push({ slug: o.slug, ...s });
    if (o.releaseDate) dates.push({ slug: o.slug, label: "출시", date: o.releaseDate, source: o.sources[0].url });
  }

  const up = await db.from("games").upsert(games, { onConflict: "slug" }).select("id, slug");
  if (up.error) throw new Error(`게임 저장 실패: ${up.error.message}`);
  const id = new Map((up.data ?? []).map((r) => [r.slug as string, r.id as string]));
  const ids = [...id.values()];

  // 출처·날짜는 이 게임들 것만 지우고 다시 넣는다(여러 번 실행해도 중복되지 않게)
  await db.from("game_sources").delete().in("game_id", ids);
  await db.from("game_key_dates").delete().in("game_id", ids);
  const s = await db.from("game_sources").insert(sources.map((x) => ({ game_id: id.get(x.slug)!, title: x.title, url: x.url, checked_at: now.toISOString() })));
  if (s.error) throw new Error(`출처 저장 실패: ${s.error.message}`);
  const d = await db.from("game_key_dates").insert(dates.map((x) => ({ game_id: id.get(x.slug)!, label: x.label, date: x.date, source: x.source })));
  if (d.error) throw new Error(`날짜 저장 실패: ${d.error.message}`);

  // 직접 등록한 게임 2개와 진행 방식 6개의 영어 번역
  for (const [slug, en] of Object.entries(GAME_EN)) {
    const r = await db.from("games").update({ translations: { en } }).eq("slug", slug);
    if (r.error) throw new Error(`게임 번역 저장 실패(${slug}): ${r.error.message}`);
  }
  for (const [koTitle, en] of Object.entries(FORMAT_EN)) {
    const r = await db.from("game_formats").update({ translations: { en } }).eq("title", koTitle);
    if (r.error) throw new Error(`진행 방식 번역 저장 실패(${koTitle}): ${r.error.message}`);
  }

  // 컨텐츠와 연결: 컨텐츠 시드의 gamesText에 이름이 나오는 게임
  const LINKS: Record<string, string[]> = {
    "small-asymmetric-coop": ["we-were-here", "keep-talking-and-nobody-explodes"],
    "small-proximity-voice-horror": ["lethal-company", "r-e-p-o", "content-warning", "phasmophobia"],
    "small-physics-coop-conflict": ["chained-together", "peak", "overcooked-2"],
    "small-competitive-party": ["liars-bar"],
    "solo-viewer-made-course": ["super-mario-maker-2", "escape-simulator"],
    "solo-viewer-settlers": ["rimworld", "the-sims-4", "project-zomboid"],
    "solo-geoguessr-chat": ["geoguessr-steam-edition"],
    "solo-roblox-viewer-server": ["roblox"],
    "large-roleplay-server": ["grand-theft-auto-v-enhanced", "minecraft"],
    "large-social-deduction": ["goose-goose-duck", "among-us"],
    "solo-oneblock-growth": ["minecraft"], "solo-minecraft-labor-talk": ["minecraft"], "small-minecraft-boss-raid": ["minecraft"],
    "small-minecraft-labor": ["minecraft"], "small-minecraft-manhunt": ["minecraft"], "large-minecraft-life-server": ["minecraft"],
    "large-minecraft-team-shuffle-league": ["minecraft"], "large-minecraft-mass-build": ["minecraft"], "large-minecraft-mass-labor-server": ["minecraft"],
  };
  const contents = await db.from("contents").select("id, slug");
  const cid = new Map((contents.data ?? []).map((c) => [c.slug as string, c.id as string]));
  const links = Object.entries(LINKS).flatMap(([c, gs]) => gs.flatMap((g) => (cid.has(c) && id.has(g) ? [{ content_id: cid.get(c)!, game_id: id.get(g)! }] : [])));
  const l = await db.from("content_games").upsert(links, { onConflict: "content_id,game_id" });
  if (l.error) throw new Error(`컨텐츠 연결 실패: ${l.error.message}`);
  const miss = Object.values(LINKS).flat().filter((g) => !id.has(g));
  console.log(`게임 ${games.length}개 저장, 출처 ${sources.length}개, 날짜 ${dates.length}개, 컨텐츠 연결 ${links.length}개${miss.length ? `, 없는 게임: ${[...new Set(miss)].join(", ")}` : ""}`);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
