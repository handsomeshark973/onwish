"use server";

import { getUser } from "@/lib/auth";
import { recordEvent } from "@/lib/customers/events";
import { createPublicClient } from "@/lib/data/public-client";
import { allow, hashKey } from "@/lib/rate-limit";

const SLUG = /^[a-z0-9][a-z0-9-]{0,79}$/;

// 컨텐츠·게임 상세를 "자세히 본" 기록. 이미 세션이 있는 방문자만 기록한다(세션을 새로 만들지 않는다 → 크롤러·단순 방문으로 게스트가 쌓이지 않는다).
// 같은 사람이 같은 항목을 하루에 여러 번 열어도 한 번만 센다.
export async function trackView(kind: "content" | "game", slug: string): Promise<void> {
  if ((kind !== "content" && kind !== "game") || !SLUG.test(slug)) return;
  const user = await getUser();
  if (!user) return;
  if (!(await allow(`view:${hashKey(`${user.id}:${kind}:${slug}`)}`, 1, 86400))) return;

  if (kind === "game") {
    await recordEvent(user.id, user.is_anonymous === true, "game_viewed", { slug });
    return;
  }
  // 컨텐츠 성격(주 어필·시청 태도·시청자 참여)은 서버가 DB에서 읽어 기록한다. 화면이 보낸 값은 믿지 않는다.
  const db = createPublicClient();
  const { data } = await db?.from("contents").select("main_appeal, watch_mode, viewer_participation").eq("slug", slug).maybeSingle() ?? { data: null };
  if (!data) return;
  await recordEvent(user.id, user.is_anonymous === true, "content_viewed", {
    slug, mainAppeal: data.main_appeal, watchMode: data.watch_mode, viewerParticipation: data.viewer_participation,
  });
}
