import { getTranslations } from "next-intl/server";
import { getUser } from "@/lib/auth";
import { Link } from "@/i18n/navigation";

// 헤더의 계정 구역. 로그아웃 상태: [로그인] 버튼. 로그인 상태: 이름(첫 글자 아이콘) + 로그아웃.
// 쿠키를 읽으므로 레이아웃에서 Suspense로 감싸 쓴다.
export async function AuthSlot() {
  const t = await getTranslations("nav");
  const user = await getUser();
  if (!user) {
    return (
      <Link href="/login" className="ow-btn ow-btn-secondary ow-btn-sm">
        {t("login")}
      </Link>
    );
  }
  const meta = user.user_metadata as { name?: string } | undefined;
  const name = (meta?.name || user.email?.split("@")[0] || "").trim() || t("myAccount");
  return (
    <div className="ow-user">
      <Link href="/profile" className="ow-user-link" aria-label={`${t("goProfile")}: ${name}`}>
        <span className="ow-avatar" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
        <span className="ow-user-name">{name}</span>
      </Link>
      <form action="/auth/signout" method="post">
        <button type="submit" className="ow-btn ow-btn-ghost ow-btn-sm" aria-label={t("logout")}>{t("logout")}</button>
      </form>
    </div>
  );
}
