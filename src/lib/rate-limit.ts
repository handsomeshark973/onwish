import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

// 시도 횟수 제한. DB(auth_attempt 함수, 0005 마이그레이션)에 기록해서 서버가 여러 대여도 함께 센다.
// DB를 쓸 수 없으면(마이그레이션 전, 일시 장애) 이 서버 안에서만 세는 메모리 방식으로 대신한다.
const memory = new Map<string, number[]>();

export const hashKey = (v: string) => createHash("sha256").update(v.trim().toLowerCase()).digest("hex").slice(0, 32);

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}

/** true = 허용, false = 한도 초과 */
export async function allow(key: string, max: number, windowSeconds: number): Promise<boolean> {
  try {
    const { data, error } = await createAdminClient().rpc("auth_attempt", { p_key: key, p_max: max, p_window_seconds: windowSeconds });
    if (!error && typeof data === "boolean") return data;
  } catch {
    // 아래 메모리 방식으로
  }
  const now = Date.now();
  const recent = (memory.get(key) ?? []).filter((t) => now - t < windowSeconds * 1000);
  if (recent.length >= max) {
    memory.set(key, recent);
    return false;
  }
  memory.set(key, [...recent, now]);
  return true;
}

export async function clear(key: string): Promise<void> {
  memory.delete(key);
  try {
    await createAdminClient().rpc("auth_attempt_clear", { p_key: key });
  } catch {
    // 기록을 못 지워도 로그인에는 영향이 없다
  }
}
