import type { GameVideo, VideoStatus } from "@/types/domain";

// 공식 채널 허용 목록 검사. 목록에 있는 채널의 영상만 관리자가 등록하는 즉시 승인된다.
// 채널 ID를 모르거나(null) 목록에 없으면 대기(pending)로 두고, 관리자가 영상을 보고 판단한다.
export function isOfficialChannel(channelId: string | null | undefined, officialChannelIds: readonly string[]): boolean {
  return !!channelId && officialChannelIds.includes(channelId);
}

export function initialVideoStatus(channelId: string | null | undefined, officialChannelIds: readonly string[]): VideoStatus {
  return isOfficialChannel(channelId, officialChannelIds) ? "approved" : "pending";
}

export type VideoLike = Pick<GameVideo, "status">;
