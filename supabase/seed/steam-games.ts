// Steam 스토어 공개 정보(https://store.steampowered.com/api)로 게임 정보를 조회해 games.json에 저장한다.
// 실행: npm run seed:steam   (조회만 하고 DB는 건드리지 않는다. DB 반영은 npm run seed:games)
// 값은 모두 스토어가 알려 준 것만 쓴다. 인원·크로스플레이처럼 스토어가 알려 주지 않는 값은 비워 둔다.
import { writeFileSync } from "node:fs";

// [검색어, 스토어 이름과 정확히 같아야 하는 이름, (검색이 안 될 때 쓰는 앱 번호)] — 이름이 다르면 사람이 확인하도록 멈춘다.
const LIST: [string, string, number?][] = [
  ["Lethal Company", "Lethal Company"], ["R.E.P.O.", "R.E.P.O."], ["Content Warning", "Content Warning"], ["Phasmophobia", "Phasmophobia"],
  ["We Were Here", "We Were Here"], ["Keep Talking and Nobody Explodes", "Keep Talking and Nobody Explodes"], ["Chained Together", "Chained Together"],
  ["PEAK", "PEAK"], ["Overcooked! 2", "Overcooked! 2"], ["Liar's Bar", "Liar's Bar"], ["Escape Simulator", "Escape Simulator"], ["RimWorld", "RimWorld"],
  ["The Sims 4", "The Sims 4"], ["Project Zomboid", "Project Zomboid"], ["Grand Theft Auto V Enhanced", "Grand Theft Auto V Enhanced"], ["Goose Goose Duck", "Goose Goose Duck"],
  ["Among Us", "Among Us"], ["GeoGuessr", "GeoGuessr Steam Edition"],
  ["Helldivers 2", "HELLDIVERS 2"], ["Deep Rock Galactic", "Deep Rock Galactic"], ["Left 4 Dead 2", "Left 4 Dead 2"], ["Valheim", "Valheim"], ["Terraria", "Terraria"],
  ["Don't Starve Together", "Don't Starve Together"], ["It Takes Two", "It Takes Two"], ["Fall Guys", "Fall Guys", 1097150], ["Dead by Daylight", "Dead by Daylight"], ["Raft", "Raft"],
  ["Sons Of The Forest", "Sons Of The Forest"], ["Stardew Valley", "Stardew Valley"], ["Palworld", "Palworld"], ["Satisfactory", "Satisfactory"], ["Risk of Rain 2", "Risk of Rain 2"],
  ["Barotrauma", "Barotrauma"], ["Ready or Not", "Ready or Not"], ["Counter-Strike 2", "Counter-Strike 2"], ["Apex Legends", "Apex Legends"], ["PUBG: BATTLEGROUNDS", "PUBG: BATTLEGROUNDS"],
  ["Rust", "Rust"], ["VRChat", "VRChat"], ["Garry's Mod", "Garry's Mod"], ["Gang Beasts", "Gang Beasts"], ["Pummel Party", "Pummel Party"], ["Schedule I", "Schedule I"],
  ["Split Fiction", "Split Fiction"], ["Monster Hunter Wilds", "Monster Hunter Wilds"], ["ELDEN RING NIGHTREIGN", "ELDEN RING NIGHTREIGN"],
];

const norm = (s: string) => s.replace(/[™®©]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const get = async (url: string) => {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(url);
    if (r.ok) return r.json();
    await sleep(1500 * (i + 1));
  }
  throw new Error(`조회 실패: ${url}`);
};

async function main() {
  const out: unknown[] = [];
  const problems: string[] = [];
  for (const [term, want, fixedId] of LIST) {
    const s = fixedId ? { items: [{ id: fixedId, name: want, type: "app" }] } : await get(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&cc=kr&l=english`);
    const items: { id: number; name: string; type: string }[] = (s.items ?? []).filter((i: { type: string }) => i.type === "app");
    const hit = items.find((i) => norm(i.name) === norm(want));
    if (!hit) { problems.push(`${term}: 이름이 같은 결과 없음 → 후보 ${items.slice(0, 4).map((i) => `${i.name}(${i.id})`).join(", ") || "없음"}`); continue; }
    const [en, ko] = await Promise.all([
      get(`https://store.steampowered.com/api/appdetails?appids=${hit.id}&cc=kr&l=english`),
      get(`https://store.steampowered.com/api/appdetails?appids=${hit.id}&cc=kr&l=koreana`),
    ]);
    const d = en[String(hit.id)]?.data, k = ko[String(hit.id)]?.data;
    if (!d) { problems.push(`${term}: 상세 정보 없음(${hit.id})`); continue; }
    out.push({
      appid: hit.id,
      name: d.name,
      nameKo: k?.name && /[가-힣]/.test(k.name) ? k.name : null,
      developers: d.developers ?? [],
      publishers: d.publishers ?? [],
      windows: Boolean(d.platforms?.windows),
      isFree: Boolean(d.is_free),
      priceKrw: d.price_overview?.final_formatted ?? null,
      comingSoon: Boolean(d.release_date?.coming_soon),
      releaseDate: d.release_date?.date ?? null,
      earlyAccess: (d.genres ?? []).some((g: { description: string }) => g.description === "Early Access"),
      genresKo: (k?.genres ?? d.genres ?? []).map((g: { description: string }) => g.description),
      moddable: (d.categories ?? []).some((c: { description: string }) => /Workshop|level editor/i.test(c.description)),
      image: d.header_image ?? null,
      storeUrl: `https://store.steampowered.com/app/${hit.id}/`,
    });
    await sleep(400);
  }
  writeFileSync(new URL("./games.json", import.meta.url), JSON.stringify(out, null, 2));
  console.log(`조회 성공 ${out.length}개 / 목록 ${LIST.length}개`);
  if (problems.length) console.log("확인 필요:\n" + problems.join("\n"));
}
main().catch((e) => { console.error(e.message); process.exit(1); });
