// 첫 화면이 그려지기 전에 실행해서 저장된 테마를 적용한다(깜빡임 방지).
// 저장값이 없으면 아무것도 하지 않아 CSS가 시스템 설정을 따르고, 시스템 설정이 없으면 다크가 기본이다.
export const THEME_COOKIE = "ow-theme";

export const themeInitScript = `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=(dark|light)/);if(m)document.documentElement.setAttribute("data-theme",m[1]);}catch(e){}})();`;

const YEAR = 60 * 60 * 24 * 365;

// 사용자가 고른 테마를 바로 적용하고 쿠키에 1년 저장한다. "system"이면 선택을 지워 시스템 설정을 따른다.
export function applyTheme(next: "system" | "dark" | "light") {
  const root = document.documentElement;
  if (next === "system") {
    root.removeAttribute("data-theme");
    document.cookie = `${THEME_COOKIE}=; path=/; max-age=0; samesite=lax`;
  } else {
    root.setAttribute("data-theme", next);
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${YEAR}; samesite=lax`;
  }
}
