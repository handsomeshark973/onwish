// 운영 중 조정하는 수치. 기획서 12.2 기준.
export const FREE_AI_RECOMMENDS_PER_MONTH = 5;

// 서비스 전체 하루 AI 비용 상한(미국 달러, 한국 시간 날짜 기준). 넘으면 그날은 기본 추천으로 대체된다.
// 기획서가 "구현 착수 시 설정"이라고 해서 처음 값을 정해 둔 것이며, 운영하면서 바꾼다.
export const DAILY_AI_COST_LIMIT_USD = 10;

// 한 사용자가 1분 안에 보낼 수 있는 추천 요청 수(차감하지 않은 요청도 센다).
export const AI_REQUESTS_PER_MINUTE = 3;

// 모델 가격(1백만 토큰당 달러). 비용 상한 계산용. 목록에 없는 모델은 가장 비싼 값으로 계산해 상한을 넘기지 않도록 한다.
export const MODEL_PRICES: Record<string, { in: number; out: number }> = {
  "claude-opus-5-5": { in: 4, out: 20 },
  "claude-opus-5": { in: 5, out: 25 },
  "claude-sonnet-5-5": { in: 2, out: 10 },
  "claude-haiku-5-5": { in: 0.5, out: 2.5 }, // 입력 10만 토큰 초과 구간 가격으로 넉넉하게
  "claude-fable-5-1": { in: 10, out: 50 },
};
export const FALLBACK_PRICE = { in: 10, out: 50 };

export const DEFAULT_MODEL = "claude-sonnet-5-5";

// ───── 게스트(로그인 없이 쓰는 방문자) ─────
// 환경 변수로 조정할 수 있다(GUEST_AI_DAILY_LIMIT 등). 비어 있거나 숫자가 아니면 아래 기본값을 쓴다.
const num = (v: string | undefined, d: number) => (v && Number.isFinite(Number(v)) && Number(v) >= 0 ? Math.floor(Number(v)) : d);
// 게스트 한 명이 하루(한국 시간)에 받을 수 있는 AI 추천 횟수
export const GUEST_AI_DAILY_LIMIT = num(process.env.GUEST_AI_DAILY_LIMIT, 3);
// 같은 접속 주소(IP)에서 게스트가 하루에 보낼 수 있는 추천 요청 수. 게스트를 새로 만들어 한도를 피하는 것을 막는다.
export const GUEST_AI_PER_IP_PER_DAY = num(process.env.GUEST_AI_PER_IP_PER_DAY, 30);
// 같은 접속 주소에서 한 시간에 만들 수 있는 게스트 수
export const GUEST_CREATES_PER_IP_PER_HOUR = num(process.env.GUEST_CREATES_PER_IP_PER_HOUR, 10);
// 마지막 활동 후 게스트를 보관하는 날 수
export const GUEST_TTL_DAYS = 14;
