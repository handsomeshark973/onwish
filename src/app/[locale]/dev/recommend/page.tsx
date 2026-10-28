import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { PickCard } from "@/components/recommend/PickCard";
import { RecommendForm } from "@/components/recommend/RecommendForm";
import { SAMPLE_CONTENTS, SAMPLE_GAMES } from "@/data/samples";
import { buildCandidates } from "@/lib/recommend/candidates";
import { ruleBasedPicks } from "@/lib/recommend/rules";
import { profileSchema } from "@/lib/recommend/schema";

export const metadata: Metadata = { title: "추천 화면 확인" };

// 로그인 없이 추천 화면 모양을 보는 개발용 페이지. 배포에서는 열리지 않는다. 값은 모두 가짜 예시다.
export default async function DevRecommend({ params }: PageProps<"/[locale]/dev/recommend">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const profile = profileSchema.parse({
    mode: "small", strengths: ["chemistry"], persona: "", usesCam: true, audience: "m", devices: ["PC"], length: "series",
    timeSlot: "evening", goal: "both", hasCommunity: true, allowRotation: false, allowLeague: false, excludedGameIds: [],
    excludedGenres: [], avoidHorror: false, avoidMotionSickness: false, avoidSpoilers: false, includeTrend: true,
    members: [{ name: "가", note: "진행", devices: ["PC"] }, { name: "나", note: "리액션", devices: ["PC"] }, { name: "다", note: "", devices: ["PC"] }],
    chemistryLevel: "first",
  });
  const { contents, trends } = buildCandidates(profile, SAMPLE_CONTENTS, SAMPLE_GAMES);
  const picks = ruleBasedPicks(profile, contents, trends, (k) => k, (k) => k, (k) => k); // 문구 키가 그대로 보이는 개발용 화면
  return (
    <>
      <h1 className="ow-h1">추천 화면 확인 (예시)</h1>
      <h2 className="ow-h2">결과 카드</h2>
      <div className="ow-grid">
        {picks.map((p, i) => <PickCard key={i} pick={p} profile={profile} source="rule" />)}
      </div>
      <h2 className="ow-h2">입력 폼</h2>
      <RecommendForm games={SAMPLE_GAMES.map((g) => ({ id: g.id, name: g.name }))} initial={null} quota={{ used: 2, remaining: 3, limit: 5, nextReset: "2026-10-31T15:00:00+00:00" }} aiOn customer={{ customerType: null, platforms: [], experience: null }} />
    </>
  );
}
