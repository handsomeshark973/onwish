import { ContentCard } from "@/components/cards/ContentCard";
import { GameCard } from "@/components/cards/GameCard";
import { RecommendCard } from "@/components/cards/RecommendCard";
import { AppealBadge, SizeBadge, StageBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { GameImage } from "@/components/ui/GameImage";
import { MiniChart } from "@/components/ui/MiniChart";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { Demo } from "./Demo";
import { ShowcaseExtras } from "./ShowcaseExtras";

// 직접 그린 단순 그라데이션(외부 이미지 아님). 이미지가 있는 상태를 보여 주기 위한 예시
const SAMPLE_IMG = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6a5cff"/><stop offset="1" stop-color="#ff7ab6"/></linearGradient></defs><rect width="160" height="90" fill="url(#g)"/></svg>');

// 공통 부품 모음. /dev와 /dev/tokens가 같이 쓴다. 이름·문구는 모양 확인용 가짜 값이다.
export function ComponentShowcase() {
  return (
    <>
      <h2 className="ow-h2">배지(색 + 글자)</h2>
      <div className="ow-card-badges">
        <AppealBadge appeal="visual" />
        <AppealBadge appeal="audio" />
        <AppealBadge appeal="audiovisual" />
        <StageBadge stage="upcoming" />
        <StageBadge stage="rising" />
        <StageBadge stage="peak" />
        <StageBadge stage="cooling" />
        <StageBadge stage="evergreen" />
        <SizeBadge size="s" />
        <SizeBadge size="m" />
        <SizeBadge size="l" />
      </div>

      <h2 className="ow-h2">버튼 · 탭 · 칩</h2>
      <div className="ow-card-badges">
        <Button>컨텐츠 추천 받기</Button>
        <Button variant="secondary">저장</Button>
        <Button variant="ghost">자세히</Button>
        <Button disabled>비활성</Button>
      </div>
      <Demo />

      <h2 className="ow-h2">카드</h2>
      <div className="ow-grid">
        <ContentCard
          href="/dev"
          title="예시 컨텐츠 제목"
          appeal="audio"
          appealLine="대화가 중심이라 틀어 두기 좋은 예시 문구입니다."
          participation="enriches"
          tier="small"
          games="예시 게임"
        />
        <GameCard
          href="/dev"
          name="예시 게임 A"
          developer="예시 개발사"
          stage="rising"
          players={{ min: 3, max: 3, fixed: true }}
          platforms={["PC"]}
          metric={{ values: [10, 14, 22, null, 30, 41, 38], kind: "steam_ccu" }}
        />
        <GameCard
          href="/dev"
          name="예시 게임 B"
          stage="upcoming"
          players={{ min: null, max: null }}
          platforms={["PC", "PS5"]}
          metric={{ values: [], kind: "steam_ccu" }}
        />
      </div>

      <h2 className="ow-h2">추천 결과 카드</h2>
      <div className="ow-grid">
        <RecommendCard
          title="예시 추천 컨텐츠"
          logline="한 줄 소개가 들어가는 자리입니다."
          appeal="audiovisual"
          appealPoints={["소통 강제형", "티키타카 케미"]}
          appealText="시청자가 무엇을 즐기는지 한두 문장으로 설명하는 자리입니다."
          fit="complement"
          fitReason="입담 중심 후보 사이에 다른 어필을 하나 섞기 위해 넣었어요."
          watchMode="focus"
          stage="peak"
          setup="준비물과 설정이 들어가는 자리"
          howTo={["첫 번째 진행 단계", "두 번째 진행 단계", "세 번째 진행 단계"]}
          participation="채팅 투표로 다음 목표를 정합니다."
          continuity="시즌 장부에 점수를 쌓습니다."
          cautions="주의할 점이 들어가는 자리"
          origin="방송 고유 포맷"
          actions={
            <>
              <Button variant="secondary">저장</Button>
              <Button variant="ghost">상세 보기</Button>
            </>
          }
        />
      </div>

      <h2 className="ow-h2">게임 이미지(출처·자리 표시자·대체 글)</h2>
      <div className="ow-grid">
        <GameImage name="예시 게임 A" src={SAMPLE_IMG} source="예시 출처(직접 그린 도형)" />
        <GameImage name="예시 게임 B" />
      </div>

      <h2 className="ow-h2">필터 시트·상태 화면 기본 문구</h2>
      <ShowcaseExtras />

      <h2 className="ow-h2">미니 차트와 상태 화면</h2>
      <MiniChart values={[5, 8, 7, null, 12, 18]} label="예시 지표" />
      <div className="ow-grid ow-mt">
        <LoadingState title="추천을 만드는 중이에요" hint="보통 10~20초 걸립니다. 창을 닫지 마세요." />
        <EmptyState title="맞는 컨텐츠가 없어요" hint="인원이나 제외 조건을 조금 풀어 보세요." action={<Button variant="secondary">조건 바꾸기</Button>} />
        <ErrorState title="추천을 가져오지 못했어요" hint="잠시 뒤 다시 시도하거나 기본 추천을 받아 보세요." action={<Button variant="secondary">다시 시도</Button>} />
      </div>
    </>
  );
}
