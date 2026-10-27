import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { VIDEO_CHECK_DELAY_MS } from "@/config/videos";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchOembed } from "@/lib/youtube-api";

// 하루 한 번(Vercel Cron) 승인된 영상이 아직 재생 가능한지 oEmbed로 다시 확인한다.
// 삭제·비공개·퍼가기 금지로 바뀐 영상은 hidden으로 돌리고 이유를 남긴다(관리자 화면의 "숨겨진 영상"에 나타난다).
// 유튜브 쪽 일시 오류(네트워크·5xx)는 영상 문제가 아니므로 상태를 바꾸지 않는다.
// CRON_SECRET이 없으면 누구도 부를 수 없다(Vercel Cron은 이 값을 Authorization 헤더로 보낸다).
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  const { data, error } = await db.from("game_videos").select("id, youtube_id").eq("status", "approved");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = { checked: 0, ok: 0, hidden: 0, skipped: 0 };
  for (const v of data ?? []) {
    const r = await fetchOembed(v.youtube_id);
    result.checked++;
    if (r.ok) {
      await db.from("game_videos").update({ verified_at: new Date().toISOString() }).eq("id", v.id);
      result.ok++;
    } else if (r.reason === "error") {
      result.skipped++;
    } else {
      await db.from("game_videos").update({ status: "hidden", hidden_reason: r.reason, is_featured: false, verified_at: new Date().toISOString() }).eq("id", v.id);
      result.hidden++;
    }
    await new Promise((res) => setTimeout(res, VIDEO_CHECK_DELAY_MS));
  }
  if (result.hidden > 0) revalidatePath("/", "layout");
  return NextResponse.json(result);
}
