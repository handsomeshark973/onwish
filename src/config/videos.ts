// 홈 영상 구역과 영상 점검의 기준값. 운영하면서 바꿀 수 있게 한 곳에 모은다.

// "최근 출시"로 보는 기간(일). 출시일(release_basis_date)이 오늘 기준 이 안에 있어야 최근 인기 신작에 든다.
export const RECENT_RELEASE_DAYS = 60;

// 홈 영상 줄마다 보여 주는 최대 개수
export const MAX_UPCOMING_VIDEOS = 8;
export const MAX_RECENT_VIDEOS = 8;

// 영상 종류를 구역에 나누는 규칙
export const UPCOMING_VIDEO_KINDS = ["teaser", "reveal"] as const;
export const RECENT_VIDEO_KINDS = ["launch"] as const;

// 영상 하나를 재확인하는 요청 사이 간격(ms). 유튜브에 한꺼번에 몰리지 않게 한다.
export const VIDEO_CHECK_DELAY_MS = 200;
