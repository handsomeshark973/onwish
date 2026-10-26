import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { GameImage } from "@/components/ui/GameImage";
import { MiniChart } from "@/components/ui/MiniChart";
import { AppealBadge, StageBadge } from "@/components/ui/Badge";
import { formatPlayers } from "@/lib/format";
import type { MetricKind } from "@/types/domain";
import type { Device, HeatStage, MainAppeal } from "@/types/taxonomy";

type Props = {
  href: string;
  name: string;
  developer?: string;
  stage: HeatStage | null;
  appeals?: MainAppeal[]; // 진행 방식별 주 어필
  dateLabel?: string; // 예: "출시 예정 2026-11-07"
  players: { min: number | null; max: number | null; fixed?: boolean | null };
  platforms: Device[];
  imageUrl?: string; // 공식 스토어·보도자료 이미지. 권리를 확인하지 못하면 비워 둔다
  imageAlt?: string;
  imageSource?: string;
  metric?: { values: (number | null)[]; kind: MetricKind };
};

export function GameCard({ href, name, developer, stage, appeals, dateLabel, players, platforms, imageUrl, imageAlt, imageSource, metric }: Props) {
  const tf = useTranslations("format");
  const tm = useTranslations("gameDetail");
  const fixed = players.fixed === true;
  return (
    <article className="ow-card ow-game-card">
      <GameImage name={name} src={imageUrl} alt={imageAlt} source={imageSource} />
      <div className="ow-card-badges">
        <StageBadge stage={stage} />
      </div>
      <h3 className="ow-card-title">
        <Link href={href} className="ow-card-link">
          {name}
        </Link>
      </h3>
      {developer && <p className="ow-meta">{developer}</p>}
      {dateLabel && <p className="ow-meta">{dateLabel}</p>}
      <p className={fixed ? "ow-players ow-players-fixed" : "ow-players"}>{formatPlayers(players, tf)}</p>
      <p className="ow-meta">{platforms.join(" · ")}</p>
      {appeals && appeals.length > 0 && (
        <div className="ow-card-badges">
          {appeals.map((a) => (
            <AppealBadge key={a} appeal={a} />
          ))}
        </div>
      )}
      {metric && <MiniChart values={metric.values} label={`${tm(`metric.${metric.kind}`)} ${tm("metric.last30")}`} />}
    </article>
  );
}
