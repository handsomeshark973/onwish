"use server";

import { z } from "zod";
import { CUSTOMER_TYPES, EXPERIENCES, PLATFORMS } from "@/config/customerTypes";
import { recordEvent } from "@/lib/customers/events";
import { ensureUser } from "@/lib/guest";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  customerType: z.enum(CUSTOMER_TYPES).nullable(),
  platforms: z.array(z.enum(PLATFORMS)).max(PLATFORMS.length),
  experience: z.enum(EXPERIENCES).nullable(),
});

export type CustomerSaveResponse = { status: "saved" } | { status: "invalid" } | { status: "unavailable" } | { status: "error" };

// "주로 어떻게 방송하세요?" 선택 저장. 모두 선택 입력이라 비워도 된다. 고르는 순간 게스트 세션이 필요하면 만든다.
// 본인이 고른 유형(type_source = self)은 행동 추정이 덮어쓰지 않는다. 선택을 지우면 다음 집계 때 추정으로 돌아간다.
export async function saveCustomerProfile(input: unknown): Promise<CustomerSaveResponse> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { status: "invalid" };
  const ensured = await ensureUser();
  if (!ensured.ok) return { status: "unavailable" };
  const { user, isGuest } = ensured;
  const { customerType, platforms, experience } = parsed.data;

  await recordEvent(user.id, isGuest, "profile_updated", { customerType, platforms, experience }); // 행(row)도 여기서 만들어진다
  const { error } = await createAdminClient()
    .from("customer_profiles")
    .update({
      customer_type: customerType,
      type_source: customerType ? "self" : null,
      solo_inferred: false,
      platforms: [...new Set(platforms)],
      streaming_experience: experience,
    })
    .eq("user_id", user.id);
  if (error) {
    console.error("[customer] 저장 실패", error.message);
    return { status: "error" };
  }
  return { status: "saved" };
}
