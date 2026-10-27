import "server-only";
import { channelIdFromUrl, youtubeWatchUrl } from "./youtube";

// 유튜브 확인 요청. 서버에서만 부른다. YOUTUBE_API_KEY는 이 파일에서만 읽고 클라이언트로 내보내지 않는다.

export type OembedResult =
  | { ok: true; title: string; channelName: string; authorUrl: string | null; channelId: string | null }
  | { ok: false; reason: "unavailable" | "embed_blocked" | "error" };

// oEmbed(API 키 불필요). 상태 코드: 404·403 = 삭제·비공개, 401 = 퍼가기 금지, 그 밖(네트워크·5xx)은 영상 문제가 아닌 확인 실패.
export async function fetchOembed(youtubeId: string): Promise<OembedResult> {
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeWatchUrl(youtubeId))}&format=json`;
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (res.status === 404 || res.status === 403) return { ok: false, reason: "unavailable" };
    if (res.status === 401) return { ok: false, reason: "embed_blocked" };
    if (!res.ok) return { ok: false, reason: "error" };
    const j = (await res.json()) as { title?: string; author_name?: string; author_url?: string };
    if (!j.title || !j.author_name) return { ok: false, reason: "error" };
    return { ok: true, title: j.title, channelName: j.author_name, authorUrl: j.author_url ?? null, channelId: channelIdFromUrl(j.author_url) };
  } catch {
    return { ok: false, reason: "error" };
  }
}

export const hasYoutubeApiKey = () => !!process.env.YOUTUBE_API_KEY;

export interface VideoMeta { channelId: string | null; publishedAt: string | null; embeddable: boolean | null }

// YouTube Data API v3로 채널 ID와 게시일을 조회한다. 키가 없거나 실패하면 null(관리자가 직접 입력).
export async function fetchVideoMeta(youtubeId: string): Promise<VideoMeta | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;
  try {
    const u = new URL("https://www.googleapis.com/youtube/v3/videos");
    u.searchParams.set("part", "snippet,status");
    u.searchParams.set("id", youtubeId);
    u.searchParams.set("key", key);
    const res = await fetch(u, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const j = (await res.json()) as { items?: { snippet?: { channelId?: string; publishedAt?: string }; status?: { embeddable?: boolean } }[] };
    const it = j.items?.[0];
    if (!it) return null;
    return { channelId: it.snippet?.channelId ?? null, publishedAt: it.snippet?.publishedAt ?? null, embeddable: it.status?.embeddable ?? null };
  } catch {
    return null;
  }
}
