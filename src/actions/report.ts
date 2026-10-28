"use server";

import { z } from "zod";
import { ensureUser } from "@/lib/guest";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  targetType: z.enum(["game", "game_format", "content", "recommendation"]),
  targetId: z.string().max(80).nullable(),
  message: z.string().trim().min(1).max(2000),
});

export type ReportResponse = { status: "sent" } | { status: "login_required" } | { status: "invalid" } | { status: "too_many" } | { status: "error" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_PER_DAY = 20;

// 정보 오류 신고. 로그인한 사용자만, 하루 20건까지. 관리자가 /admin에서 처리 상태를 바꾼다.
export async function submitReport(input: unknown): Promise<ReportResponse> {
  const r = schema.safeParse(input);
  if (!r.success) return { status: "invalid" };
  const ensured = await ensureUser();
  if (!ensured.ok) return { status: "error" };
  const { user } = ensured;
  // 게스트는 DB에 직접 넣을 수 없게 막았으므로(0010) 서버가 하루 20건 제한을 확인한 뒤 대신 기록한다. reporter_id는 항상 서버가 확인한 본인이다.
  const supabase = createAdminClient();
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { count } = await supabase.from("error_reports").select("id", { count: "exact", head: true }).eq("reporter_id", user.id).gte("created_at", since);
  if ((count ?? 0) >= MAX_PER_DAY) return { status: "too_many" };

  const { error } = await supabase.from("error_reports").insert({
    reporter_id: user.id,
    target_type: r.data.targetType,
    target_id: r.data.targetId && UUID.test(r.data.targetId) ? r.data.targetId : null, // 추천 카드처럼 DB 번호가 없는 대상은 내용에 적는다
    message: r.data.message,
  });
  return error ? { status: "error" } : { status: "sent" };
}
