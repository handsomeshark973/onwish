"use server";

import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { aiEnabled } from "@/config/ai";
import { FREE_AI_RECOMMENDS_PER_MONTH } from "@/config/limits";
import { getUser } from "@/lib/auth";
import { getContents } from "@/lib/data/contents";
import { getGames } from "@/lib/data/games";
import { toRow } from "@/lib/profile-db";
import { askClaude } from "@/lib/recommend/ai";
import { recommend, type Deps } from "@/lib/recommend/engine";
import { profileSchema, type ProfileInput } from "@/lib/recommend/schema";
import type { RecommendPick, RecommendResult } from "@/lib/recommend/types";
import { isLocale, routing } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type RecommendResponse =
  | { status: "ok"; result: RecommendResult }
  | { status: "login_required" }
  | { status: "invalid"; message: string }
  | { status: "error" };

const kstToday = () => new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);

export async function requestRecommendation(input: unknown, requestId: string, localeInput: string): Promise<RecommendResponse> {
  const locale = isLocale(localeInput) ? localeInput : routing.defaultLocale;
  const user = await getUser();
  if (!user) return { status: "login_required" };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success || !z.uuid().safeParse(requestId).success) {
    // 오류 문구는 번역 키로 돌려주고 화면(RecommendForm)이 현재 언어로 바꿔 보여 준다
    return { status: "invalid", message: parsed.success ? "badRequest" : (parsed.error.issues[0]?.message ?? "checkInput") };
  }
  const profile = parsed.data;

  try {
    // 입력값은 프로필로 저장해 다음 방문 때 채워 준다(본인만 접근: DB 권한 정책)
    const supabase = await createClient();
    const saved = await supabase.from("streamer_profiles").upsert(toRow(user.id, profile));
    if (saved.error) console.error("프로필 저장 실패", saved.error.message);

    const admin = createAdminClient();
    const [contents, games, tr, tf, tl] = await Promise.all([
      getContents(locale), getGames(locale),
      getTranslations({ locale, namespace: "recoServer" }), getTranslations({ locale, namespace: "format" }), getTranslations({ locale, namespace: "taxonomy" }),
    ]);
    const limit = FREE_AI_RECOMMENDS_PER_MONTH;

    const deps: Deps = {
      tr: (k, v) => tr(k, v), tf: (k, v) => tf(k, v), pointLabel: (k) => tl(`appealPoint.${k}`),
      contents, games,
      aiConfigured: aiEnabled(),
      ask: askClaude,
      getQuota: async () => {
        const { data, error } = await admin.rpc("get_ai_quota", { p_user: user.id, p_limit: limit });
        if (error || !data?.[0]) throw new Error("이용량을 확인하지 못했어요");
        const r = data[0] as { used: number; remaining: number; next_reset: string };
        return { used: r.used, remaining: r.remaining, nextReset: r.next_reset };
      },
      begin: async (id) => {
        // cards=0으로 호출하면 요청만 기록하고 차감하지 않는다(이미 차감된 요청이면 already_charged)
        const { data, error } = await admin.rpc("charge_ai_quota", { p_user: user.id, p_request_id: id, p_cards: 0, p_limit: limit });
        if (error) throw new Error(error.message);
        if (data !== "already_charged") return { existing: null };
        const row = await admin.from("ai_requests").select("result").eq("request_id", id).maybeSingle();
        return { existing: (row.data?.result as RecommendResult | null) ?? null };
      },
      recentRequests: async (seconds) => {
        const since = new Date(Date.now() - seconds * 1000).toISOString();
        const { count } = await admin.from("ai_requests").select("request_id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since);
        return count ?? 0;
      },
      todayCostUsd: async () => {
        const { data } = await admin.from("ai_daily_cost").select("cost_usd").eq("day", kstToday()).maybeSingle();
        return Number(data?.cost_usd ?? 0);
      },
      addCostUsd: async (usd) => {
        await admin.rpc("add_ai_cost", { p_cost_usd: usd });
      },
      charge: async (id, cards) => {
        const { data, error } = await admin.rpc("charge_ai_quota", { p_user: user.id, p_request_id: id, p_cards: cards, p_limit: limit });
        if (error) throw new Error(error.message);
        return data;
      },
      saveResult: async (id, result) => {
        await admin.from("ai_requests").update({ result }).eq("request_id", id);
      },
    };
    return { status: "ok", result: await recommend(deps, profile, requestId) };
  } catch (e) {
    console.error("추천 처리 실패", e instanceof Error ? e.message : e);
    return { status: "error" };
  }
}

export type SaveResponse = { status: "saved"; id: string } | { status: "login_required" } | { status: "error" };

// 추천 카드 하나를 내 저장 목록에 넣는다
export async function savePick(pick: RecommendPick, profile: ProfileInput, source: "ai" | "rule"): Promise<SaveResponse> {
  const user = await getUser();
  if (!user) return { status: "login_required" };
  const p = profileSchema.safeParse(profile);
  if (!p.success || JSON.stringify(pick).length > 100_000) return { status: "error" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_recommendations")
    .insert({ user_id: user.id, source, profile_snapshot: p.data, result: pick })
    .select("id")
    .single();
  return error || !data ? { status: "error" } : { status: "saved", id: data.id };
}
