import { createClient } from "@supabase/supabase-js";

// 공개 페이지 읽기용. 쿠키를 쓰지 않아 캐시할 수 있다. 공개 키라서 DB의 RLS가
// 승인된(approved) 행만 돌려준다. 로그인한 사용자 데이터에는 쓰지 않는다.
export function createPublicClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
