// 유튜브 주소·ID를 다루는 순수 함수(브라우저·서버 모두 안전, 외부 요청 없음).

const ID_RE = /^[A-Za-z0-9_-]{11}$/;
const HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com", "youtu.be"]);

export const isYoutubeId = (v: string) => ID_RE.test(v);

// 붙여 넣은 값에서 영상 ID(11자리)만 꺼낸다. 11자리 ID, watch?v=, youtu.be/, embed/, shorts/, live/, v/ 주소를 받는다.
// 유튜브 주소가 아니거나 ID를 못 찾으면 null. 재생목록·채널 주소는 받지 않는다.
export function extractYoutubeId(input: string): string | null {
  const raw = input.trim();
  if (isYoutubeId(raw)) return raw;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  if (!HOSTS.has(url.hostname.toLowerCase())) return null;
  let id: string | null = null;
  if (url.hostname.toLowerCase() === "youtu.be") {
    id = url.pathname.split("/")[1] ?? null;
  } else if (url.pathname === "/watch") {
    id = url.searchParams.get("v");
  } else {
    const m = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
    id = m?.[1] ?? null;
  }
  return id && isYoutubeId(id) ? id : null;
}

// 원본 링크는 입력 형태와 상관없이 같은 모양으로 저장한다.
export const youtubeWatchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

// oEmbed가 주는 채널 주소가 /channel/UC… 모양일 때만 채널 ID를 읽을 수 있다(@핸들 주소는 API가 필요하다).
export function channelIdFromUrl(authorUrl: string | null | undefined): string | null {
  const m = authorUrl?.match(/youtube\.com\/channel\/(UC[A-Za-z0-9_-]{22})/);
  return m?.[1] ?? null;
}
