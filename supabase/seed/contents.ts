// 컨텐츠 라이브러리 시드 34개 (기획서 9.3). 제목·주 어필·참여 방식·원천·참고한 뼈대는 기획서 표를 그대로 옮겼다.
// 진행 방식은 인터넷 방송의 문법(각자 송출, 채팅·투표·후원 미션, 클립·쇼츠)으로 새로 썼다.
// 기획서에 적히지 않은 값은 이렇게 정했다:
//  - 필요 인원: 혼방 1명, 소수 합방 2~5명, 다수 합방 6~12명(기획서 4장의 인원 구분). 게임 인원이 정해진 컨텐츠는 그 범위로 좁혔다.
//  - 기기: PC. 기획서에 닌텐도 게임(마리오 파티·마리오 카트·마리오 메이커 2)이 적힌 컨텐츠만 SWITCH를 더했다.
//  - 공포 태그: 기획서가 공포라고 적은 컨텐츠만 true, 그 외는 false.
//  - 스포일러 태그: 숨겨진 정보나 결과 공개가 재미의 핵심인 진행 방식(비밀 역할·비밀 미션·정보 비대칭·결과 마지막 공개·블라인드 첫 플레이)만 true, 나머지는 false.
//    진행 방식 설계를 보고 정한 값이며, 게임별 사실을 확인한 것은 아니다.
//  - 멀미 태그: 대화 중심이거나 위에서 내려다보는 화면(2D) 게임으로 적힌 컨텐츠만 false. 1인칭 3D가 섞일 수 있는 컨텐츠는 확인한 적이 없어 null(미확인)로 둔다.
//  - 시청자 규모: 참여 방식에 맞춰 정했다(직접 참가는 소·중, 투표는 소·중·대, 후원·커뮤니티 과제는 중·대).
import type { Content } from "../../src/types/domain";

type Size = "s" | "m" | "l";
type Channel = "chat_vote" | "donation_mission" | "direct_play" | "community_task";
type Seed = {
  slug: string;
  title: string;
  tier: "solo" | "small" | "large";
  range?: [number, number];
  origin: Content["origin"];
  borrowedFrom?: string;
  structures: Content["structures"];
  lifecycle: Content["lifecycle"];
  devices?: ("PC" | "SWITCH")[];
  gamesText?: string;
  linkGames?: string[]; // games.slug
  setup?: string;
  appeal: Content["mainAppeal"];
  points: string[];
  appealText: string;
  howTo: string[];
  multiPov?: string;
  participation: Content["viewerParticipation"];
  channels: Channel[];
  by?: Partial<Record<Size, string>>;
  continuity?: string;
  cautions?: string;
  horror?: boolean;
  spoiler?: boolean;
  noMotion?: boolean;
};

const AUDIENCE: Record<Channel, Size[]> = { chat_vote: ["s", "m", "l"], direct_play: ["s", "m"], donation_mission: ["m", "l"], community_task: ["m", "l"] };

const vote = (what: string): Partial<Record<Size, string>> => ({
  s: `${what}을(를) 채팅에서 바로 받아 방송인이 같이 정해요`,
  m: `${what}을(를) 투표로 정해요`,
  l: `${what}을(를) 집단 투표로 정하고, 결과를 미리 예측해요`,
});
const play = (what: string): Partial<Record<Size, string>> => ({
  s: `${what}에 시청자가 직접 같이 참가해요`,
  m: `사전 신청자 중에서 ${what} 참가자를 골라요`,
});
const task = (what: string): Partial<Record<Size, string>> => ({
  m: `팬카페·방송 게시판에 미리 ${what}을(를) 받아요`,
  l: `${what} 중 추첨하거나 투표로 뽑아 방송에서 다뤄요`,
});
const SEASON = "시즌 장부에 점수를 쌓아 두면 게임이 바뀌어도 이어 갈 수 있어요";
const CLIP = "방송 뒤 클립·쇼츠로 하이라이트를 올려 다음 방송의 떡밥으로 써요";

export const CONTENT_SEEDS: Seed[] = [
  // ───── A. 혼방 ─────
  { slug: "solo-blind-first-play", spoiler: true, title: "신작 블라인드 첫 플레이", tier: "solo", origin: "stream_native", structures: ["talk"], lifecycle: "trend",
    appeal: "audiovisual", points: ["scream_sound"],
    appealText: "처음 보는 장면에 터지는 반응 자체가 볼거리이자 들을거리예요.",
    howTo: ["방송 전에 영상·공략을 일절 보지 않았다고 채팅에 선언해요", "처음 만나는 장면마다 느낀 점을 바로 말로 중계해요", "채팅은 스포일러 금지 룰을 지키고, 어긴 채팅은 방송인이 바로 걸러 내요", "놀란 순간은 클립으로 남겨 쇼츠로 올려요"],
    participation: "enriches", channels: ["chat_vote"], by: { s: "채팅이 스포일러를 막아 주는 지킴이가 돼요", m: "스포 금지 룰을 투표로 정하고 어긴 사람을 가려요", l: "스포 금지 룰을 정하고 채팅 반응 지수를 함께 지켜봐요" },
    continuity: CLIP, cautions: "시청자 스포일러가 가장 큰 위험이에요. 채팅 관리자를 미리 정해 두세요." },
  { slug: "solo-no-death-run", title: "노데스·챌린지 런", tier: "solo", origin: "stream_native", structures: [], lifecycle: "evergreen",
    appeal: "visual", points: ["skill_highlight"],
    appealText: "실력이 드러나는 장면과 성공의 순간이 그대로 클립이 돼요.",
    howTo: ["도전 규칙(노데스, 제한 시간 등)을 방송 시작에 채팅에 알려요", "집중이 필요한 구간에서는 채팅을 잠시 끄고 플레이해요", "위험한 구간 앞에서 멈추고 시청자와 사망 지점을 예측해요", "성공·실패 순간을 클립으로 남겨 쇼츠로 올려요"],
    participation: "enriches", channels: ["chat_vote"], by: vote("사망 지점 예측"), continuity: "도전 기록을 장부에 남기고 다음 방송에서 갱신해요", cautions: "실력 집중 구간에서는 채팅 딜레이 때문에 참여를 넣지 않는 편이 좋아요." },
  { slug: "solo-oneblock-growth", title: "마크 원블록 성장기", tier: "solo", origin: "in_game_creation", structures: [], lifecycle: "series", gamesText: "마인크래프트", setup: "OneBlock 맵",
    appeal: "visual", points: ["growth_visual"],
    appealText: "블록 하나에서 기지까지 눈에 띄게 변하는 성장 과정을 지켜보는 재미예요.",
    howTo: ["첫 회차에 블록 하나만 놓인 맵에서 시작해요", "회차마다 다음 목표를 정하고 달성한 결과를 화면으로 보여 줘요", "회차 첫머리에 지난 회차의 변화를 비교 화면으로 짚어요", "회차 끝에 다음 목표를 투표로 받아요"],
    participation: "enriches", channels: ["chat_vote"], by: vote("다음 목표"), continuity: "회차별 변화 화면을 모아 성장 기록으로 이어 가요" },
  { slug: "solo-minecraft-labor-talk", title: "마크 혼자 노동 + 소통", tier: "solo", origin: "game", structures: ["talk"], lifecycle: "evergreen", gamesText: "마인크래프트",
    appeal: "audio", points: ["talk_radio"],
    appealText: "손은 일하고 입은 시청자와 수다를 떠는 라디오처럼 틀어 두는 방송이에요.",
    howTo: ["단순 반복 작업(광질·농사 등)을 깔아 두고 시작해요", "채팅으로 온 사연과 질문을 읽으며 이야기를 이어 가요", "작업이 한 단락 끝날 때마다 새 주제를 시청자에게 받아요", "방송 끝에 오늘 나온 이야기를 한 줄로 정리해요"],
    participation: "enriches", channels: ["chat_vote"], by: { s: "채팅 사연과 질문이 곧 대화 상대가 돼요", m: "채팅에서 다음 주제를 투표로 정해요", l: "가장 많은 공감을 받은 사연을 골라 이야기해요" }, continuity: "방송 게시판에 사연 코너를 두고 매회 이어 가요" },
  { slug: "solo-roblox-viewer-server", title: "로블록스 시청자 서버", tier: "solo", origin: "game", structures: ["versus"], lifecycle: "evergreen", gamesText: "로블록스 (Murder Mystery 2, Tower of Hell, Dress to Impress, Doors)",
    appeal: "audiovisual", points: ["chemistry"],
    appealText: "시청자와 같은 서버에서 놀며 생기는 장면과 대화가 그대로 방송이 돼요.",
    howTo: ["방송 시작에 서버 입장 방법과 규칙을 알려요", "입장한 시청자와 같은 게임을 돌며 즉석에서 말을 주고받아요", "게임이 끝날 때마다 다음 게임을 정해요", "재미있었던 장면은 클립으로 남겨요"],
    participation: "required", channels: ["direct_play"], by: play("서버 플레이"), cautions: "시청자가 직접 참가해야 방송이 성립해요. 참가자가 모이지 않는 시간대는 피하세요." },
  { slug: "solo-chat-integrated-play", title: "채팅 연동 플레이 (Crowd Control 류)", tier: "solo", origin: "stream_native", structures: [], lifecycle: "evergreen", gamesText: "채팅 연동 도구를 지원하는 게임",
    appeal: "audiovisual", points: ["scream_sound"],
    appealText: "시청자가 던지는 방해에 당하는 방송인의 리액션이 볼거리예요.",
    howTo: ["채팅 연동 도구를 켜고 어떤 방해가 가능한지 채팅에 알려요", "시청자가 고른 방해에 방송인이 즉석에서 반응해요", "방해가 쌓이는 흐름을 보며 방송인이 규칙을 하나씩 더하거나 풀어요", "가장 크게 당한 순간을 클립으로 남겨요"],
    participation: "required", channels: ["chat_vote"], by: { s: "채팅이 곧 방해 버튼이에요", m: "채팅 투표로 방해를 골라요", l: "집단 투표로 가장 센 방해 하나를 정해요" }, cautions: "연동 도구가 필요해요. 방해 수위는 방송 전에 규칙으로 정해 두세요." },
  { slug: "solo-geoguessr-chat", title: "GeoGuessr 채팅 대결", tier: "solo", origin: "game", structures: ["talk"], lifecycle: "evergreen", gamesText: "GeoGuessr",
    appeal: "audio", points: ["talk_radio"],
    appealText: "추리하는 과정을 말로 풀어내는 재미예요.",
    howTo: ["한 문제를 시작하며 방송인이 단서를 소리 내어 말해요", "채팅은 각자 정답을 정해 두고 다수결로 한 곳을 골라요", "방송인과 채팅의 답을 비교하며 누가 가까웠는지 확인해요", "라운드마다 점수를 합산해 시청자 팀과 방송인이 승부해요"],
    participation: "required", channels: ["chat_vote"], by: { s: "채팅의 다수결이 곧 시청자 팀의 답이에요", m: "투표로 시청자 팀의 답을 정해요", l: "집단 투표 결과를 승부 예측과 함께 걸어요" } },
  { slug: "solo-off-work-condition", noMotion: true, title: "퇴근 조건 방송", tier: "solo", origin: "variety_adapted", borrowedFrom: "1박2일 (한국)", structures: ["talk"], lifecycle: "evergreen",
    appeal: "audio", points: ["talk_radio"],
    appealText: "\"오늘 퇴근할 수 있을까?\"를 두고 벌이는 하소연과 채팅 공방이 재미예요.",
    howTo: ["방송 시작에 퇴근 조건(목표 시청자 수, 후원 미션 등)을 정해서 공개해요", "조건을 채우는 동안 하소연과 잡담으로 이야기를 이어 가요", "채팅은 조건을 깎아 주거나 올리자고 공방을 벌여요", "조건이 채워지면 퇴근하는 마무리를 보여 줘요"],
    participation: "enriches", channels: ["donation_mission", "chat_vote"], by: { m: "후원 미션이나 투표로 퇴근 조건을 바꿔요", l: "집단 투표와 후원 미션으로 오늘의 조건을 정해요" } },
  { slug: "solo-saying-verification", noMotion: true, title: "설 검증", tier: "solo", origin: "variety_adapted", borrowedFrom: "수요일의 다운타운 (일본)", structures: ["talk"], lifecycle: "evergreen",
    appeal: "audio", points: ["talk_radio"],
    appealText: "가설을 놓고 떠드는 과정이 중심이고, 판정은 짧은 시각 포인트로 보여 줘요.",
    howTo: ["게시판에 모인 \"설\" 중에서 오늘의 가설을 골라요", "가설이 맞을지 틀릴지를 이야기하며 시청자와 의견을 주고받아요", "직접 해볼 수 있는 것은 짧게 시연해서 판정해요", "판정 결과를 정리하고 다음 가설을 받아요"],
    participation: "enriches", channels: ["community_task"], by: task("검증하고 싶은 설"), cautions: "커뮤니티가 있어야 가설이 모여요." },
  { slug: "solo-viewer-made-course", spoiler: true, title: "시청자 제작 코스·맵 플레이", tier: "solo", origin: "in_game_creation", structures: [], lifecycle: "evergreen", devices: ["PC", "SWITCH"], gamesText: "마리오 메이커 2, 마인크래프트 맵, 로블록스 오비, Escape Simulator",
    appeal: "visual", points: ["creation_result"],
    appealText: "시청자가 만든 작품이 처음 공개되는 순간이 하이라이트예요.",
    howTo: ["팬카페에서 작품 공모를 받고 마감일에 제출작을 모아요", "방송에서 제작자 별명을 호명하고 작품을 처음 플레이해요", "플레이하며 느낀 점을 바로 말하고, 제작자 채팅에 답해요", "마지막에 시청자 투표로 오늘의 작품을 뽑아요"],
    participation: "required", channels: ["community_task"], by: task("작품"), continuity: "공모전 시즌으로 이어 가요", cautions: "작품이 모이지 않으면 방송이 성립하지 않아요. 마감 전에 홍보하세요." },
  { slug: "solo-viewer-settlers", noMotion: true, title: "시청자 이름 정착민", tier: "solo", origin: "stream_native", structures: [], lifecycle: "series", gamesText: "림월드, 심즈, 프로젝트 좀보이드",
    appeal: "audio", points: ["talk_radio"],
    appealText: "시청자 이름을 붙인 캐릭터의 운명을 두고 이야기하는 재미예요.",
    howTo: ["게시판에서 신청을 받아 시청자 별명을 가진 캐릭터를 만들어요", "캐릭터에게 일어난 일을 회차마다 이야기로 풀어 줘요", "중요한 갈림길은 해당 캐릭터의 주인(시청자)에게 먼저 물어봐요", "회차 끝에 캐릭터들의 근황을 한 줄씩 정리해요"],
    participation: "required", channels: ["community_task"], by: task("캐릭터 신청"), continuity: "캐릭터 근황을 게시판에 올려 방송 사이의 공백을 채워요" },

  // ───── A2. 혼방 · 게임 없이 하는 대화형 ─────
  { slug: "solo-ai-issue-talk", title: "AI와 오늘의 이슈 이야기", tier: "solo", origin: "stream_native", structures: ["talk"], lifecycle: "evergreen", noMotion: true,
    appeal: "audio", points: ["talk_radio", "verbal_mind_game"],
    appealText: "AI에게 묻고 반박하며, 이슈에 대한 내 생각을 말로 풀어내는 토크가 중심이에요.",
    howTo: ["방송 시작에 오늘 다룰 이슈 하나를 정해 소개해요(시청자 제안도 받아요)", "AI에게 질문을 던지고 답을 소리 내어 읽으며 동의하거나 반박해요", "AI가 한 말이 사실인지 채팅과 함께 찾아보고 틀린 부분은 바로잡아요", "마지막에 오늘의 결론을 한 줄로 정리하고 채팅 의견을 소개해요"],
    participation: "enriches", channels: ["chat_vote"], by: { s: "채팅이 AI에게 던질 질문을 바로 제안해요", m: "다음에 AI에게 물을 질문을 투표로 정해요", l: "찬반 투표로 오늘 이슈에 대한 시청자 입장을 모아요" },
    continuity: "매일 같은 시간에 ‘오늘의 이슈’ 코너로 이어 가요",
    cautions: "AI의 답은 틀릴 수 있어요. 사실 여부는 방송에서 같이 확인하세요. 정치·사회 이슈는 특정 개인이나 집단을 비방하지 않도록 방송 규칙을 정해 두세요." },
  { slug: "solo-character-ai-chat", title: "캐릭터 AI 챗과 대화", tier: "solo", origin: "stream_native", structures: ["talk"], lifecycle: "evergreen", noMotion: true,
    appeal: "audio", points: ["talk_radio", "chemistry"],
    appealText: "캐릭터와 실시간으로 티키타카를 주고받는 모습 자체가 컨텐츠예요.",
    howTo: ["오늘 대화할 캐릭터와 상황 설정(관계, 배경)을 방송 시작에 공개해요", "캐릭터에게 말을 걸고, 돌아온 답을 연기하듯 읽으며 대화를 이어 가요", "채팅이 제안한 말이나 상황을 캐릭터에게 던져 반응을 지켜봐요", "대화가 끝나면 오늘의 명장면을 클립으로 남겨요"],
    participation: "enriches", channels: ["chat_vote"], by: { s: "채팅이 캐릭터에게 할 말을 바로 제안해요", m: "다음 대사나 상황 설정을 투표로 정해요", l: "집단 투표로 오늘의 상황 설정을 골라요" },
    continuity: "캐릭터와의 관계를 기록해 두고 회차마다 이어 가요",
    cautions: "AI 캐릭터와의 대화에서 실명·연락처 같은 개인정보는 말하지 마세요. 이용하는 서비스의 약관과 연령 제한을 확인하세요." },
  { slug: "solo-namuwiki-reading", title: "나무위키 보며 수다", tier: "solo", origin: "stream_native", structures: ["talk"], lifecycle: "evergreen", noMotion: true,
    appeal: "audio", points: ["talk_radio"],
    appealText: "문서를 읽다가 꼬리에 꼬리를 무는 잡담이 라디오처럼 이어져요.",
    howTo: ["시청자가 던진 주제나 오늘의 화제로 문서를 하나 골라요", "문서를 훑으며 흥미로운 대목을 소리 내어 읽고 덧붙여 이야기해요", "더 궁금해진 문서로 링크를 타고 넘어가요(다음에 열 문서는 채팅이 골라요)", "방송 끝에 오늘 가장 놀라웠던 내용을 정리해요"],
    participation: "enriches", channels: ["chat_vote"], by: { s: "채팅이 다음에 열 문서를 바로 제안해요", m: "다음에 열 문서를 투표로 정해요", l: "집단 투표로 오늘의 문서 여행 경로를 정해요" },
    continuity: "‘오늘 새로 알게 된 것’을 게시판에 모아 두고 이어 가요",
    cautions: "누구나 고칠 수 있는 위키라 내용이 틀리거나 한쪽으로 치우쳤을 수 있어요. 사실처럼 말하기 전에 출처를 함께 확인하세요. 실존 인물에 대한 추측성·비방성 내용은 읽지 않도록 주의하세요." },
  { slug: "solo-viewer-stories", title: "시청자 사연 읽고 상담", tier: "solo", origin: "stream_native", structures: ["talk"], lifecycle: "evergreen", noMotion: true,
    appeal: "audio", points: ["talk_radio"],
    appealText: "시청자의 사연을 읽고 같이 고민하는 라디오 같은 시간이에요.",
    howTo: ["방송 전에 게시판에서 사연을 모아 두고, 오늘 읽을 사연을 골라요", "사연을 읽고 내 생각과 경험을 덧붙여 이야기해요", "채팅에서 모인 의견을 소개하고 함께 정리해요", "사연을 보낸 시청자에게 방송에서 짧게 답을 전해요"],
    participation: "required", channels: ["community_task"], by: { m: "팬카페·방송 게시판에 미리 사연을 받아요", l: "받은 사연 중 추첨하거나 투표로 뽑아 방송에서 다뤄요" },
    continuity: "사연 코너를 고정 시간으로 만들어 방송 사이의 공백을 채워요",
    cautions: "사연 속 이름·학교·연락처 같은 개인정보는 가리고 읽으세요. 건강·법률처럼 전문적인 문제는 전문가나 기관에 문의하라고 안내해 주세요." },
  { slug: "solo-balance-worldcup", title: "밸런스 게임·이상형 월드컵", tier: "solo", origin: "stream_native", structures: ["talk"], lifecycle: "evergreen", noMotion: true,
    appeal: "audio", points: ["talk_radio", "verbal_mind_game"],
    appealText: "고르고 이유를 설명하며 채팅과 옥신각신하는 재미가 이어져요.",
    howTo: ["오늘의 주제와 대진표(보기 목록)를 방송 시작에 공개해요", "한 라운드마다 두 보기 중 내 선택과 이유를 말해요", "채팅이 투표하고, 내 선택과 다른 결과가 나오면 서로 설득해요", "결승까지 올라간 최종 우승 보기를 발표하고 마무리해요"],
    participation: "required", channels: ["chat_vote"], by: { s: "채팅이 매 라운드 보기를 골라 줘요", m: "라운드마다 투표로 승자를 정해요", l: "집단 투표로 결승 진출자를 정하고 우승자를 예측해요" },
    continuity: "‘역대 우승 보기’를 모아 시즌 기록으로 이어 가요" },
  { slug: "solo-community-meme-watch", title: "커뮤니티 인기글·밈 같이 보기", tier: "solo", origin: "stream_native", structures: ["talk"], lifecycle: "evergreen", noMotion: true,
    appeal: "audio", points: ["talk_radio"],
    appealText: "웃긴 글과 밈을 함께 보며 터지는 리액션과 수다가 중심이에요.",
    howTo: ["방송 전에 보여 줄 글·밈을 골라 두고, 시청자 추천도 받아요", "한 건씩 화면에 띄우고 내용을 읽으며 바로 반응해요", "채팅이 점수를 매기거나 더 보고 싶은 글을 골라요", "가장 반응이 컸던 건을 클립으로 남겨요"],
    participation: "enriches", channels: ["chat_vote"], by: { s: "채팅이 다음에 볼 글을 바로 추천해요", m: "다음에 볼 글을 투표로 정해요", l: "집단 투표로 오늘의 베스트 글을 뽑아요" },
    cautions: "출처가 불분명하거나 개인정보가 드러난 게시물은 피하세요. 저작권이 있는 이미지·영상은 플랫폼 규정을 확인하고 보여 주세요." },
  { slug: "solo-ai-creation-live", title: "AI로 그림·노래 만들기 라이브", tier: "solo", origin: "stream_native", structures: ["talk"], lifecycle: "evergreen", noMotion: true,
    appeal: "visual", points: ["creation_result"],
    appealText: "시청자가 낸 주제가 AI를 거쳐 결과물로 공개되는 순간이 하이라이트예요.",
    howTo: ["채팅이나 게시판에서 오늘 만들 주제를 받아요", "주제를 AI에 입력하고 결과가 나오는 과정을 함께 기다려요", "결과를 공개하며 첫인상을 바로 이야기해요", "여러 결과 중 최고작을 투표로 뽑고 다음 주제를 받아요"],
    participation: "enriches", channels: ["chat_vote"], by: { s: "채팅이 AI에 넣을 주제를 바로 제안해요", m: "다음에 만들 주제를 투표로 정해요", l: "집단 투표로 오늘의 최고작을 뽑아요" },
    continuity: "모은 결과물로 ‘이달의 작품전’을 열어 이어 가요",
    cautions: "AI가 만든 결과물의 저작권과 상업적 이용 규정은 서비스마다 달라요. 실존 인물을 닮게 만들거나 비방하는 결과물은 피하세요." },
  { slug: "solo-open-qa", title: "시청자 질문에 답하는 Q&A", tier: "solo", origin: "stream_native", structures: ["talk"], lifecycle: "evergreen", noMotion: true,
    appeal: "audio", points: ["talk_radio"],
    appealText: "채팅과 게시판에 올라온 질문에 바로 답하며 이어 가는 대화예요.",
    howTo: ["방송 전에 게시판에서 질문을 모아 두고, 방송 중에는 채팅 질문도 받아요", "질문을 하나씩 읽고 솔직하게 답해요", "답하기 어려운 질문은 건너뛰는 기준을 미리 공지해요", "방송 끝에 오늘 가장 많이 나온 질문 유형을 정리해요"],
    participation: "required", channels: ["chat_vote", "community_task"], by: { s: "채팅 질문에 바로 답해요", m: "게시판에 미리 받은 질문을 투표로 골라 답해요", l: "좋아요가 많은 질문부터 골라 답해요" },
    continuity: "자주 나오는 질문을 모아 ‘자주 묻는 질문’으로 정리해 두어요",
    cautions: "사생활이나 개인정보를 묻는 질문은 답하지 않아도 돼요. 답하지 않는 기준을 미리 정해 두세요." },

  // ───── B. 소수 합방 ─────
  { slug: "small-minecraft-boss-raid", title: "마크 장비 강화·보스 레이드", tier: "small", origin: "game", structures: ["coop"], lifecycle: "series", gamesText: "마인크래프트", setup: "보스 추가 모드팩",
    appeal: "visual", points: ["growth_visual", "combat_action"],
    appealText: "장비가 강해지고 보스가 쓰러지는 장면이 한눈에 보여요.",
    howTo: ["보스 추가 모드팩이 같은 서버에 모두 접속해요", "회차마다 장비를 강화하는 파밍 구간과 보스 도전 구간을 나눠요", "보스전에서는 멤버별 역할(딜, 방어, 보조)을 정해 각자 송출해요", "쓰러뜨린 순간은 클립으로 남겨 쇼츠로 올려요"],
    multiPov: "장비 강화 상태와 체력은 멤버 각자의 화면에서만 보여서, 서로 말로 알려 줘야 작전이 맞아요.",
    participation: "enriches", channels: ["chat_vote"], by: vote("공략 순서"), continuity: SEASON },
  { slug: "small-minecraft-labor", title: "마크 광질·낚시·농사 노동 합방", tier: "small", origin: "game", structures: ["coop"], lifecycle: "evergreen", gamesText: "마인크래프트", setup: "바닐라 또는 Simple Voice Chat",
    appeal: "audio", points: ["talk_radio", "chemistry"],
    appealText: "단순 노동이 배경으로 깔리고 멤버들의 케미 대화가 주인공이에요.",
    howTo: ["각자 맡은 작업(광질·낚시·농사)을 정하고 같은 서버에서 시작해요", "작업하는 동안 근황·고민·잡담을 이어 가요", "채팅에서 받은 주제를 던져 대화가 끊기지 않게 해요", "작업량이 쌓인 결과를 마지막에 같이 확인해요"],
    multiPov: "멤버 각자의 방송에서 같은 대화를 다른 화면(작업)으로 들을 수 있어 시청자가 편한 시점을 골라 틀어 둘 수 있어요.",
    participation: "enriches", channels: ["chat_vote"], by: { s: "채팅에서 던진 주제로 바로 이야기해요", m: "다음 대화 주제를 투표로 정해요", l: "가장 많은 공감을 받은 주제를 골라 다뤄요" } },
  { slug: "small-asymmetric-coop", spoiler: true, title: "정보 비대칭 협동", tier: "small", range: [2, 3], origin: "game", structures: ["coop"], lifecycle: "evergreen", gamesText: "BOMBANANA!, We Were Here, Keep Talking and Nobody Explodes", linkGames: ["bombanana"],
    appeal: "audio", points: ["forced_comm", "chemistry"],
    appealText: "말을 해야만 풀리는 구조라서 소통 자체가 컨텐츠예요.",
    howTo: ["멤버마다 서로 다른 정보를 갖고 시작한다는 규칙을 설명해요", "각자 송출하며 자신이 보는 것만 말로 전달해 문제를 풀어 가요", "막히는 순간에는 누가 어떤 정보를 갖고 있는지 소리 내어 정리해요", "클리어하거나 실패한 뒤 서로의 시점에서 무엇이 보였는지 되짚어요"],
    multiPov: "멤버가 각자 다른 정보를 보고 있어 시청자는 한 사람의 시점만 알 수 있어요. 다른 멤버 방송으로 옮겨 가야 퍼즐이 맞춰져요.",
    participation: "enriches", channels: ["chat_vote"], by: vote("다음 시도의 역할 배분"), cautions: "시청자가 매뉴얼을 해설해 주면 채팅 딜레이 때문에 공정성이 깨질 수 있어요." },
  { slug: "small-proximity-voice-horror", title: "근접 보이스 공포", tier: "small", range: [2, 4], origin: "game", structures: ["coop"], lifecycle: "evergreen", gamesText: "Lethal Company, R.E.P.O., Content Warning, Phasmophobia, Escape From Playtime", linkGames: ["escape-from-playtime"], horror: true,
    appeal: "audiovisual", points: ["scream_sound"],
    appealText: "비명과 실종이 멤버 각자의 시점에서 다르게 잡혀요.",
    howTo: ["근접 보이스를 켜고 각자 송출을 시작해요", "탐험 중 흩어졌다가 한 명이 사라지는 순간을 각자의 화면으로 보여 줘요", "살아남은 멤버가 상황을 말로 중계하며 다시 모여요", "가장 크게 놀란 순간을 클립으로 남겨요"],
    multiPov: "같은 사건이 멤버마다 다른 소리와 장면으로 들려서, 시청자는 여러 방송을 오가며 퍼즐을 맞춰요.",
    participation: "enriches", channels: ["chat_vote"], by: vote("생존자"), cautions: "공포 요소가 있어요. 공포를 피하는 방송인에게는 추천하지 않아요." },
  { slug: "small-physics-coop-conflict", title: "물리 협동 갈등", tier: "small", origin: "game", structures: ["coop"], lifecycle: "evergreen", gamesText: "Chained Together, PEAK, Overcooked 2",
    appeal: "audio", points: ["chemistry"],
    appealText: "남 탓과 사과가 오가는 티키타카가 중심이고, 추락 같은 장면은 짧은 시각 포인트예요.",
    howTo: ["같은 코스를 함께 올라가는 규칙을 알려요", "실수가 나올 때마다 누구 탓인지 즉석에서 말싸움을 벌여요", "코스가 끝나면 채팅이 \"오늘의 범인\"을 투표로 뽑아요", "추락 장면은 클립으로 남겨 쇼츠로 올려요"],
    multiPov: "같은 사건이 멤버마다 다르게 보여서 서로 다른 변명이 나와요.",
    participation: "enriches", channels: ["chat_vote"], by: vote("오늘의 범인") },
  { slug: "small-competitive-party", title: "경쟁 파티", tier: "small", origin: "game", structures: ["versus"], lifecycle: "evergreen", devices: ["PC", "SWITCH"], gamesText: "마리오 파티, 마리오 카트, Liar's Bar",
    appeal: "audiovisual", points: ["chemistry", "verbal_mind_game"],
    appealText: "막판 역전 화면과 배신 멘트가 한꺼번에 터져요.",
    howTo: ["승패와 벌칙 규칙을 방송 시작에 정해요", "라운드마다 서로를 견제하며 말로 동맹과 배신을 주고받아요", "역전이 나오는 순간을 각자의 화면과 반응으로 보여 줘요", "마지막에 순위와 벌칙을 정리해요"],
    multiPov: "멤버 각자의 시점에서만 보이는 정보가 달라 서로 속고 속이는 말이 오가요.",
    participation: "enriches", channels: ["chat_vote"], by: vote("우승자 승부 예측") },
  { slug: "small-minecraft-manhunt", title: "마크 맨헌트", tier: "small", origin: "in_game_creation", structures: ["versus"], lifecycle: "evergreen", gamesText: "마인크래프트", setup: "맨헌트 플러그인",
    appeal: "visual", points: ["combat_action", "skill_highlight"],
    appealText: "쫓고 쫓기는 추격과 아슬아슬한 탈출 장면이 중심이에요.",
    howTo: ["도망자와 추격자 진영을 나누고 맨헌트 플러그인을 켜요", "추격자는 위치 추적 도구로 도망자를 쫓고 각자 송출해요", "도망자 시점과 추격자 시점의 장면을 번갈아 중계해요", "결판이 나는 순간을 클립으로 남겨요"],
    multiPov: "도망자와 추격자는 서로의 위치를 다르게 알고 있어, 시청자는 양쪽 방송을 오가며 긴장감을 느껴요.",
    participation: "enriches", channels: ["chat_vote"], by: vote("응원할 진영") },
  { slug: "small-simultaneous-task-contest", spoiler: true, title: "동시 송출 과제전", tier: "small", origin: "variety_adapted", borrowedFrom: "Taskmaster (영국)", structures: ["versus"], lifecycle: "evergreen",
    appeal: "audiovisual", points: ["skill_highlight", "chemistry"],
    appealText: "과제를 하는 동안에는 시각적인 재미, 합방 심사 때는 변명과 디스가 오가는 청각적인 재미가 있어요.",
    howTo: ["같은 과제를 멤버 모두에게 주고 같은 시간에 각자 송출로 수행해요", "수행 결과를 모은 뒤 합방으로 모여 서로의 결과를 심사해요", "심사에서 서로의 변명과 디스를 주고받아요", "각 방송의 시청자 투표를 합산해 최종 순위를 정해요"],
    multiPov: "과제는 각자 방송에서만 보이고, 합방 심사에서 비로소 다른 멤버의 결과를 공개해요.",
    participation: "required", channels: ["chat_vote"], by: { s: "채팅이 심사위원으로 점수를 줘요", m: "각 방송의 투표를 합산해요", l: "각 방송의 집단 투표를 합산해 순위를 정해요" } },
  { slug: "small-multi-pov-secret-mission", spoiler: true, noMotion: true, title: "멀티 시점 비밀 미션", tier: "small", origin: "variety_adapted", borrowedFrom: "런닝맨 스파이 (한국)", structures: ["mind_game"], lifecycle: "evergreen",
    appeal: "audio", points: ["verbal_mind_game"],
    appealText: "상대를 말로 유도하는 화술과 들킬 듯한 긴장이 중심이에요.",
    howTo: ["후원으로 발급된 비밀 미션이 멤버별 방송에서만 공개돼요", "미션을 들키지 않고 수행하도록 자연스럽게 대화를 이끌어요", "다른 멤버는 누가 미션을 받았는지 추리해 지목해요", "마지막에 각자의 미션을 공개하고 성공 여부를 가려요"],
    multiPov: "비밀 미션은 해당 멤버의 방송에서만 보여서, 시청자는 \"다른 멤버는 모르는 정보\"를 안 채로 지켜봐요.",
    participation: "required", channels: ["donation_mission"], by: { m: "후원으로 멤버에게 미션을 발급해요", l: "후원 미션과 집단 투표로 미션을 정해요" }, cautions: "후원 미션이 있어야 성립해요. 미션 수위는 방송 전에 정해 두세요." },
  { slug: "small-donation-roulette", noMotion: true, title: "후원 룰렛 복불복", tier: "small", origin: "variety_adapted", borrowedFrom: "1박2일 (한국)", structures: ["talk"], lifecycle: "evergreen",
    appeal: "audio", points: ["talk_radio", "chemistry"],
    appealText: "벌칙 앞에서 터지는 억울함과 몰아가기가 재미예요.",
    howTo: ["룰렛 칸(벌칙·혜택)을 방송 시작에 공개해요", "후원이 들어오면 룰렛을 돌려 대상 멤버를 정해요", "당첨된 멤버의 반응과 나머지 멤버의 몰아가기를 이어 가요", "방송 끝에 벌칙을 수행하고 결과를 정리해요"],
    multiPov: "룰렛 결과를 각자 방송에서 먼저 알려 주는 순서를 달리해, 시청자가 다른 방송의 반응을 궁금해하게 해요.",
    participation: "required", channels: ["donation_mission"], by: { m: "후원으로 룰렛을 돌려요", l: "후원 룰렛과 집단 투표로 벌칙을 정해요" } },
  { slug: "small-fandom-battle", noMotion: true, title: "팬덤 대항전", tier: "small", origin: "stream_native", structures: ["versus"], lifecycle: "evergreen",
    appeal: "audio", points: ["verbal_mind_game"],
    appealText: "팬덤의 자존심을 건 입씨름이 중심이에요.",
    howTo: ["팬카페에서 사전 과제(자랑거리·질문)를 받아요", "방송에서 각 팬덤이 모은 과제로 입씨름을 벌여요", "멤버는 자기 팬덤을 대표해 주장하고 상대를 반박해요", "마지막에 시청자 투표로 승자를 가려요"],
    multiPov: "각 멤버의 방송은 자기 팬덤의 응원이 모이는 곳이라 같은 대결이 방송마다 다른 분위기로 보여요.",
    participation: "required", channels: ["community_task"], by: task("팬덤 과제"), cautions: "커뮤니티가 있어야 성립해요. 지나친 비방이 되지 않도록 규칙을 정해 두세요." },

  // ───── C. 다수 합방 ─────
  { slug: "large-small-game-league", spoiler: true, title: "소수 게임 리그화", tier: "large", range: [6, 12], origin: "stream_native", structures: ["versus"], lifecycle: "evergreen", gamesText: "BOMBANANA! 팀 기록전 등", linkGames: ["bombanana"],
    appeal: "audiovisual", points: ["skill_highlight", "scream_sound"],
    appealText: "팀마다 다른 소통 스타일을 비교하는 재미와 클리어 순간이 함께 있어요.",
    howTo: ["인원이 정해진 게임을 팀 단위로 나눠 같은 조건으로 기록을 겨뤄요", "팀마다 각자 송출하며 클리어 기록을 남겨요", "다른 팀의 방송은 서로 못 보게 하고 마지막에 기록을 공개해요", "팀별 소통 스타일의 차이를 하이라이트로 비교해요"],
    multiPov: "같은 판을 팀마다 다른 방송에서 보여 주기 때문에, 시청자는 응원하는 팀의 시점으로 모여요.",
    participation: "enriches", channels: ["chat_vote"], by: vote("응원할 팀과 기록 예측"), cautions: "여러 팀이 필요해요. 게임이 정원이 정해진 경우 팀 인원이 정확히 맞아야 해요." },
  { slug: "large-minecraft-life-server", spoiler: true, title: "마크 목숨 제한 서바이벌 서버", tier: "large", range: [6, 12], origin: "in_game_creation", borrowedFrom: "Life Series (Grian)", structures: ["mind_game", "versus"], lifecycle: "evergreen", gamesText: "마인크래프트", setup: "시즌 룰 플러그인·데이터팩",
    appeal: "audiovisual", points: ["verbal_mind_game", "combat_action"],
    appealText: "동맹을 짜는 협상 대화와 교전이 번갈아 나와요.",
    howTo: ["참가자마다 목숨 수를 정하고 시즌 룰을 적용한 서버를 열어요", "각자 송출하며 동맹을 맺고 깨는 협상을 말로 이어 가요", "목숨이 걸린 교전은 해당 참가자 시점으로 중계해요", "탈락자 발생 때마다 남은 판세를 정리해요"],
    multiPov: "동맹 대화는 당사자 방송에서만 들려서, 시청자가 여러 방송을 오가며 판세를 맞춰 가요.",
    participation: "enriches", channels: ["chat_vote"], by: vote("탈락 예측"), continuity: SEASON },
  { slug: "large-minecraft-team-shuffle-league", title: "마크 팀 셔플 미니게임 리그", tier: "large", range: [6, 12], origin: "in_game_creation", borrowedFrom: "Minecraft Championship", structures: ["versus"], lifecycle: "evergreen", gamesText: "마인크래프트",
    appeal: "visual", points: ["skill_highlight"],
    appealText: "화려한 미니게임 플레이와 순위 변동이 한눈에 보여요.",
    howTo: ["종목마다 팀을 새로 섞어 구성해요", "종목이 끝날 때마다 누적 순위표를 공개해요", "각 종목의 하이라이트를 각자 방송에서 번갈아 중계해요", "마지막 종목 전에 순위를 정리해 결승 구도를 잡아요"],
    multiPov: "종목마다 팀이 바뀌어 시청자는 응원하는 멤버의 방송을 따라다니며 장면을 봐요.",
    participation: "enriches", channels: ["chat_vote"], by: vote("다음 종목") },
  { slug: "large-minecraft-mass-build", spoiler: true, title: "마크 대규모 공동 건축", tier: "large", range: [6, 12], origin: "in_game_creation", structures: ["coop"], lifecycle: "evergreen", gamesText: "마인크래프트",
    appeal: "visual", points: ["creation_result"],
    appealText: "수십 명이 만든 결과물이 공개되는 순간이 하이라이트예요.",
    howTo: ["건축 주제와 구역을 나눠 참가자에게 배정해요", "각자 송출하며 맡은 구역을 만들고 진행 상황을 공유해요", "완성하면 한 방송에서 모두 모여 전체 결과물을 처음 공개해요", "시청자 심사단의 평가를 받고 마무리해요"],
    multiPov: "구역마다 만드는 과정이 각자 방송에 나뉘어 있고, 전체 모습은 마지막 공개 때 한꺼번에 드러나요.",
    participation: "enriches", channels: ["chat_vote"], by: { s: "시청자 몇 명이 심사단이 돼요", m: "시청자 투표로 심사해요", l: "집단 투표로 심사해요" } },
  { slug: "large-minecraft-mass-labor-server", title: "마크 대규모 노동 서버 (마을 경제 등)", tier: "large", range: [6, 12], origin: "in_game_creation", structures: ["coop"], lifecycle: "evergreen", gamesText: "마인크래프트",
    appeal: "audio", points: ["talk_radio"],
    appealText: "여기저기서 벌어지는 잡담과 거래가 라디오처럼 이어져요.",
    howTo: ["마을 경제 규칙(직업, 거래 방식)을 정해 서버를 열어요", "참가자가 각자 송출하며 일하고 서로 거래해요", "시청자는 마음에 드는 방송을 옮겨 다니며 들어요", "하루가 끝나면 마을 경제 상황을 정리해요"],
    multiPov: "마을 곳곳의 대화가 각자 방송에서 따로 들려서, 시청자가 방송을 옮겨 다니며 이야기를 모아요.",
    participation: "enriches", channels: [], by: { s: "방송을 옮겨 다니며 보고 듣는 것이 곧 참여예요" }, cautions: "참여를 채팅으로 받지 않고 시청 방식으로 넣은 컨텐츠예요." },
  { slug: "large-roleplay-server", title: "롤플레이 서버 (GTA5, 마크)", tier: "large", range: [6, 12], origin: "in_game_creation", borrowedFrom: "NoPixel (미국), ストグラ (일본)", structures: ["talk"], lifecycle: "evergreen", gamesText: "GTA5, 마인크래프트",
    appeal: "audio", points: ["talk_radio", "chemistry"],
    appealText: "캐릭터 연기와 관계를 주고받는 대화가 중심이에요.",
    howTo: ["서버 세계관과 규칙을 공지하고 참가자마다 캐릭터를 정해요", "각자 송출하며 자기 캐릭터로 살아가며 대화해요", "사건이 생기면 관련 캐릭터의 방송에서 그 장면을 보여 줘요", "시청자는 궁금한 캐릭터의 방송을 골라 따라가요"],
    multiPov: "한 사건이 여러 캐릭터의 방송에서 서로 다른 관점으로 나와서, 시청자가 여러 방송을 보며 전체를 맞춰요.",
    participation: "enriches", channels: [], by: { s: "다른 시점을 찾아 보는 것이 곧 참여예요" } },
  { slug: "large-social-deduction", spoiler: true, noMotion: true, title: "소셜 디덕션", tier: "large", range: [6, 12], origin: "game", structures: ["mind_game"], lifecycle: "evergreen", gamesText: "Goose Goose Duck, Among Us",
    appeal: "audio", points: ["verbal_mind_game"],
    appealText: "변론과 몰이, 거짓말이 오가는 화술 대결이에요.",
    howTo: ["역할이 비밀로 배정되고 각자 송출을 시작해요", "회의 시간에 서로를 의심하고 변론하며 의견을 모아요", "투표 직전에 가장 의심스러운 참가자를 지목해요", "한 판이 끝나면 숨겨진 역할을 공개하고 복기해요"],
    multiPov: "각자 비밀 역할을 알고 있으니, 시청자는 방송마다 다른 정보를 갖고 거짓말을 지켜봐요.",
    participation: "enriches", channels: ["chat_vote"], by: vote("범인 예측"), cautions: "시청자가 다른 방송에서 역할을 알아내 알려 주면 판이 깨질 수 있어요. 스포일러 규칙을 정하세요." },
  { slug: "large-mass-coop-horror", title: "대인원 협동 공포", tier: "large", range: [6, 8], origin: "game", structures: ["coop"], lifecycle: "trend", gamesText: "Escape From Playtime 등", linkGames: ["escape-from-playtime"], horror: true,
    appeal: "audiovisual", points: ["scream_sound"],
    appealText: "여럿의 비명이 각자의 시점에서 다르게 들려요.",
    howTo: ["인원이 모두 같은 판에 들어가 각자 송출을 시작해요", "탐험하다가 누가 먼저 잡히는지, 누가 살아남는지 말로 중계해요", "살아남은 사람이 상황을 정리하고 남은 멤버를 이끌어요", "놀란 장면을 클립으로 남겨 쇼츠로 올려요"],
    multiPov: "여러 명의 비명이 각자 방송에서 시점에 따라 다르게 들려서, 시청자는 다른 방송으로 옮겨 가며 상황을 맞춰요.",
    participation: "enriches", channels: ["chat_vote"], by: vote("생존자 예측"), cautions: "공포 요소가 있어요. 게임이 최신이라 붐 기간이 짧을 수 있어요. 붐이 지나면 상시 컨텐츠의 한 회차로 내려 가세요." },
  { slug: "large-draft-tournament", noMotion: true, title: "드래프트 대회", tier: "large", range: [6, 12], origin: "stream_native", structures: ["versus"], lifecycle: "evergreen",
    appeal: "audiovisual", points: ["chemistry", "skill_highlight"],
    appealText: "드래프트는 평가와 굴욕이 오가는 청각적 재미, 본선은 시각적 재미예요.",
    howTo: ["팀장이 팀원을 번갈아 뽑는 드래프트를 방송으로 진행해요", "뽑힌 순서와 이유를 두고 서로 평가하고 놀려요", "본선은 팀별로 각자 송출하며 경기를 치러요", "경기 전 시청자와 우승 팀을 예측해요"],
    multiPov: "드래프트 중 팀장끼리 하는 이야기는 각자 방송에서 다른 말투로 나와서 시청자가 비교하는 재미가 있어요.",
    participation: "enriches", channels: ["chat_vote"], by: vote("우승 팀 예측") },
  { slug: "large-secret-talk-survival", spoiler: true, noMotion: true, title: "밀담 송출 서바이벌", tier: "large", range: [6, 12], origin: "variety_adapted", borrowedFrom: "더 지니어스 (한국)", structures: ["mind_game"], lifecycle: "evergreen",
    appeal: "audio", points: ["verbal_mind_game"],
    appealText: "밀담이 당사자의 방송에서만 들려서 퍼즐을 맞추는 재미가 있어요.",
    howTo: ["참가자끼리 비밀 대화(밀담)를 나누는 시간을 정해요", "밀담은 해당 참가자들의 방송에서만 들리게 해요", "라운드가 끝나면 공개 토론에서 밀담에서 들은 내용을 주장해요", "서로 주장이 맞는지 판가름하고 탈락자를 정해요"],
    multiPov: "밀담이 당사자 방송에서만 들려서, 시청자는 여러 방송을 오가며 진실을 맞춰요.",
    participation: "enriches", channels: [], by: { s: "방송을 옮겨 다니며 밀담을 모아 듣는 것이 곧 참여예요" } },
  { slug: "large-hunter-chase-event", title: "헌터 추격 이벤트", tier: "large", range: [6, 12], origin: "variety_adapted", borrowedFrom: "도주중 (일본)", structures: ["versus"], lifecycle: "evergreen",
    appeal: "visual", points: ["combat_action"],
    appealText: "쫓고 쫓기는 장면과 아슬아슬한 탈출이 중심이에요.",
    howTo: ["도망자와 헌터 역할을 정하고 제한 시간 규칙을 공지해요", "각자 송출하며 도망자는 숨고 헌터는 추격해요", "헌터에게 잡힌 참가자는 탈락하고 자신의 시점으로 중계해요", "시간이 끝나기 직전 시청자 투표로 자수 압박을 걸어요"],
    multiPov: "도망자는 헌터 위치를 모르고, 시청자는 양쪽 방송을 오가며 두 시점을 모두 알아요.",
    participation: "enriches", channels: ["chat_vote"], by: vote("자수 압박") },
  { slug: "large-viewer-server-event", title: "시청자 참가 서버 이벤트", tier: "large", range: [6, 12], origin: "stream_native", structures: ["coop"], lifecycle: "evergreen",
    appeal: "audiovisual", points: ["chemistry"],
    appealText: "방송인과 시청자가 한 팀으로 뛰는 장면이 중심이에요.",
    howTo: ["팬카페에서 참가 신청을 받고 추첨으로 참가자를 정해요", "선정된 시청자가 방송인과 같은 서버에 들어와 같은 팀이 돼요", "각자 송출하며 시청자 참가자의 별명을 불러 줘요", "이벤트가 끝나면 참가자 후기를 받아 방송에서 소개해요"],
    multiPov: "참가한 시청자도 자기 화면에서 방송하며 합류할 수 있어, 한 장면을 여러 시점에서 볼 수 있어요.",
    participation: "required", channels: ["community_task", "direct_play"], by: { m: "팬카페에서 참가 신청을 받아요", l: "신청자 중 추첨으로 대표 참가자를 뽑아요" }, cautions: "참가자가 있어야 성립해요. 안전하게 운영할 규칙을 먼저 공지하세요." },
];

export const AUDIENCE_BY_CHANNEL = AUDIENCE;
export const RANGE: Record<Seed["tier"], [number, number]> = { solo: [1, 1], small: [2, 5], large: [6, 12] };
