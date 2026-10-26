import type { ProfileInput } from "@/lib/recommend/schema";

/* eslint-disable @typescript-eslint/no-explicit-any */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// DB의 제외 게임 칸은 uuid 목록이라 형식이 맞는 값만 저장한다(예시 데이터의 가짜 ID는 저장하지 않음).
export function toRow(userId: string, p: ProfileInput) {
  return {
    user_id: userId,
    mode: p.mode,
    strengths: p.strengths,
    persona: p.persona,
    uses_cam: p.usesCam,
    audience: p.audience,
    devices: p.devices,
    length: p.length,
    time_slot: p.timeSlot,
    goal: p.goal,
    has_community: p.hasCommunity,
    community_activity: p.communityActivity ?? null,
    allow_rotation: p.allowRotation,
    allow_league: p.allowLeague,
    excluded_game_ids: p.excludedGameIds.filter((id) => UUID.test(id)),
    excluded_genres: p.excludedGenres,
    avoid_horror: p.avoidHorror,
    avoid_motion_sickness: p.avoidMotionSickness,
    avoid_spoilers: p.avoidSpoilers,
    include_trend: p.includeTrend,
    member_count: p.mode === "solo" ? null : (p.members?.length ?? null),
    members: p.mode === "solo" ? [] : (p.members ?? []),
    chemistry_level: p.mode === "solo" ? null : (p.chemistryLevel ?? null),
    desired_structures: p.desiredStructures ?? [],
  };
}

export function fromRow(r: any): Partial<ProfileInput> {
  return {
    mode: r.mode,
    strengths: r.strengths ?? [],
    persona: r.persona ?? "",
    usesCam: r.uses_cam,
    audience: r.audience,
    devices: r.devices ?? ["PC"],
    length: r.length,
    timeSlot: r.time_slot,
    goal: r.goal,
    hasCommunity: r.has_community,
    communityActivity: r.community_activity ?? undefined,
    allowRotation: r.allow_rotation,
    allowLeague: r.allow_league,
    excludedGameIds: r.excluded_game_ids ?? [],
    excludedGenres: r.excluded_genres ?? [],
    avoidHorror: r.avoid_horror,
    avoidMotionSickness: r.avoid_motion_sickness,
    avoidSpoilers: r.avoid_spoilers,
    includeTrend: r.include_trend,
    memberCount: r.member_count ?? undefined,
    members: Array.isArray(r.members) && r.members.length ? r.members : undefined,
    chemistryLevel: r.chemistry_level ?? undefined,
    desiredStructures: r.desired_structures ?? [],
  };
}
