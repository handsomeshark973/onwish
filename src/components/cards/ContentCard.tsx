import { Link } from "@/i18n/navigation";
import { AppealBadge } from "@/components/ui/Badge";
import { useTranslations } from "next-intl";
import { useLabels } from "@/i18n/labels";
import type { MainAppeal, PlayerTier, ViewerParticipation } from "@/types/taxonomy";

type Props = {
  href: string;
  title: string;
  appeal: MainAppeal;
  appealLine: string;
  participation: ViewerParticipation;
  tier?: PlayerTier;
  games?: string; // 연결된 게임 이름
};

export function ContentCard({ href, title, appeal, appealLine, participation, tier, games }: Props) {
  const l = useLabels();
  const t = useTranslations("contentCard");
  return (
    <article className="ow-card">
      <div className="ow-card-badges">
        <AppealBadge appeal={appeal} />
        {tier && <span className="ow-meta">{l.tier[tier]}</span>}
      </div>
      <h3 className="ow-card-title">
        <Link href={href} className="ow-card-link">
          {title}
        </Link>
      </h3>
      <p className="ow-card-text">{appealLine}</p>
      <p className="ow-meta">{l.participation[participation]}</p>
      {games && <p className="ow-meta">{t("games", { games })}</p>}
    </article>
  );
}
