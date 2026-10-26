import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { AppealBadge, StageBadge } from "@/components/ui/Badge";
import { useLabels } from "@/i18n/labels";
import type { HeatStage, MainAppeal, WatchMode } from "@/types/taxonomy";

type Props = {
  title: string;
  logline: string;
  appeal: MainAppeal;
  appealPoints: string[]; // 세부 어필의 한글 이름
  appealText: string;
  fit: "match" | "complement";
  fitReason?: string; // 보완일 때 왜 넣었는지
  watchMode: WatchMode;
  stage?: HeatStage; // 트렌드 후보일 때만
  setup?: string;
  howTo: string[];
  participation: string; // 참여 방식 설명 또는 "넣지 않은 이유"
  continuity?: string;
  cautions?: string;
  games?: { name: string; slug: string; lines: string[] }[]; // 게임·인원·필수 기기·가격
  roles?: { member: string; role: string }[];
  multiPovPoint?: string;
  episodes?: { no: number; title: string; mainAppeal: string }[]; // 시리즈일 때만
  origin?: string; // 원천. 참고한 예능 뼈대는 보조 정보로만 작게
  borrowedFrom?: string;
  actions?: ReactNode; // 저장 · 상세 이동 버튼
};

// 길어지는 항목은 "자세히 보기"로 접어 둔다. 접기·펼치기는 브라우저 기본 기능이라 키보드로 열린다.
export function RecommendCard(p: Props) {
  const t = useTranslations("reco");
  const l = useLabels();
  return (
    <article className="ow-card ow-reco">
      <div className="ow-card-badges">
        <AppealBadge appeal={p.appeal} />
        <span className={`ow-badge ow-fit-${p.fit}`}>{p.fit === "match" ? t("match") : t("complement")}</span>
        {p.stage && <StageBadge stage={p.stage} />}
        <span className="ow-meta">{l.watch[p.watchMode]}</span>
      </div>
      <h3 className="ow-card-title">{p.title}</h3>
      <p className="ow-card-text">{p.logline}</p>
      <p className="ow-meta">
        {p.appealPoints.join(" · ")}
      </p>
      <p className="ow-card-text">{p.appealText}</p>
      {p.fit === "complement" && p.fitReason && <p className="ow-note">{t("complementReason", { reason: p.fitReason })}</p>}

      <details className="ow-details">
        <summary>{t("details")}</summary>
        <dl>
          {p.setup && (
            <>
              <dt>{t("setup")}</dt>
              <dd>{p.setup}</dd>
            </>
          )}
          {p.games && p.games.length > 0 && (
            <>
              <dt>{t("gameInfo")}</dt>
              <dd>
                <ul>
                  {p.games.map((g) => (
                    <li key={g.slug}>
                      <strong>{g.name}</strong>
                      {g.lines.map((l, i) => <div key={i} className="ow-meta">{l}</div>)}
                    </li>
                  ))}
                </ul>
              </dd>
            </>
          )}
          <dt>{t("howTo")}</dt>
          <dd>
            <ol>
              {p.howTo.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </dd>
          {p.roles && p.roles.length > 0 && (
            <>
              <dt>{t("roles")}</dt>
              <dd>
                <ul>
                  {p.roles.map((r, i) => <li key={i}><strong>{r.member}</strong> — {r.role}</li>)}
                </ul>
              </dd>
            </>
          )}
          {p.multiPovPoint && (
            <>
              <dt>{t("multiPov")}</dt>
              <dd>{p.multiPovPoint}</dd>
            </>
          )}
          <dt>{t("participation")}</dt>
          <dd>{p.participation}</dd>
          {p.continuity && (
            <>
              <dt>{t("continuity")}</dt>
              <dd>{p.continuity}</dd>
            </>
          )}
          {p.cautions && (
            <>
              <dt>{t("cautions")}</dt>
              <dd>{p.cautions}</dd>
            </>
          )}
        </dl>
        {p.episodes && p.episodes.length > 0 && (
          <>
            <h4 className="ow-label">{t("episodes")}</h4>
            <ol>
              {p.episodes.map((e) => <li key={e.no}>{e.title} <span className="ow-meta">({e.mainAppeal})</span></li>)}
            </ol>
          </>
        )}
        {(p.origin || p.borrowedFrom) && (
          <p className="ow-meta">
            {p.origin}
            {p.borrowedFrom ? ` · ${t("reference", { name: p.borrowedFrom })}` : ""}
          </p>
        )}
      </details>
      {p.actions && <div className="ow-card-actions">{p.actions}</div>}
    </article>
  );
}
