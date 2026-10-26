// AI 추천을 쓸지 여부. Anthropic 키가 있고 ONWISH_AI가 off가 아닐 때만 켜진다.
// 꺼져 있으면 모든 추천은 규칙 기반 "기본 추천"으로 나가고, 이용 횟수 안내도 숨긴다.
export const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY) && process.env.ONWISH_AI !== "off";
