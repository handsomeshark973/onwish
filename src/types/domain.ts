// 기획서 5장의 데이터 모델을 화면 코드용으로 옮긴 타입. DB 열 이름(snake_case)과의 변환은 4단계에서 만든다.
import type {
  AudienceSize, Device, MainAppeal, PlayerTier, ViewerParticipation, WatchMode,
} from "./taxonomy";

export type Origin = "game" | "in_game_creation" | "stream_native" | "variety_adapted";
export type Structure = "coop" | "versus" | "mind_game" | "talk";
export type Lifecycle = "trend" | "evergreen" | "series";
export type ParticipationChannel = "chat_vote" | "donation_mission" | "direct_play" | "community_task";
export type ParticipationMode = "simultaneous" | "rotation" | "league";
export type GameStage = "announced" | "playtest" | "early_access" | "released";
export type ReleasePhase = "upcoming" | "launch_window" | "post_launch";
export type PopularityStatus = "unknown" | "hot" | "cooling" | "evergreen";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "archived";
export type MetricKind =
  | "steam_ccu" | "twitch_viewers" | "youtube_views" | "chzzk_viewers" | "soop_viewers" | "official_players" | "wishlist";

export interface Game {
  id: string;
  slug: string;
  name: string;
  nameKo: string | null;
  developer: string;
  publisher: string | null;
  stage: GameStage;
  releasePhase: ReleasePhase;
  popularityStatus: PopularityStatus;
  heatStage: "upcoming" | "golden" | "hot" | "cooling" | "evergreen" | null; // null = 인기 확인 필요
  platforms: Device[];
  players: { min: number | null; max: number | null; fixed: boolean | null };
  crossplay: boolean | null;
  priceNote: string | null;
  genre: string[];
  asymmetricRoles: boolean;
  proximityVoice: boolean;
  moddable: boolean;
  streamPoint: string | null;
  cautions: string | null;
  imageUrl: string | null;
  imageSource: string | null;
  lastCheckedAt: string | null;
  infoStale: boolean;
  // 제외 조건 판정 태그. null = 확인되지 않음(회피 조건을 고른 사용자에게는 추천하지 않는다)
  isHorror: boolean | null;
  motionSicknessRisk: boolean | null;
  spoilerRisk: boolean | null;
  officialChannelIds: string[]; // 영상 등록을 허용하는 공식 채널 ID(개발사·퍼블리셔·플랫폼)
}

export interface GameFormat {
  id: string;
  gameId: string;
  title: string;
  requiredPlayers: { min: number | null; max: number | null };
  participationMode: ParticipationMode;
  requiredDevices: Device[];
  playerTiers: PlayerTier[];
  mainAppeal: MainAppeal;
  appealPoints: string[];
  appealText: string;
  howTo: string;
  modsOrSetup: string | null;
}

export interface Content {
  id: string;
  slug: string;
  title: string;
  playerTier: PlayerTier;
  requiredPlayers: { min: number | null; max: number | null };
  participationMode: ParticipationMode;
  origin: Origin;
  borrowedFrom: string | null;
  structures: Structure[];
  lifecycle: Lifecycle;
  audienceFit: AudienceSize[];
  devices: Device[];
  gamesText: string | null;
  modsOrSetup: string | null;
  mainAppeal: MainAppeal;
  appealPoints: string[];
  appealText: string;
  watchMode: WatchMode;
  howTo: string;
  multiPovPoint: string | null;
  viewerParticipation: ViewerParticipation;
  participationChannels: ParticipationChannel[];
  participationBySize: Partial<Record<AudienceSize, string>>;
  continuity: string | null;
  cautions: string | null;
  isHorror: boolean | null;
  motionSicknessRisk: boolean | null;
  spoilerRisk: boolean | null;
}

export interface StreamerProfile {
  mode: PlayerTier;
  strengths: ("talk" | "chemistry" | "skill" | "creation" | "reaction")[];
  persona: string;
  usesCam: boolean;
  audience: AudienceSize;
  devices: Device[];
  length: "single" | "full_day" | "series";
  timeSlot: "day" | "evening" | "late_night";
  goal: "acquire" | "retain" | "both";
  hasCommunity: boolean;
  communityActivity?: "low" | "mid" | "high";
  allowRotation: boolean;
  allowLeague: boolean;
  excludedGameIds: string[];
  excludedGenres: string[];
  avoidHorror: boolean;
  avoidMotionSickness: boolean;
  avoidSpoilers: boolean;
  includeTrend: boolean;
  memberCount?: number;
  // 별명·방송상 역할만. 실명·연락처는 받지 않는다.
  members?: { name: string; note: string; devices: Device[]; ownedGameIds?: string[] }[];
  chemistryLevel?: "first" | "some" | "long";
  desiredStructures?: Structure[];
}

export type VideoKind = "teaser" | "reveal" | "launch" | "gameplay";
export type VideoStatus = "pending" | "approved" | "hidden";

// 게임 공식 영상. 유튜브 영상 ID(11자리)만 저장하고, 주소는 화면에서 만든다.
export interface GameVideo {
  id: string;
  gameId: string;
  youtubeId: string;
  kind: VideoKind;
  title: string; // 현재 언어 제목(없는 언어는 다른 언어로 대체)
  titleKo: string | null;
  titleEn: string | null;
  channelName: string;
  channelId: string | null;
  publishedAt: string | null;
  sourceUrl: string;
  verifiedAt: string | null;
  status: VideoStatus;
  hiddenReason: string | null;
  isFeatured: boolean;
}

export interface GameKeyDate { label: string; date: string; source: string }
export interface GameSource { title: string; url: string; checkedAt: string | null }
export interface MetricPoint { kind: MetricKind; value: number; at: string; source: string }

// 목록 카드에 필요한 값을 합친 형태
export interface GameSummary extends Game {
  formats: GameFormat[];
  nextKeyDate: GameKeyDate | null;
  metricSeries: (number | null)[];
  metricKind: MetricKind | null; // 어떤 지표인지. 이름은 화면에서 번역한다
}

export interface GameDetail extends GameSummary {
  keyDates: GameKeyDate[];
  sources: GameSource[];
  metrics: MetricPoint[];
  relatedContents: ContentSummary[];
}

export interface LinkedGame { id: string; slug: string; name: string; genre: string[]; crossplay: boolean | null; platforms: Device[] }

export interface ContentSummary extends Content {
  games: LinkedGame[];
}
