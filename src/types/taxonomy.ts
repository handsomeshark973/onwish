// 기획서 4장의 분류 체계 중 화면 부품이 쓰는 것. 화면에 나오는 이름은 messages/*.json의 taxonomy에 있고, src/i18n/labels.ts가 가져온다.
export type PlayerTier = "solo" | "small" | "large";
export type AudienceSize = "s" | "m" | "l";
export type MainAppeal = "visual" | "audio" | "audiovisual";
export type HeatStage = "upcoming" | "golden" | "hot" | "cooling" | "evergreen";
export type ViewerParticipation = "none" | "enriches" | "required";
export type WatchMode = "focus" | "background";
export type Device = "PC" | "PS5" | "SWITCH" | "VR";


// 번역 키 목록. 메시지 파일의 taxonomy 아래에 같은 이름으로 들어 있다.
export const TAXONOMY_KEYS = {
  tier: ["solo", "small", "large"],
  audience: ["s", "m", "l"],
  appeal: ["visual", "audio", "audiovisual"],
  stage: ["upcoming", "golden", "hot", "cooling", "evergreen"],
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
