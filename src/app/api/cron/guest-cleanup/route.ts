import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// 하루 한 번(Vercel Cron) 만료된 게스트 사용자와 그 데이터를 지운다(DB 함수 purge_expired_guests, 0009 마이그레이션).
// CRON_SECRET이 없으면 누구도 부를 수 없다(Vercel Cron은 이 값을 Authorization 헤더로 보낸다).
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data, error } = await createAdminClient().rpc("purge_expired_guests");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ purged: data ?? 0 });
}
