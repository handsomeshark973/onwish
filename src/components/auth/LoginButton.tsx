import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

// 헤더의 [로그인] 버튼. 세션을 확인하는 동안에도 이 버튼을 먼저 보여 줘서 자리가 비지 않게 한다.
export function LoginButton() {
  const t = useTranslations("nav");
  return (
    <Link href="/login" className="ow-btn ow-btn-secondary ow-btn-sm">
      {t("login")}
    </Link>
  );
}
