import "server-only";
import { headers } from "next/headers";

// 지금 요청이 들어온 사이트 주소(메일 링크를 만들 때 쓴다). 로컬은 http://localhost:3000, 운영은 https://onwish.live
export async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}
