import { getDisplayUser } from "@/lib/auth";
import { GuestBanner } from "./GuestBanner";

// 게스트일 때만 안내를 보여 준다. 쿠키를 읽으므로 레이아웃에서 Suspense로 감싼다. 표시용이라 권한 판단에는 쓰지 않는다.
export async function GuestNotice() {
  const user = await getDisplayUser();
  return user?.is_anonymous === true ? <GuestBanner /> : null;
}
