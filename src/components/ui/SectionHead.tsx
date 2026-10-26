import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

// 섹션 제목 줄: 왼쪽 제목, 오른쪽 "전체 보기" 링크. 모든 페이지의 구역 리듬을 같게 맞춘다.
export function SectionHead({ title, href }: { title: string; href?: string }) {
  const t = useTranslations("home");
  return (
    <div className="ow-section-head">
      <h2 className="ow-h2 ow-h2-flush">{title}</h2>
      {href && (
        <Link href={href} className="ow-section-link">
          {t("seeAll")}
          <span className="ow-visually-hidden"> — {title}</span>
        </Link>
      )}
    </div>
  );
}
