import { getTranslations } from "next-intl/server";
import { getDisplayUser } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import { LoginButton } from "./LoginButton";

// 헤더의 계정 구역. 로그아웃 상태: [로그인] 버튼. 게스트: "게스트" + [로그인]. 로그인 상태: 이름(첫 글자 아이콘) + 로그아웃.
// 쿠키를 읽으므로 레이아웃에서 Suspense로 감싸 쓴다.
export async function AuthSlot() {
  const t = await getTranslations("nav");
  const user = await getDisplayUser();
  if (!user) return <LoginButton />;
  // 게스트: 이름 대신 "게스트"와 [로그인]을 보여 준다. 로그아웃하면 저장한 내용을 잃으므로 로그아웃 버튼은 두지 않는다.
  if (user.is_anonymous === true) {
    return (
      <div className="ow-user">
        <Link href="/profile" className="ow-user-link ow-user-guest" aria-label={`${t("goProfile")}: ${t("guestName")}`}>
          <span className="ow-avatar" aria-hidden="true">G</span>
          <span className="ow-user-name">{t("guestName")}</span>
        </Link>
        <LoginButton />
      </div>
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
