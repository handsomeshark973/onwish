import { cacheLife } from "next/cache";
import { sampleMode } from "@/data/sample-mode";
import { SAMPLE_CONTENTS } from "@/data/samples";
import type { ContentSummary } from "@/types/domain";
import { mapContent, withGames } from "./mappers";
import { createPublicClient } from "./public-client";

/* eslint-disable @typescript-eslint/no-explicit-any */

// locale에 따라 제목·설명·진행 방식 등이 해당 언어 번역으로 바뀐다(번역이 없으면 한국어 원본).
export async function getContents(locale: string): Promise<ContentSummary[]> {
  "use cache";
  cacheLife("minutes");
  if (sampleMode()) return SAMPLE_CONTENTS;
  const db = createPublicClient();
  if (!db) return [];

  const [c, links, games] = await Promise.all([
    db.from("contents").select("*").order("title"),
    db.from("content_games").select("*"),
    db.from("games").select("*"), // translations 열이 아직 없어도(0005 적용 전) 동작하도록 전체 열을 읽는다
  ]);
  if (c.error) throw new Error(`컨텐츠를 불러오지 못했습니다: ${c.error.message}`);

  return (c.data ?? []).map((row: any) => {
    const gameIds = (links.data ?? []).filter((l: any) => l.content_id === row.id).map((l: any) => l.game_id);
    const linked = (games.data ?? [])
      .filter((g: any) => gameIds.includes(g.id))
      .map((g: any) => ({
        id: g.id,
        slug: g.slug,
        name: locale === "ko" ? (g.name_ko ?? g.name) : g.name,
        genre: (locale === "ko" ? undefined : g.translations?.[locale]?.genre) ?? g.genre ?? [],
        crossplay: g.crossplay ?? null,
        platforms: g.platforms ?? [],
      }));
    return withGames(mapContent(row, locale), linked);
  });
}

export async function getContent(slug: string, locale: string): Promise<ContentSummary | null> {
  return (await getContents(locale)).find((c) => c.slug === slug) ?? null;
}
