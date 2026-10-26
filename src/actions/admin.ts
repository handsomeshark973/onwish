"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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

