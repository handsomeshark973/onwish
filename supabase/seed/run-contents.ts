// 컨텐츠 시드를 DB에 넣는다. 실행: npm run seed:contents
// 서버 전용 관리 키로 실행하며, 같은 slug가 있으면 덮어쓴다(여러 번 실행해도 안전). 넣은 컨텐츠는 바로 공개(approved)된다.
import { createClient } from "@supabase/supabase-js";
import { AUDIENCE_BY_CHANNEL, CONTENT_SEEDS, RANGE } from "./contents";
import { CONTENT_EN } from "./contents.en";

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY가 .env에 없습니다");
  const db = createClient(url, key, { auth: { persistSession: false } });
  const now = new Date().toISOString();

  const rows = CONTENT_SEEDS.map((s) => {
    const [min, max] = s.range ?? RANGE[s.tier];
    const audience = [...new Set(s.channels.flatMap((c) => AUDIENCE_BY_CHANNEL[c]))];
    return {
      slug: s.slug,
      title: s.title,
      player_tier: s.tier,
      required_min: min,
      required_max: max,
      participation_mode: "simultaneous",
      origin: s.origin,
      borrowed_from: s.borrowedFrom ?? null,
      structures: s.structures,
      lifecycle: s.lifecycle,
      audience_fit: audience.length ? audience : ["s", "m", "l"],
      devices: s.devices ?? ["PC"],
      games_text: s.gamesText ?? null,
      mods_or_setup: s.setup ?? null,
      main_appeal: s.appeal,
      appeal_points: s.points,
      appeal_text: s.appealText,
      watch_mode: s.appeal === "audio" ? "background" : "focus",
      how_to: s.howTo.join("\n"),
      multi_pov_point: s.multiPov ?? null,
      viewer_participation: s.participation,
      participation_channels: s.channels,
      participation_by_size: s.by ?? {},
      continuity: s.continuity ?? null,
      cautions: s.cautions ?? null,
      is_horror: s.horror === true,
      motion_sickness_risk: s.noMotion ? false : null,
      spoiler_risk: s.spoiler === true,
      // 영어 화면용 번역. 한국어 원본 열은 그대로 두고, 영어는 translations.en에 저장한다.
      translations: (() => {
        const e = CONTENT_EN[s.slug];
        if (!e) return {};
        return { en: { title: e.title, appealText: e.appealText, howTo: e.howTo.join("\n"), multiPov: e.multiPov, by: e.by, continuity: e.continuity, cautions: e.cautions, setup: e.setup, gamesText: e.gamesText, borrowedFrom: e.borrowedFrom } };
      })(),
      approval_status: "approved",
      last_checked_at: now,
    };
  });

  const up = await db.from("contents").upsert(rows, { onConflict: "slug" }).select("id, slug");
  if (up.error) throw new Error(`컨텐츠 저장 실패: ${up.error.message}`);
  const idBySlug = new Map((up.data ?? []).map((r) => [r.slug as string, r.id as string]));

  const games = await db.from("games").select("id, slug");
  const gameBySlug = new Map((games.data ?? []).map((g) => [g.slug as string, g.id as string]));
  const links = CONTENT_SEEDS.flatMap((s) =>
    (s.linkGames ?? []).flatMap((g) => (gameBySlug.has(g) ? [{ content_id: idBySlug.get(s.slug)!, game_id: gameBySlug.get(g)! }] : [])),
  );
  if (links.length) {
    const l = await db.from("content_games").upsert(links, { onConflict: "content_id,game_id" });
    if (l.error) throw new Error(`게임 연결 실패: ${l.error.message}`);
  }
  const skipped = CONTENT_SEEDS.flatMap((s) => (s.linkGames ?? []).filter((g) => !gameBySlug.has(g)).map((g) => `${s.slug}→${g}`));
  console.log(`컨텐츠 ${rows.length}개 저장, 게임 연결 ${links.length}개${skipped.length ? `, 게임이 없어 건너뜀: ${skipped.join(", ")}` : ""}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
