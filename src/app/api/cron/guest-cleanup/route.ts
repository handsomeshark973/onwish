import { NextResponse, type NextRequest } from "next/server";
import { refreshCustomers } from "@/lib/customers/refresh";
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
  // 같은 크론에서 고객 유형 추정과 오래된 이벤트 삭제도 한다(크론 개수를 늘리지 않으려고 합쳤다. Vercel 무료 플랜은 2개까지).
  // 게스트 정리가 먼저라, 지워진 게스트의 고객 정보·이벤트는 계산에 들어가지 않는다.
  try {
    return NextResponse.json({ purged: data ?? 0, customers: await refreshCustomers() });
  } catch (e) {
    return NextResponse.json({ purged: data ?? 0, customersError: e instanceof Error ? e.message : "failed" }, { status: 500 });
  }
}
