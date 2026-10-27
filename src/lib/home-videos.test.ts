import assert from "node:assert/strict";
import test from "node:test";
import { daysUntil, pickHomeVideos } from "./home-videos";
import type { GameSummary, GameVideo } from "@/types/domain";

const NOW = new Date("2026-10-27T03:00:00Z");

const game = (id: string, heat: GameSummary["heatStage"], extra: Partial<GameSummary> = {}) =>
  ({ id, heatStage: heat, releaseBasisDate: null, nextKeyDate: null, metricSeries: [], metricKind: null, ...extra }) as unknown as GameSummary;
const video = (id: string, gameId: string, kind: GameVideo["kind"], extra: Partial<GameVideo> = {}) =>
  ({ id, gameId, kind, status: "approved", isFeatured: false, publishedAt: "2026-09-01T00:00:00Z", ...extra }) as GameVideo;

test("D-day 계산", () => {
  assert.equal(daysUntil("2026-10-27", NOW), 0);
  assert.equal(daysUntil("2026-11-06", NOW), 10);
  assert.equal(daysUntil("2026-10-20", NOW), -7);
});

test("곧 나올 게임: upcoming + teaser/reveal만, 출시일 가까운 순, 미정은 뒤", () => {
  const games = [
    game("a", "upcoming", { nextKeyDate: { label: "", date: "2026-12-01", source: "" } }),
    game("b", "upcoming", { nextKeyDate: { label: "", date: "2026-11-01", source: "" } }),
    game("c", "upcoming"),
    game("d", "upcoming"),
  ];
  const r = pickHomeVideos([video("1", "a", "teaser"), video("2", "b", "reveal"), video("3", "c", "teaser"), video("4", "d", "launch")], games, NOW);
  assert.deepEqual(r.upcoming.map((x) => x.video.id), ["2", "1", "3"]);
});

test("최근 인기 신작: golden/hot + 60일 이내 + launch, 인기 지표 높은 순", () => {
  const games = [
    game("a", "golden", { releaseBasisDate: "2026-09-09", metricSeries: [null, 100, 500] }),
    game("b", "hot", { releaseBasisDate: "2026-10-01", metricSeries: [900] }),
    game("c", "hot", { releaseBasisDate: "2026-07-01", metricSeries: [9999] }), // 60일 넘음
    game("d", "cooling", { releaseBasisDate: "2026-10-01", metricSeries: [9999] }),
  ];
  const vids = ["a", "b", "c", "d"].map((g, i) => video(String(i), g, "launch"));
  const r = pickHomeVideos(vids, games, NOW);
  // 대표(1위)는 줄에서 빠지고 대표 자리로 간다
  assert.equal(r.featured?.video.id, "1");
  assert.deepEqual(r.recent.map((x) => x.video.id), ["0"]);
});

test("대표: 지정 영상이 우선, 식는 중으로 바뀌면 빠지고 신작 1위로 대체", () => {
  const games = [game("a", "hot", { releaseBasisDate: "2026-10-10" }), game("b", "cooling", { releaseBasisDate: "2026-10-10" })];
  const vids = [video("1", "a", "launch"), video("2", "b", "launch", { isFeatured: true })];
  assert.equal(pickHomeVideos(vids, games, NOW).featured?.video.id, "1");
  assert.equal(pickHomeVideos([video("1", "a", "launch", { isFeatured: true })], games, NOW).featured?.video.id, "1");
});

test("영상이 없으면 모두 비어 있다", () => {
  const r = pickHomeVideos([], [game("a", "hot")], NOW);
  assert.deepEqual([r.featured, r.upcoming, r.recent], [null, [], []]);
});

test("승인 안 된 영상·게임 없는 영상·게임당 1개 제한", () => {
  const games = [game("a", "upcoming")];
  const r = pickHomeVideos(
    [video("1", "a", "teaser", { status: "hidden" }), video("2", "zzz", "teaser"), video("3", "a", "teaser", { publishedAt: "2026-01-01T00:00:00Z" }), video("4", "a", "reveal", { publishedAt: "2026-05-01T00:00:00Z" })],
    games, NOW,
  );
  assert.deepEqual(r.upcoming.map((x) => x.video.id), ["4"]);
});
