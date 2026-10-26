import "server-only";
import { createClient } from "@supabase/supabase-js";

// 서버 전용 관리 키(service_role). RLS를 건너뛰므로 AI 이용량 차감처럼
// 서버가 직접 해야 하는 일에만 쓴다. 이 파일은 브라우저 코드에서 불러올 수 없다.
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
