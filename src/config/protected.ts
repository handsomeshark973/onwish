// 로그인해야 볼 수 있는 페이지(언어 부분을 뺀 주소). 프록시가 로그인 쿠키가 없으면 /login으로 보낸다(빠른 1차 확인).
// 게스트 모드 도입으로 비어 있다: /profile 도 세션이 없으면 빈 화면을 보여 주고, 게스트 세션은 추천 받기·저장 같은 행동을 할 때 만든다.
// 진짜 권한 확인은 각 페이지·서버 동작이 서버에서 한다. 관리자 페이지는 존재 자체를 숨기려고 여기 넣지 않는다.
export const PROTECTED_PATHS: string[] = [];

export const isProtectedPath = (pathWithoutLocale: string) =>
  PROTECTED_PATHS.some((p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(`${p}/`));
