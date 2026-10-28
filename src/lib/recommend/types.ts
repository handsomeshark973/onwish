import type { GameFormat, GameSummary, ContentSummary } from "@/types/domain";
import type { MainAppeal, TrendStage, WatchMode } from "@/types/taxonomy";

export type TrendCandidate = { game: GameSummary; format: GameFormat };

export type ContentCandidate = ContentSummary;

export interface PickGameInfo {
  slug: string;
  name: string;
  players: string; // 게임 최소·최대 인원 표기
  formatPlayers: string; // 진행 방식별 필요 인원 표기
  extraDevices: string[]; // PC 외 필수 기기
  priceNote: string; // 확인된 구매 비용. 모르면 "확인 필요"
  needsPurchase: boolean | null; // null = 보유 게임 정보 없음
}

export interface RecommendPick {
  kind: "content" | "trend";
  title: string;
  logline: string;
  contentSlug: string | null;
  contentId: string | null;
  formatId: string | null;
  gameIds: string[];
  origin: string | null;
  borrowedFrom: string | null;
  mainAppeal: MainAppeal;
  appealPoints: string[];
  appealText: string;
  strengthFit: "match" | "complement";
  strengthFitReason: string;
  watchMode: WatchMode;
  lifecycle: "trend" | "evergreen" | "series";
  heatStage: TrendStage | null;
  setup: string;
  howTo: string[];
  roles: { member: string; role: string }[];
  multiPovPoint: string;
  viewerParticipation: "none" | "enriches" | "required";
  participationChannels: string[];
  participationHow: string;
  noParticipationReason: string;
  continuity: string;
  episodes: { no: number; title: string; mainAppeal: string }[];
  cautions: string;
  gameInfo: PickGameInfo[];
}

export type RecommendNotice = "ai_off" | "ai_failed" | "quota" | "guest_quota" | "cost_cap" | "rate_limit";

export interface RecommendResult {
  source: "ai" | "rule";
  summary: string;
  picks: RecommendPick[];
  notice: RecommendNotice | null;
  quota: { used: number; remaining: number; limit: number; nextReset: string; period?: "day" | "month" } | null;
}
