// 고객 유형 3가지와 판정 기준. 유형 키·이름 키·판정 수치는 모두 이 파일에서 바꾼다.
// 화면에 보이는 이름은 messages/*.json의 taxonomy.customerType 에 같은 키로 들어 있다.

export const CUSTOMER_TYPES = ["solo_game", "solo_talk", "crew"] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

// 관리자 화면에서 고객을 나누는 칸. 유형 3개 + 미분류 2개(미분류는 유형이 아니다)
export const SEGMENTS = [...CUSTOMER_TYPES, "solo_undecided", "insufficient"] as const;
export type Segment = (typeof SEGMENTS)[number];

export const TYPE_SOURCES = ["self", "inferred"] as const;
export type TypeSource = (typeof TYPE_SOURCES)[number];

export const PLATFORMS = ["soop", "chzzk", "youtube", "other"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const EXPERIENCES = ["under_6m", "6m_2y", "over_2y"] as const;
export type Experience = (typeof EXPERIENCES)[number];

// 유형 배지 색: 기존 색 토큰을 재사용한다(대비 검사를 이미 통과한 색). 배지는 색과 글자를 함께 쓴다.
export const TYPE_BADGE_CLASS: Record<CustomerType, string> = {
  solo_game: "ow-ctype-solo_game",
  solo_talk: "ow-ctype-solo_talk",
  crew: "ow-ctype-crew",
};

// ───── 행동으로 추정하는 기준 (본인이 고르지 않은 사람에게만 쓴다) ─────
export const INFER = {
  windowDays: 30, // 최근 N일 요청만 본다
  minRequests: 2, // 이보다 적으면 근거 부족
  tierShare: 0.6, // 합방(소수+다수) 또는 혼방이 이 비율 이상이어야 판정한다
  styleShare: 0.6, // 게임·소통 점수 중 한쪽이 이 비율 이상이어야 판정한다
  minStyleTotal: 2, // 점수 합이 이보다 작으면 스타일 미정(신호 한두 개로 정하지 않는다)
} as const;

// 신호별 가중치. game = 게임 중심 쪽 점수, talk = 소통 중심 쪽 점수.
export const STYLE_WEIGHTS = {
  // 추천 요청의 강점 칩(가장 강한 신호). 창작·케미는 판단 불가라 넣지 않는다.
  strength: { skill: { game: 3 }, talk: { talk: 3 }, reaction: { talk: 1 } } as Record<string, { game?: number; talk?: number }>,
  usesCam: { talk: 0.5 }, // 캠을 쓰면 소통 쪽 아주 약하게(쓰지 않음은 신호로 보지 않는다)
  communityHigh: { talk: 1 }, // 커뮤니티 활동 "높음"
  // 저장한 컨텐츠 / 자세히 본 컨텐츠의 성격
  appeal: { visual: { game: 1 }, audio: { talk: 1 }, audiovisual: {} } as Record<string, { game?: number; talk?: number }>,
  watch: { focus: { game: 1 }, background: { talk: 1 } } as Record<string, { game?: number; talk?: number }>,
  participation: { none: {}, enriches: { talk: 1 }, required: { talk: 2 } } as Record<string, { game?: number; talk?: number }>,
  gameViewed: { game: 1 }, // 게임 상세 조회
  saved: 1, // 저장은 단순 조회보다 강한 선택이라 컨텐츠 성격 점수에 곱한다
} as const;

// 행동 기록 종류. 이 밖의 것(페이지 단순 조회, 마우스 이동, 체류 시간)은 기록하지 않는다.
export const EVENT_TYPES = ["recommend_requested", "recommend_saved", "content_viewed", "game_viewed", "profile_updated"] as const;
export type EventType = (typeof EVENT_TYPES)[number];
export const EVENT_RETENTION_DAYS = 180;
