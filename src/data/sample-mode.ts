// 개발 중에만 가짜 예시 데이터를 쓴다. 배포(production)에서는 환경변수를 켜도 항상 꺼져 있다.
export const sampleMode = () => process.env.NODE_ENV !== "production" && process.env.ONWISH_SAMPLE_DATA === "1";
