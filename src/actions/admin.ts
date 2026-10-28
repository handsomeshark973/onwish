"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { refreshCustomers } from "@/lib/customers/refresh";
import { createClient } from "@/lib/supabase/server";
import { initialVideoStatus } from "@/lib/video-rules";
import { extractYoutubeId, youtubeWatchUrl } from "@/lib/youtube";
import { fetchOembed, fetchVideoMeta } from "@/lib/youtube-api";

// 관리자 동작은 모두 서버에서 먼저 관리자인지 확인한다. 화면에서 버튼을 숨기는 것만으로는 보호하지 않는다.
// 쓰기는 로그인한 관리자의 권한으로 실행되어, DB의 권한 정책(RLS)이 한 번 더 막는다.
async function guard() {
  if (!(await isAdmin())) notFound();
  return createClient();
}

const TABLES = { game: "games", game_format: "game_formats", content: "contents" } as const;

export async function setApproval(formData: FormData) {
  const supabase = await guard();
  const type = String(formData.get("type")) as keyof typeof TABLES;
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status"));
  if (!(type in TABLES) || !["approved", "rejected", "archived", "pending"].includes(status)) return;
  // 승인할 때는 "직접 확인했다"는 체크가 있어야 하고, 그때 확인일을 오늘로 남긴다
  if (status === "approved" && formData.get("verified") !== "on") return;
  const patch: Record<string, unknown> = { approval_status: status };
  if (status === "approved") patch.last_checked_at = new Date().toISOString();
  await supabase.from(TABLES[type]).update(patch).eq("id", id);
  revalidatePath("/", "layout"); // 모든 언어의 공개 화면을 새로 만든다
}

export async function setReportStatus(formData: FormData) {
  const supabase = await guard();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status"));
  if (!["open", "in_progress", "resolved", "dismissed"].includes(status)) return;
  const { data } = await supabase.auth.getUser();
  await supabase
    .from("error_reports")
    .update({ status, handled_by: status === "open" ? null : data.user?.id ?? null, handled_at: status === "open" ? null : new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/[locale]/admin", "page");
}


// ───── 게임 영상 ─────
const VIDEO_KINDS = ["teaser", "reveal", "launch", "gameplay"] as const;

export interface VideoFields {
  youtubeId: string;
  title: string;
  channelName: string;
  channelId: string;
  publishedAt: string; // yyyy-mm-dd
  autoChannel: boolean; // 채널 ID를 자동으로 채웠는지(키 없으면 false → 직접 입력)
}
export type VideoLookup =
  | { status: "idle" }
  | { status: "ok"; fields: VideoFields }
  | { status: "error"; code: "bad_url" | "unavailable" | "embed_blocked" | "check_failed" };

// URL을 붙여 넣으면 ID를 꺼내고 oEmbed로 제목·채널명, (키가 있으면) Data API로 채널 ID·게시일을 채운다. 저장은 하지 않는다.
export async function lookupVideo(_prev: VideoLookup, formData: FormData): Promise<VideoLookup> {
  await guard();
  const id = extractYoutubeId(String(formData.get("url") ?? ""));
  if (!id) return { status: "error", code: "bad_url" };
  const o = await fetchOembed(id);
  if (!o.ok) return { status: "error", code: o.reason === "error" ? "check_failed" : o.reason };
  const meta = await fetchVideoMeta(id);
  const channelId = meta?.channelId ?? o.channelId ?? "";
  return {
    status: "ok",
    fields: { youtubeId: id, title: o.title, channelName: o.channelName, channelId, publishedAt: meta?.publishedAt?.slice(0, 10) ?? "", autoChannel: !!channelId },
  };
}

export type VideoSave = { status: "idle" } | { status: "saved"; approved: boolean } | { status: "error"; code: "bad_input" | "unavailable" | "embed_blocked" | "check_failed" | "duplicate" | "failed" };

// 영상 등록. 서버가 oEmbed로 다시 확인한 뒤(재생 가능·퍼가기 허용) 저장한다. 채널 ID가 게임의 공식 채널 목록에 있으면 승인, 아니면 대기.
export async function registerVideo(_prev: VideoSave, formData: FormData): Promise<VideoSave> {
  const supabase = await guard();
  const id = extractYoutubeId(String(formData.get("youtubeId") ?? ""));
  const gameId = String(formData.get("gameId") ?? "");
  const kind = String(formData.get("kind")) as (typeof VIDEO_KINDS)[number];
  const titleKo = String(formData.get("titleKo") ?? "").trim() || null;
  const titleEn = String(formData.get("titleEn") ?? "").trim() || null;
  const channelName = String(formData.get("channelName") ?? "").trim();
  const channelId = String(formData.get("channelId") ?? "").trim() || null;
  const published = String(formData.get("publishedAt") ?? "").trim();
  if (!id || !gameId || !VIDEO_KINDS.includes(kind) || !channelName || (!titleKo && !titleEn)) return { status: "error", code: "bad_input" };
  if (channelId && !/^UC[A-Za-z0-9_-]{22}$/.test(channelId)) return { status: "error", code: "bad_input" };
  if (published && Number.isNaN(Date.parse(published))) return { status: "error", code: "bad_input" };

  const o = await fetchOembed(id);
  if (!o.ok) return { status: "error", code: o.reason === "error" ? "check_failed" : o.reason };

  const { data: game } = await supabase.from("games").select("official_channel_ids").eq("id", gameId).single();
  if (!game) return { status: "error", code: "bad_input" };
  const status = initialVideoStatus(channelId, (game as { official_channel_ids: string[] }).official_channel_ids ?? []);
  const { error } = await supabase.from("game_videos").insert({
    game_id: gameId, youtube_id: id, kind, title_ko: titleKo, title_en: titleEn, channel_name: channelName, channel_id: channelId,
    published_at: published ? new Date(published).toISOString() : null, source_url: youtubeWatchUrl(id),
    verified_at: new Date().toISOString(), status,
  });
  if (error) return { status: "error", code: error.code === "23505" ? "duplicate" : "failed" };
  revalidatePath("/", "layout");
  return { status: "saved", approved: status === "approved" };
}

// 대기 영상 승인·숨김, 승인 영상의 대표 지정. 승인에는 "직접 확인" 체크가 필요하고, 채널을 공식 목록에 추가할 수 있다.
export async function setVideoStatus(formData: FormData) {
  const supabase = await guard();
  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action"));
  if (!id) return;
  if (action === "approve") {
    if (formData.get("verified") !== "on") return;
    const { data: v } = await supabase.from("game_videos").select("game_id, channel_id").eq("id", id).single();
    if (!v) return;
    if (formData.get("addChannel") === "on" && v.channel_id) {
      const { data: g } = await supabase.from("games").select("official_channel_ids").eq("id", v.game_id).single();
      const list = ((g as { official_channel_ids: string[] } | null)?.official_channel_ids ?? []).filter((c) => c !== v.channel_id);
      await supabase.from("games").update({ official_channel_ids: [...list, v.channel_id] }).eq("id", v.game_id);
    }
    await supabase.from("game_videos").update({ status: "approved", hidden_reason: null, verified_at: new Date().toISOString() }).eq("id", id);
  } else if (action === "hide") {
    await supabase.from("game_videos").update({ status: "hidden", hidden_reason: "manual", is_featured: false }).eq("id", id);
  } else if (action === "feature" || action === "unfeature") {
    if (action === "feature") await supabase.from("game_videos").update({ is_featured: false }).eq("is_featured", true); // 대표는 하나만
    await supabase.from("game_videos").update({ is_featured: action === "feature" }).eq("id", id).eq("status", "approved");
  } else return;
  revalidatePath("/", "layout");
}

// 고객 유형 추정을 지금 다시 계산한다(평소에는 하루 한 번 크론이 한다). 관리자만.
export async function recomputeCustomers() {
  await guard();
  await refreshCustomers();
  revalidatePath("/[locale]/admin/customers", "page");
}
