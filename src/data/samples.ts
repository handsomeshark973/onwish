// 개발 중 화면을 확인하기 위한 가짜 데이터. 실제 게임·컨텐츠 정보가 아니다.
// ONWISH_SAMPLE_DATA=1 이고 개발 모드(npm run dev)일 때만 쓰이며, 배포에서는 절대 읽히지 않는다.
import type { ContentSummary, GameDetail, GameFormat, GameVideo } from "@/types/domain";

const today = new Date();
const day = (offset: number) => new Date(today.getTime() + offset * 86400000).toISOString().slice(0, 10);
const series = (base: number, trend: number) =>
  Array.from({ length: 30 }, (_, i) => (i % 9 === 4 ? null : Math.max(1, Math.round(base + trend * i + ((i * 7) % 5) * base * 0.03))));

function fmt(gameId: string, n: number, title: string, appeal: GameFormat["mainAppeal"], points: string[], tiers: GameFormat["playerTiers"], min: number | null, max: number | null): GameFormat {
  return {
    id: `${gameId}-f${n}`, gameId, title, requiredPlayers: { min, max }, participationMode: "simultaneous",
    requiredDevices: [], playerTiers: tiers, mainAppeal: appeal, appealPoints: points,
    appealText: "예시 문구: 이 진행 방식에서 시청자가 무엇을 즐기는지 설명하는 자리입니다.",
    howTo: "예시 문구: 멤버가 각자 방송을 켜고 같은 판에 들어가 진행합니다.", modsOrSetup: null,
  };
}

function game(slug: string, name: string, heat: GameDetail["heatStage"], opts: Partial<GameDetail> & { fixed?: boolean; min?: number | null; max?: number | null }): GameDetail {
  const id = `sample-${slug}`;
  const formats = [
    fmt(id, 1, "예시 진행 방식 1", "audio", ["forced_comm", "chemistry"], ["small"], opts.min ?? 2, opts.max ?? 4),
    fmt(id, 2, "예시 진행 방식 2", "audiovisual", ["scream_sound"], ["large"], opts.min ?? 2, opts.max ?? 8),
  ];
  const metricSeries = heat === "upcoming" ? [] : series(1000, heat === "cooling" ? -20 : 25);
  return {
    id, slug, name, nameKo: null, developer: "예시 개발사", publisher: null,
    stage: heat === "upcoming" ? "announced" : "released",
    releasePhase: heat === "upcoming" ? "upcoming" : heat === "rising" ? "launch_window" : "post_launch",
    popularityStatus: heat === null ? "unknown" : heat === "rising" || heat === "peak" ? "hot" : heat === "cooling" ? "cooling" : "evergreen",
    heatStage: heat, platforms: ["PC"], players: { min: opts.min ?? 2, max: opts.max ?? 4, fixed: opts.fixed ?? false },
    crossplay: null, priceNote: null, genre: ["예시 장르"], asymmetricRoles: false, proximityVoice: false, moddable: false,
    streamPoint: "예시 문구: 방송에서 왜 재밌는지 한두 문장으로 적는 자리입니다.", cautions: "예시 문구: 주의점이 들어가는 자리입니다.",
    imageUrl: null, imageSource: null, lastCheckedAt: today.toISOString(), infoStale: false,
    isHorror: false, motionSicknessRisk: false, spoilerRisk: false, releaseBasisDate: heat === "rising" || heat === "peak" ? day(heat === "rising" ? -8 : -30) : null, officialChannelIds: [],
    formats, nextKeyDate: heat === "upcoming" ? { label: "출시 예정(예시)", date: day(12), source: "예시" } : null,
    metricSeries, metricKind: metricSeries.length ? ("steam_ccu" as const) : null,
    keyDates: [{ label: heat === "upcoming" ? "출시 예정(예시)" : "출시(예시)", date: heat === "upcoming" ? day(12) : day(-8), source: "예시" }],
    sources: [{ title: "예시 출처", url: "https://example.com", checkedAt: today.toISOString() }],
    metrics: [], relatedContents: [], ...opts,
  };
}

export const SAMPLE_GAMES: GameDetail[] = [
  game("sample-a", "예시 게임 A", "rising", { fixed: true, min: 3, max: 3 }),
  game("sample-b", "예시 게임 B", "upcoming", {}),
  game("sample-c", "예시 게임 C", "peak", { min: 1, max: 8 }),
  game("sample-d", "예시 게임 D", "cooling", {}),
  game("sample-e", "예시 게임 E", null, {}),
  game("sample-f", "예시 게임 F", "evergreen", { min: 1, max: 4 }),
].map((g) => ({ ...g, slug: g.slug.replace("sample-sample-", "sample-") }));

const SAMPLE_LINK_A = { id: "sample-sample-a", slug: "sample-a", name: "예시 게임 A", genre: ["예시 장르"], crossplay: null, platforms: ["PC" as const] };

function content(n: number, title: string, tier: ContentSummary["playerTier"], appeal: ContentSummary["mainAppeal"], points: string[], extra: Partial<ContentSummary> = {}): ContentSummary {
  return {
    id: `sample-content-${n}`, slug: `sample-content-${n}`, title, playerTier: tier,
    requiredPlayers: { min: tier === "solo" ? 1 : 2, max: tier === "large" ? 12 : tier === "small" ? 5 : 1 },
    participationMode: "simultaneous", origin: "game", borrowedFrom: null, structures: ["coop"], lifecycle: "evergreen",
    audienceFit: ["s", "m"], devices: ["PC"], gamesText: null, modsOrSetup: "예시 문구: 준비물과 설정이 들어가는 자리",
    mainAppeal: appeal, appealPoints: points, appealText: "예시 문구: 시청자가 무엇을 즐기는지 한두 문장으로 설명하는 자리입니다.",
    watchMode: appeal === "audio" ? "background" : "focus",
    howTo: "예시 문구: 첫 번째 진행 단계\n두 번째 진행 단계\n세 번째 진행 단계",
    multiPovPoint: tier === "solo" ? null : "예시 문구: 각자 송출을 활용하는 포인트", viewerParticipation: "enriches",
    participationChannels: ["chat_vote"], participationBySize: { s: "예시: 직접 같이 플레이", m: "예시: 투표", l: "예시: 추첨 참가" },
    continuity: "예시 문구: 시즌 장부에 점수를 쌓는 연속성 장치", cautions: "예시 문구: 주의점", games: [], isHorror: false, motionSicknessRisk: false, spoilerRisk: false, ...extra,
  };
}

export const SAMPLE_CONTENTS: ContentSummary[] = [
  content(1, "예시 혼방 컨텐츠 1", "solo", "audiovisual", ["scream_sound"]),
  content(2, "예시 혼방 컨텐츠 2", "solo", "audio", ["talk_radio"], { viewerParticipation: "required", participationChannels: ["community_task"] }),
  content(3, "예시 소수 합방 1", "small", "audio", ["chemistry", "forced_comm"], { games: [SAMPLE_LINK_A], gamesText: "예시 게임 A" }),
  content(4, "예시 소수 합방 2", "small", "visual", ["growth_visual"], { games: [SAMPLE_LINK_A], gamesText: "예시 게임 A", lifecycle: "series", origin: "in_game_creation" }),
  content(5, "예시 소수 합방 3", "small", "audiovisual", ["scream_sound", "chemistry"], { structures: ["versus"], lifecycle: "trend" }),
  content(6, "예시 소수 합방 4", "small", "audio", ["verbal_mind_game"], { origin: "variety_adapted", borrowedFrom: "예시 예능(예시국)", structures: ["mind_game"] }),
  content(7, "예시 다수 합방 1", "large", "audiovisual", ["skill_highlight"], { structures: ["versus"], origin: "stream_native" }),
  content(8, "예시 다수 합방 2", "large", "visual", ["creation_result"], { viewerParticipation: "none", participationChannels: [] }),
];

SAMPLE_GAMES.forEach((g) => {
  g.relatedContents = SAMPLE_CONTENTS.filter((c) => c.games.some((x) => x.slug === g.slug));
});

// 개발 화면 확인용 영상. 영상 ID는 실제로 존재함을 oEmbed로 확인한 Valheim 출시 트레일러 하나만 쓰고(Iron Gate 공식 채널),
// 어느 게임에 붙었는지는 예시일 뿐이다. 배포에서는 읽히지 않는다.
const sampleVideo = (n: number, gameSlug: string, kind: GameVideo["kind"], extra: Partial<GameVideo> = {}): GameVideo => ({
  id: `sample-video-${n}`, gameId: `sample-${gameSlug}`, youtubeId: "gsSWz6sfu-U", kind,
  title: "Valheim: 1.0 Out Now", titleKo: "Valheim: 1.0 Out Now", titleEn: "Valheim: 1.0 Out Now",
  channelName: "Iron Gate", channelId: null, publishedAt: "2026-09-09T12:56:05.000Z",
  sourceUrl: "https://www.youtube.com/watch?v=gsSWz6sfu-U", verifiedAt: today.toISOString(), status: "approved", hiddenReason: null, isFeatured: false, ...extra,
});
export const SAMPLE_VIDEOS: GameVideo[] = [
  sampleVideo(1, "sample-a", "launch", { isFeatured: true }),
  sampleVideo(2, "sample-c", "launch"),
  sampleVideo(3, "sample-b", "teaser"),
  sampleVideo(4, "sample-d", "launch"), // 식는 중 → 홈에서 빠져야 한다
];
