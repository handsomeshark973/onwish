import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";
import { getContents } from "@/lib/data/contents";
import { getGames } from "@/lib/data/games";

const LOCALES = ["ko", "en"] as const;

// 사이트맵: 공개 페이지와 게임·컨텐츠 상세를 두 언어로 모두 올리고, 서로 다른 언어 주소를 alternates로 알린다.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [games, contents] = await Promise.all([getGames("ko"), getContents("ko")]);
  const paths = ["", "/recommend", "/radar", "/library", "/privacy", "/terms", ...games.map((g) => `/radar/${g.slug}`), ...contents.map((c) => `/library/${c.slug}`)];
  return paths.flatMap((p) =>
    LOCALES.map((l) => ({
      url: `${SITE_URL}/${l}${p}`,
      changeFrequency: p === "" || p === "/radar" ? ("daily" as const) : ("weekly" as const),
      alternates: { languages: Object.fromEntries(LOCALES.map((x) => [x, `${SITE_URL}/${x}${p}`])) },
    })),
  );
}
