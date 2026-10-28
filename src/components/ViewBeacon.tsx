"use client";

import { useEffect } from "react";
import { trackView } from "@/actions/track";

// 상세 페이지를 열면 한 번 "봤다"고 알린다. 화면에는 아무것도 그리지 않는다.
export function ViewBeacon({ kind, slug }: { kind: "content" | "game"; slug: string }) {
  useEffect(() => {
    void trackView(kind, slug).catch(() => {});
  }, [kind, slug]);
  return null;
}
