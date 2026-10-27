"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { lookupVideo, registerVideo, type VideoLookup, type VideoSave } from "@/actions/admin";
import { Button } from "@/components/ui/Button";

type GameOption = { id: string; name: string };

// 관리자 영상 등록: ① 주소 붙여 넣기 → 불러오기(제목·채널 자동 채움) ② 빈 칸 확인 후 등록
export function VideoForm({ games, hasApiKey }: { games: GameOption[]; hasApiKey: boolean }) {
  const t = useTranslations("admin.video");
  const [look, lookAction, looking] = useActionState<VideoLookup, FormData>(lookupVideo, { status: "idle" });
  const [save, saveAction, saving] = useActionState<VideoSave, FormData>(registerVideo, { status: "idle" });
  const f = look.status === "ok" ? look.fields : null;

  return (
    <div className="ow-form">
      <form action={lookAction} className="ow-field">
        <label className="ow-label" htmlFor="video-url">{t("url")}</label>
        <input id="video-url" name="url" className="ow-input" placeholder="https://www.youtube.com/watch?v=…" required />
        <div className="ow-card-actions ow-actions-flush">
          <Button type="submit" variant="secondary" disabled={looking}>{t("lookup")}</Button>
        </div>
        {look.status === "error" && <p className="ow-field-error" role="alert">{t(`err.${look.code}`)}</p>}
        {!hasApiKey && <p className="ow-hint">{t("noKey")}</p>}
      </form>

      {f && (
        // 불러올 때마다 새 영상 값으로 칸을 다시 채우도록 영상 ID를 key로 쓴다
        <form key={f.youtubeId} action={saveAction} className="ow-form ow-form-tight">
          <input type="hidden" name="youtubeId" value={f.youtubeId} />
          <div className="ow-field">
            <label className="ow-label" htmlFor="video-game">{t("game")}</label>
            <select id="video-game" name="gameId" className="ow-select" required defaultValue="">
              <option value="" disabled>{t("pickGame")}</option>
              {games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="ow-field">
            <label className="ow-label" htmlFor="video-kind">{t("kind")}</label>
            <select id="video-kind" name="kind" className="ow-select" required defaultValue="">
              <option value="" disabled>{t("pickKind")}</option>
              {(["teaser", "reveal", "launch", "gameplay"] as const).map((k) => <option key={k} value={k}>{t(`kinds.${k}`)}</option>)}
            </select>
          </div>
          <div className="ow-field">
            <label className="ow-label" htmlFor="video-title-ko">{t("titleKo")}</label>
            <input id="video-title-ko" name="titleKo" className="ow-input" defaultValue={f.title} />
          </div>
          <div className="ow-field">
            <label className="ow-label" htmlFor="video-title-en">{t("titleEn")}</label>
            <input id="video-title-en" name="titleEn" className="ow-input" />
          </div>
          <div className="ow-field">
            <label className="ow-label" htmlFor="video-channel">{t("channelName")}</label>
            <input id="video-channel" name="channelName" className="ow-input" defaultValue={f.channelName} required />
          </div>
          <div className="ow-field">
            <label className="ow-label" htmlFor="video-channel-id">{t("channelId")}</label>
            <input id="video-channel-id" name="channelId" className="ow-input" defaultValue={f.channelId} placeholder="UC…" />
            <p className="ow-hint">{f.autoChannel ? t("channelIdAuto") : t("channelIdManual")}</p>
          </div>
          <div className="ow-field">
            <label className="ow-label" htmlFor="video-date">{t("publishedAt")}</label>
            <input id="video-date" name="publishedAt" type="date" className="ow-input" defaultValue={f.publishedAt} />
          </div>
          <div className="ow-card-actions ow-actions-flush">
            <Button type="submit" disabled={saving}>{t("register")}</Button>
          </div>
          {save.status === "error" && <p className="ow-field-error" role="alert">{t(`err.${save.code}`)}</p>}
          {save.status === "saved" && <p className="ow-meta" role="status">{save.approved ? t("savedApproved") : t("savedPending")}</p>}
        </form>
      )}
    </div>
  );
}
