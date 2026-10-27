// 단계가 아직 "곧 출시"인데 등록된 출시 일정이 모두 지난 게임. 관리자 화면의 "단계 갱신 필요"와 같은 기준이다.
// (홈에서 자동으로 빼는 기준은 getGames의 staleUpcoming이고, 이쪽은 DB 행을 바로 보는 관리자용이다.)
export interface StaleGameRow { id: string; name: string; release_phase: string; stage: string }
export interface KeyDateRow { game_id: string; date: string }
export interface StaleGame { id: string; name: string; lastDate: string; daysSince: number }

// compute_heat_stage의 "곧 출시" 조건(0003/0007): 출시 경과가 upcoming이거나 단계가 announced·playtest
const isUpcoming = (g: StaleGameRow) => g.release_phase === "upcoming" || g.stage === "announced" || g.stage === "playtest";

export function findStaleUpcoming(games: StaleGameRow[], dates: KeyDateRow[], today: string): StaleGame[] {
  const out: StaleGame[] = [];
  for (const g of games) {
    if (!isUpcoming(g)) continue;
    const mine = dates.filter((d) => d.game_id === g.id).map((d) => d.date).sort();
    if (mine.length === 0 || mine[mine.length - 1] >= today) continue; // 일정이 없거나 아직 남은 일정이 있으면 해당 없음
    const lastDate = mine[mine.length - 1];
    out.push({ id: g.id, name: g.name, lastDate, daysSince: Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${lastDate}T00:00:00Z`)) / 86400000) });
  }
  return out.sort((a, b) => b.daysSince - a.daysSince);
}
