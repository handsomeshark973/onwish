import { cacheLife } from "next/cache";
import { sampleMode } from "@/data/sample-mode";
import { SAMPLE_VIDEOS } from "@/data/samples";
import { pickHomeVideos, type HomeVideos } from "@/lib/home-videos";
import type { GameVideo } from "@/types/domain";
import { getGames } from "./games";
import { mapVideo } from "./mappers";
import { createPublicClient } from "./public-client";

/* eslint-disable @typescript-eslint/no-explicit-any */

// 승인된 영상. 승인 안 된 영상·승인 안 된 게임의 영상은 DB 권한(RLS)이 막아서 여기까지 오지 않는다.
async function getApprovedVideos(locale: string): Promise<GameVideo[]> {
  if (sampleMode()) return SAMPLE_VIDEOS;
  const db = createPublicClient();
  if (!db) return [];
  const { data, error } = await db.from("game_videos").select("*").eq("status", "approved");
  // 영상 표가 없거나 오류여도 홈 전체가 깨지지 않게 영상만 비운다(영상이 없으면 구역이 숨겨진다).
  if (error) return [];
  return (data ?? []).map((r: any) => mapVideo(r, locale));
}

// 홈 영상 구역에 쓸 영상. 게임 단계·출시일 규칙은 pickHomeVideos(src/lib/home-videos.ts)와 설정(src/config/videos.ts)에 있다.
export async function getHomeVideos(locale: string): Promise<HomeVideos> {
  "use cache";
  cacheLife("minutes");
  const [videos, games] = await Promise.all([getApprovedVideos(locale), getGames(locale)]);
  return pickHomeVideos(videos, games);
}
