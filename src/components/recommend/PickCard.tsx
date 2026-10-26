"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition, type ReactNode } from "react";
import { savePick } from "@/actions/recommend";
import { ReportButton } from "@/components/report/ReportButton";
import { RecommendCard } from "@/components/cards/RecommendCard";
import { Button } from "@/components/ui/Button";
import type { ProfileInput } from "@/lib/recommend/schema";
import type { RecommendPick } from "@/lib/recommend/types";
import { useLabels } from "@/i18n/labels";

export function PickCard({ pick, profile, source, readOnly = false, extra }: { pick: RecommendPick; profile?: ProfileInput; source: "ai" | "rule"; readOnly?: boolean; extra?: ReactNode }) {
  const t = useTranslations("recommend.pick");
  const l = useLabels();
  const [saved, setSaved] = useState<"idle" | "saved" | "error">("idle");
  const [pending, start] = useTransition();

  const participation =
    pick.viewerParticipation === "none"
      ? pick.noParticipationReason || t("noParticipation")
      : [
          l.participation[pick.viewerParticipation],
          pick.participationChannels.map((c) => l.channel[c]).join(", "),
          pick.participationHow,
        ].filter(Boolean).join(" · ");

  return (
    <RecommendCard
      title={pick.title}
      logline={pick.logline}
      appeal={pick.mainAppeal}
      appealPoints={pick.appealPoints.map((x) => l.appealPoint[x] ?? x)}
      appealText={pick.appealText}
      fit={pick.strengthFit}
      fitReason={pick.strengthFitReason}
      watchMode={pick.watchMode}
      stage={pick.heatStage ?? undefined}
      setup={pick.setup || undefined}
      howTo={pick.howTo}
      participation={participation}
      continuity={pick.continuity || undefined}
      cautions={pick.cautions || undefined}
      origin={pick.origin ? l.origin[pick.origin] : undefined}
      borrowedFrom={pick.borrowedFrom ?? undefined}
      roles={pick.roles}
      multiPovPoint={pick.multiPovPoint || undefined}
      episodes={pick.episodes}
      games={pick.gameInfo.map((g) => ({
        name: g.name,
        slug: g.slug,
        lines: [
          t("gamePlayers", { players: g.players, format: g.formatPlayers }),
          g.extraDevices.length ? t("extraDevices", { devices: g.extraDevices.join(", ") }) : "",
          t("price", { price: g.priceNote }),
          g.needsPurchase === true ? t("needsPurchase") : g.needsPurchase === false ? t("allOwn") : "",
        ].filter(Boolean),
      }))}
      actions={
        <>
          {!readOnly && profile && (
          <Button
            variant="secondary"
            disabled={pending || saved === "saved"}
            onClick={() =>
              start(async () => {
                const r = await savePick(pick, profile, source);
                setSaved(r.status === "saved" ? "saved" : "error");
              })
            }
          >
            {saved === "saved" ? t("saved") : pending ? t("saving") : t("save")}
          </Button>
          )}
          {extra}
          <ReportButton targetType={pick.contentId ? "content" : pick.formatId ? "game_format" : "recommendation"} targetId={pick.contentId ?? pick.formatId} label={pick.title} loginNext="/recommend" />
          {pick.contentSlug && <Link className="ow-btn ow-btn-ghost" href={`/library/${pick.contentSlug}`}>{t("contentDetail")}</Link>}
          {pick.kind === "trend" && pick.gameInfo[0] && <Link className="ow-btn ow-btn-ghost" href={`/radar/${pick.gameInfo[0].slug}`}>{t("gameDetail")}</Link>}
          {saved === "error" && <span className="ow-meta" role="alert">{t("saveError")}</span>}
        </>
      }
    />
  );
}
