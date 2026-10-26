// 사이트 이름과 도메인은 여기 한 곳에서만 정한다. 환경변수로 덮어쓸 수 있다.
// 소개 문구(한 줄 소개·설명)는 언어별로 messages/*.json의 meta에 있다.
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "ONWISH";
export const SITE_DOMAIN = process.env.NEXT_PUBLIC_SITE_DOMAIN || "onwish.live";
export const SITE_URL = `https://${SITE_DOMAIN}`;
