import { normalizeHeatStage } from "@/types/taxonomy";
import type {
  Content, ContentSummary, GameVideo, LinkedGame, Game, GameFormat, GameKeyDate, GameSource, MetricPoint, MetricKind,
} from "@/types/domain";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

// DB의 translations 열({"en": {...}})에서 해당 언어의 값을 꺼낸다. 한국어는 원본 열을 그대로 쓴다.
const tr = (r: Row, locale: string): Record<string, any> => (locale === "ko" ? {} : (r.translations?.[locale] ?? {}));

// 출처 이름도 DB에는 한국어로 저장돼 있다. 영어 화면에서는 아래 표로 바꾸고, 표에 없으면 그대로 보여 준다.
const SOURCE_TITLES_EN: Record<string, string> = {
  "Steam 스토어": "Steam store",
  "Xbox 공식 페이지 · Minecraft": "Xbox official page · Minecraft",
  "Roblox 공식 소개 페이지": "Roblox official About page",
  "Nintendo 미국 스토어 · Super Mario Maker 2": "Nintendo US store · Super Mario Maker 2",
  "Mob Entertainment 뉴스": "Mob Entertainment news",
  "Rockstar 공식 사이트 · Grand Theft Auto VI": "Rockstar Games official site · Grand Theft Auto VI",
};
export const sourceTitle = (v: string, locale: string) => (locale === "ko" ? v : (SOURCE_TITLES_EN[v] ?? v));

// 기준일 라벨은 DB에 한국어로 저장돼 있어서 영어 화면에서는 아래 표로 바꾼다. 표에 없는 라벨은 그대로 보여 준다.
const KEY_DATE_LABELS_EN: Record<string, string> = {
  "출시": "Release",
  "얼리 액세스 출시": "Early Access release",
  "2026-09-02 Steam 출시": "Steam release",
  "Steam 얼리 액세스 출시": "Steam Early Access release",
  "게임스컴 Future Games Show 공개": "Revealed at the gamescom Future Games Show",
};

export function mapGame(r: Row, locale = "ko"): Game {
  const x = tr(r, locale);
  return {
    id: r.id,
    slug: r.slug,
    // 화면에 보이는 이름: 한국어 화면은 한국어 이름(없으면 원어), 그 외 언어는 원어(영어) 이름
    name: locale === "ko" ? (r.name_ko ?? r.name) : r.name,
    nameKo: r.name_ko,
    developer: r.developer,
    publisher: r.publisher,
    stage: r.stage,
    releasePhase: r.release_phase,
    popularityStatus: r.popularity_status,
    heatStage: normalizeHeatStage(r.heat_stage),
    platforms: r.platforms ?? [],
    players: { min: r.min_players, max: r.max_players, fixed: r.fixed_players },
    crossplay: r.crossplay,
    priceNote: x.priceNote ?? r.price_note,
    genre: x.genre ?? r.genre ?? [],
    asymmetricRoles: r.asymmetric_roles,
    proximityVoice: r.proximity_voice,
    moddable: r.moddable,
    streamPoint: x.streamPoint ?? r.stream_point,
    cautions: x.cautions ?? r.cautions,
    imageUrl: r.image_url,
    imageSource: r.image_source ? sourceTitle(r.image_source, locale) : r.image_source,
    lastCheckedAt: r.last_checked_at,
    infoStale: r.info_stale,
    isHorror: r.is_horror ?? null,
    motionSicknessRisk: r.motion_sickness_risk ?? null,
    spoilerRisk: r.spoiler_risk ?? null,
    releaseBasisDate: r.release_basis_date ?? null,
    officialChannelIds: r.official_channel_ids ?? [],
  };
}

export function mapFormat(r: Row, locale = "ko"): GameFormat {
  const x = tr(r, locale);
  return {
    id: r.id,
    gameId: r.game_id,
    title: x.title ?? r.title,
    requiredPlayers: { min: r.required_min, max: r.required_max },
    participationMode: r.participation_mode,
    requiredDevices: r.required_devices ?? [],
    playerTiers: r.player_tiers ?? [],
    mainAppeal: r.main_appeal,
    appealPoints: r.appeal_points ?? [],
    appealText: x.appealText ?? r.appeal_text,
    howTo: x.howTo ?? r.how_to,
    modsOrSetup: x.modsOrSetup ?? r.mods_or_setup,
  };
}

export function mapContent(r: Row, locale = "ko"): Content {
  const x = tr(r, locale);
  return {
    id: r.id,
    slug: r.slug,
    title: x.title ?? r.title,
    playerTier: r.player_tier,
    requiredPlayers: { min: r.required_min, max: r.required_max },
    participationMode: r.participation_mode,
    origin: r.origin,
    borrowedFrom: x.borrowedFrom ?? r.borrowed_from,
    structures: r.structures ?? [],
    lifecycle: r.lifecycle,
    audienceFit: r.audience_fit ?? [],
    devices: r.devices ?? [],
    gamesText: x.gamesText ?? r.games_text,
    modsOrSetup: x.setup ?? r.mods_or_setup,
    mainAppeal: r.main_appeal,
    appealPoints: r.appeal_points ?? [],
    appealText: x.appealText ?? r.appeal_text,
    watchMode: r.watch_mode,
    howTo: x.howTo ?? r.how_to,
    multiPovPoint: x.multiPov ?? r.multi_pov_point,
    viewerParticipation: r.viewer_participation,
    participationChannels: r.participation_channels ?? [],
    participationBySize: x.by ?? r.participation_by_size ?? {},
    continuity: x.continuity ?? r.continuity,
    cautions: x.cautions ?? r.cautions,
    isHorror: r.is_horror ?? null,
    motionSicknessRisk: r.motion_sickness_risk ?? null,
    spoilerRisk: r.spoiler_risk ?? null,
  };
}

export const mapKeyDate = (r: Row, locale = "ko"): GameKeyDate => ({
  label: locale === "ko" ? r.label : (KEY_DATE_LABELS_EN[r.label] ?? r.label),
  date: r.date,
  source: r.source,
});
export const mapSource = (r: Row, locale = "ko"): GameSource => ({ title: sourceTitle(r.title, locale), url: r.url, checkedAt: r.checked_at });
export const mapMetric = (r: Row): MetricPoint => ({
  kind: r.kind as MetricKind, value: Number(r.value), at: r.observed_at, source: r.source,
});

// 최근 N일의 일별 값. 관측이 없는 날은 null로 두어 차트에서 선이 끊기게 한다(0으로 채우지 않는다).
export function metricSeries(points: MetricPoint[], kind: MetricKind, days = 30, now = Date.now()): (number | null)[] {
  const byDay = new Map<string, number>();
  for (const p of points.filter((x) => x.kind === kind).sort((a, b) => a.at.localeCompare(b.at))) {
    byDay.set(new Date(p.at).toISOString().slice(0, 10), p.value);
  }
  const out: (number | null)[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 86400000).toISOString().slice(0, 10);
    out.push(byDay.get(d) ?? null);
  }
  return out.some((v) => v !== null) ? out : [];
}

export function withGames(content: Content, links: LinkedGame[]): ContentSummary {
  return { ...content, games: links };
}

export function mapVideo(r: Row, locale = "ko"): GameVideo {
  const ko = r.title_ko as string | null;
  const en = r.title_en as string | null;
  return {
    id: r.id,
    gameId: r.game_id,
    youtubeId: r.youtube_id,
    kind: r.kind,
    title: (locale === "ko" ? ko ?? en : en ?? ko) ?? "",
    titleKo: ko,
    titleEn: en,
    channelName: r.channel_name,
    channelId: r.channel_id,
    publishedAt: r.published_at,
    sourceUrl: r.source_url,
    verifiedAt: r.verified_at,
    status: r.status,
    hiddenReason: r.hidden_reason,
    isFeatured: r.is_featured,
  };
}
