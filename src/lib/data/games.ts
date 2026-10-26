import { cacheLife } from "next/cache";
import { sampleMode } from "@/data/sample-mode";
import { SAMPLE_GAMES } from "@/data/samples";
import type { GameDetail, GameSummary } from "@/types/domain";
import { getContents } from "./contents";
import { mapFormat, mapGame, mapKeyDate, mapMetric, mapSource, metricSeries } from "./mappers";
import { createPublicClient } from "./public-client";

/* eslint-disable @typescript-eslint/no-explicit-any */

// 승인된 게임 목록. 검수 전·거절된 게임은 DB 권한(RLS)이 막아서 여기까지 오지 않는다.
// locale에 따라 이름·장르·가격 문구 등이 해당 언어 번역으로 바뀐다(번역이 없으면 한국어 원본).
export async function getGames(locale: string): Promise<GameSummary[]> {
  "use cache";
  cacheLife("minutes");
  if (sampleMode()) return SAMPLE_GAMES;
  const db = createPublicClient();
  if (!db) return [];

  const [g, f, k, m] = await Promise.all([
    db.from("games_public").select("*").order("name"),
    db.from("game_formats").select("*"),
    db.from("game_key_dates").select("*").order("date"),
    db.from("game_metrics").select("*").gte("observed_at", new Date(Date.now() - 31 * 86400000).toISOString()),
  ]);
  if (g.error) throw new Error(`게임을 불러오지 못했습니다: ${g.error.message}`);

  const today = new Date().toISOString().slice(0, 10);
  return (g.data ?? []).map((row: any) => {
    const game = mapGame(row, locale);
    const points = (m.data ?? []).filter((x: any) => x.game_id === row.id).map(mapMetric);
    const kind = row.base_metric_kind ?? null;
    const dates = (k.data ?? []).filter((x: any) => x.game_id === row.id).map((x: any) => mapKeyDate(x, locale));
    return {
      ...game,
      formats: (f.data ?? []).filter((x: any) => x.game_id === row.id).map((x: any) => mapFormat(x, locale)),
      nextKeyDate: dates.find((d) => d.date >= today) ?? null,
      metricSeries: kind ? metricSeries(points, kind) : [],
      metricKind: kind,
    };
  });
}

export async function getGameDetail(slug: string, locale: string): Promise<GameDetail | null> {
  "use cache";
  cacheLife("minutes");
  if (sampleMode()) return SAMPLE_GAMES.find((g) => g.slug === slug) ?? null;
  const db = createPublicClient();
  if (!db) return null;

  const summary = (await getGames(locale)).find((g) => g.slug === slug);
  if (!summary) return null;

  const [k, s, m] = await Promise.all([
    db.from("game_key_dates").select("*").eq("game_id", summary.id).order("date"),
    db.from("game_sources").select("*").eq("game_id", summary.id),
    db.from("game_metrics").select("*").eq("game_id", summary.id).order("observed_at"),
  ]);
  const contents = await getContents(locale);
  return {
    ...summary,
    keyDates: (k.data ?? []).map((x: any) => mapKeyDate(x, locale)),
    sources: (s.data ?? []).map((x: any) => mapSource(x, locale)),
    metrics: (m.data ?? []).map(mapMetric),
    relatedContents: contents.filter((c) => c.games.some((x) => x.slug === slug)),
  };
}
