// 기획서 4장의 분류 체계 중 화면 부품이 쓰는 것. 화면에 나오는 이름은 messages/*.json의 taxonomy에 있고, src/i18n/labels.ts가 가져온다.
export type PlayerTier = "solo" | "small" | "large";
export type AudienceSize = "s" | "m" | "l";
export type MainAppeal = "visual" | "audio" | "audiovisual";
// 트렌드 단계. 화면에 보이는 순서가 곧 정렬 순서다: 곧 출시 → 뜨는 중 → 골든타임 → 식는 중, 그리고 상시.
// 단계는 DB 함수(compute_heat_stage)가 계산한다. 단계 키를 쓰는 곳은 아래 상수·함수를 거치고 문자열을 직접 적지 않는다.
export const HEAT_STAGES = ["upcoming", "rising", "peak", "cooling", "evergreen"] as const;
export type HeatStage = (typeof HEAT_STAGES)[number];
// 인기가 오르는 중이거나 정점인 게임(홈 "지금 뜨는 게임", 영상 "최근 인기 신작", 트렌드 추천이 보는 단계)
export const TREND_STAGES = ["rising", "peak"] as const satisfies readonly HeatStage[];
export type TrendStage = (typeof TREND_STAGES)[number];
// 레이더 상단의 흐름 줄(상시는 흐름에 넣지 않고 따로 보여 준다)
export const FLOW_STAGES = ["upcoming", "rising", "peak", "cooling"] as const satisfies readonly HeatStage[];

export const isTrendStage = (s: HeatStage | null | undefined): s is TrendStage => !!s && (TREND_STAGES as readonly string[]).includes(s);

// 임시 호환: 옛 키(golden, hot)가 들어와도 읽을 때 새 키로 바꾼다. 단계 이름 변경(0007 마이그레이션) 전후 배포 순서와 상관없이 동작하고,
// 저장해 둔 추천 결과(JSON)에 남은 옛 키도 읽을 때 변환한다. 옛 키가 더는 들어오지 않게 되면 이 변환을 지워도 된다.
const LEGACY_STAGE: Record<string, HeatStage> = { golden: "rising", hot: "peak" };
export function normalizeHeatStage(v: unknown): HeatStage | null {
  if (typeof v !== "string") return null;
  if ((HEAT_STAGES as readonly string[]).includes(v)) return v as HeatStage;
  return LEGACY_STAGE[v] ?? null;
}
export type ViewerParticipation = "none" | "enriches" | "required";
export type WatchMode = "focus" | "background";
// 기기 값. 필터·프로필 폼·검증이 모두 이 목록을 쓴다(DB는 device_kind enum, 0008에서 XBOX 추가).
export const DEVICES = ["PC", "PS5", "XBOX", "SWITCH", "VR"] as const;
export type Device = (typeof DEVICES)[number];


// 번역 키 목록. 메시지 파일의 taxonomy 아래에 같은 이름으로 들어 있다.
export const TAXONOMY_KEYS = {
  tier: ["solo", "small", "large"],
  audience: ["s", "m", "l"],
  appeal: ["visual", "audio", "audiovisual"],
  stage: HEAT_STAGES,
  participation: ["none", "enriches", "required"],
  watch: ["focus", "background"],
  appealPoint: ["growth_visual", "combat_action", "creation_result", "skill_highlight", "cam_reaction", "talk_radio", "chemistry", "verbal_mind_game", "forced_comm", "scream_sound"],
  strength: ["talk", "chemistry", "skill", "creation", "reaction"],
  structure: ["coop", "versus", "mind_game", "talk"],
  origin: ["game", "in_game_creation", "stream_native", "variety_adapted"],
  lifecycle: ["trend", "evergreen", "series"],
  channel: ["chat_vote", "donation_mission", "direct_play", "community_task"],
  length: ["single", "full_day", "series"],
  timeSlot: ["day", "evening", "late_night"],
  goal: ["acquire", "retain", "both"],
  chemistry: ["first", "some", "long"],
  participationMode: ["simultaneous", "rotation", "league"],
} as const;
