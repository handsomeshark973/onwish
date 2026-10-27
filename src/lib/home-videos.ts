import { MAX_RECENT_VIDEOS, MAX_UPCOMING_VIDEOS, RECENT_RELEASE_DAYS, RECENT_VIDEO_KINDS, UPCOMING_VIDEO_KINDS } from "@/config/videos";
import type { GameSummary, GameVideo } from "@/types/domain";
import { daysUntil } from "@/lib/kst";
import { isTrendStage, TREND_STAGES } from "@/types/taxonomy";

export interface HomeVideo { video: GameVideo; game: GameSummary; daysToRelease: number | null } // 곧 출시 영상의 D-day(날짜 미정이면 null)
export interface HomeVideos { featured: HomeVideo | null; upcoming: HomeVideo[]; recent: HomeVideo[] }

export { daysUntil };

// 기존 레이더의 인기 지표(게임의 기준 지표 최근값)를 그대로 쓴다. 새 지표는 만들지 않는다. 값이 없으면 null.
const popularity = (g: GameSummary): number | null => {
  for (let i = g.metricSeries.length - 1; i >= 0; i--) if (g.metricSeries[i] !== null) return g.metricSeries[i];
  return null;
};

// 게임마다 영상은 가장 최근 게시 1개만 올린다(한 게임이 줄을 다 차지하지 않게).
const latestPerGame = (items: HomeVideo[]): HomeVideo[] => {
  const best = new Map<string, HomeVideo>();
  for (const it of items) {
    const cur = best.get(it.game.id);
    if (!cur || (it.video.publishedAt ?? "") > (cur.video.publishedAt ?? "")) best.set(it.game.id, it);
  }
  return [...best.values()];
};

// 홈에 띄울 영상 고르기. 승인된 영상만 들어오는 것을 전제로 하고(DB가 거른다), 게임 단계·출시일 규칙은 여기서 적용한다.
export function pickHomeVideos(videos: GameVideo[], games: GameSummary[], now = new Date()): HomeVideos {
  const byId = new Map(games.map((g) => [g.id, g]));
  const joined = videos.filter((v) => v.status === "approved").flatMap((video) => {
    const game = byId.get(video.gameId);
    return game ? [{ video, game, daysToRelease: game.nextKeyDate ? daysUntil(game.nextKeyDate.date, now) : null }] : [];
  });

  const upcoming = latestPerGame(
    // 출시일이 이미 지났는데 단계가 아직 곧 출시인 게임(staleUpcoming)은 홈에서 뺀다
    joined.filter((x) => x.game.heatStage === "upcoming" && !x.game.staleUpcoming && (UPCOMING_VIDEO_KINDS as readonly string[]).includes(x.video.kind)),
  ).sort((a, b) => (a.game.nextKeyDate?.date ?? "9").localeCompare(b.game.nextKeyDate?.date ?? "9")); // 출시일이 가까운 순, 미정은 맨 뒤

  const recent = latestPerGame(
    joined.filter((x) => {
      if (!isTrendStage(x.game.heatStage)) return false;
      if (!(RECENT_VIDEO_KINDS as readonly string[]).includes(x.video.kind)) return false;
      if (!x.game.releaseBasisDate) return false;
      const ago = -daysUntil(x.game.releaseBasisDate, now);
      return ago >= 0 && ago <= RECENT_RELEASE_DAYS;
    }),
  ).sort((a, b) => {
    const pa = popularity(a.game);
    const pb = popularity(b.game);
    if (pa !== null && pb !== null) return pb - pa;
    if (pa !== null) return -1;
    if (pb !== null) return 1;
    return (b.game.releaseBasisDate ?? "").localeCompare(a.game.releaseBasisDate ?? "");
  });

  // 대표: 지정된 영상이 아직 곧 출시·뜨는 중·골든타임이면 그것, 아니면(식는 중 등으로 바뀌었거나 없으면) 최근 인기 신작 1위
  const flagged = joined.find((x) => x.video.isFeatured && !x.game.staleUpcoming && ["upcoming", ...TREND_STAGES].includes(x.game.heatStage ?? ""));
  const featured = flagged ?? recent[0] ?? null;
  const rest = (list: HomeVideo[], max: number) => list.filter((x) => x.video.id !== featured?.video.id).slice(0, max);

  return { featured, upcoming: rest(upcoming, MAX_UPCOMING_VIDEOS), recent: rest(recent, MAX_RECENT_VIDEOS) };
}
