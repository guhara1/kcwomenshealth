import sidoData from "../data/regions/sido.json";
import sigunguData from "../data/regions/sigungu.json";
import stationData from "../data/stations/stations.json";
import serviceData from "../data/services.json";
import dongData from "../data/regions/dong.json";

export interface Sido {
  regionName: string;
  regionSlug: string;
  sido: string;
  regionType: string;
  nearbyStations: string[];
  lifeAreas: string[];
  contentFocus: string;
  indexPriority: number;
  contentStatus: string;
}

export interface Sigungu {
  regionName: string;
  regionSlug: string;
  parentSlug: string;
  sido: string;
  regionType: string;
  nearbyStations: string[];
  nearbyAreas: string[];
  contentFocus: string;
  indexPriority: number;
  contentStatus: string;
}

export interface Station {
  stationName: string;
  stationSlug: string;
  stationGroup: string;
  sido: string;
  sigungu: string;
  sigunguSlug: string;
  nearbyAreas: string[];
  transferYn: boolean;
  transferLines: string[];
  address: string;
  contentFocus: string;
  indexPriority: number;
  contentStatus: string;
}

export interface Service {
  slug: string;
  name: string;
  shortName: string;
  summary: string;
  focus: string;
  points: string[];
}

export interface Dong {
  name: string;
  slug: string;
  blurb: string;
}

export interface DongDetail {
  /** 비서울(경기·인천·부산)은 dong.json이 없으므로 상세에 한글 동명/요약을 포함 */
  name?: string;
  blurb?: string;
  nearbyStations: string[];
  adjacentAreas: string[];
  landmarks: string[];
  character: string;
  p1: string;
  p2: string;
  p3: string;
}

// dong-detail/{sido}__{gu}.json 들을 자동 로드.
// 구 슬러그가 시·도 간 중복(jung-gu 등)되므로 "시도/구" 복합키로 보관한다.
// (콘텐츠가 준비된 동만 색인 → 도어웨이 방지)
const detailModules = import.meta.glob<{ default: Record<string, DongDetail> }>(
  "../data/dong-detail/*.json",
  { eager: true }
);
const dongDetails: Record<string, Record<string, DongDetail>> = {};
for (const [filePath, mod] of Object.entries(detailModules)) {
  const base = filePath.split("/").pop()!.replace(".json", "");
  const [sido, gu] = base.includes("__") ? base.split("__") : ["seoul", base];
  dongDetails[`${sido}/${gu}`] = (mod as any).default ?? (mod as any);
}
const detailKey = (sidoSlug: string, guSlug: string) => `${sidoSlug}/${guSlug}`;

/** 특정 시도·구·동의 상세 콘텐츠 (없으면 undefined → 페이지 미생성) */
export const dongDetailFor = (
  sidoSlug: string,
  guSlug: string,
  dongSlug: string
): DongDetail | undefined => dongDetails[detailKey(sidoSlug, guSlug)]?.[dongSlug];

export const hasDongDetail = (
  sidoSlug: string,
  guSlug: string,
  dongSlug: string
): boolean => Boolean(dongDetails[detailKey(sidoSlug, guSlug)]?.[dongSlug]);

export const sidos = sidoData as Sido[];
export const sigungus = sigunguData as Sigungu[];
export const services = serviceData as Service[];

// 기본 역 + 추가 역(extra-*.json) 병합, group+slug 중복 제거(기존 우선)
const extraStationModules = import.meta.glob<{ default: Station[] }>(
  "../data/stations/extra-*.json",
  { eager: true }
);
const _stations: Station[] = [...(stationData as Station[])];
const _seen = new Set(_stations.map((s) => `${s.stationGroup}/${s.stationSlug}`));
for (const mod of Object.values(extraStationModules)) {
  const arr = ((mod as any).default ?? mod) as Station[];
  for (const s of arr) {
    const key = `${s.stationGroup}/${s.stationSlug}`;
    if (!_seen.has(key)) {
      _seen.add(key);
      _stations.push(s);
    }
  }
}
export const stations = _stations;
const dongs = dongData as Record<string, Dong[]>;

/** 자치구의 대표 행정동 목록 (ㄱㄴㄷ 정렬). 시·도 단위로 구분한다. */
export const dongsOf = (sidoSlug: string, guSlug: string): Dong[] => {
  // 서울은 dong.json(요약 포함)을 우선 사용
  if (sidoSlug === "seoul") {
    const list = dongs[guSlug];
    if (list && list.length) {
      return [...list].sort((a, b) => a.name.localeCompare(b.name, "ko"));
    }
  }
  // 비서울(또는 dong.json 없음)은 dong-detail의 한글 동명으로 목록 구성
  const det = dongDetails[detailKey(sidoSlug, guSlug)];
  if (det) {
    return Object.entries(det)
      .map(([slug, d]) => ({
        name: d.name ?? slug,
        slug,
        blurb: d.blurb ?? d.character ?? "",
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }
  return [];
};

export interface DetailDongEntry {
  sidoSlug: string;
  guSlug: string;
  dong: Dong;
  detail: DongDetail;
}

/** 상세 콘텐츠가 준비된 행정동 전체 (개별 페이지 생성용).
 *  부모 구가 contentStatus="ready"(승격 완료)인 경우에만 페이지를 생성한다.
 *  → 검증 전 부분 데이터로 페이지가 노출되는 것을 막아 도어웨이를 방지한다. */
export const allDetailDongs = (): DetailDongEntry[] => {
  const out: DetailDongEntry[] = [];
  for (const [key, map] of Object.entries(dongDetails)) {
    const [sidoSlug, guSlug] = key.split("/");
    const gu = sigungus.find(
      (s) => s.parentSlug === sidoSlug && s.regionSlug === guSlug
    );
    if (!gu || gu.contentStatus !== "ready") continue;
    const guDongs = dongsOf(sidoSlug, guSlug);
    for (const [dongSlug, detail] of Object.entries(map)) {
      const dong =
        guDongs.find((d) => d.slug === dongSlug) ??
        ({ name: dongSlug, slug: dongSlug, blurb: "" } as Dong);
      out.push({ sidoSlug, guSlug, dong, detail });
    }
  }
  return out;
};

/** contentStatus 가 색인 가능한 상태인지 */
export const isIndexable = (status: string) => status === "ready";

export const getSido = (slug: string) =>
  sidos.find((s) => s.regionSlug === slug);

export const sigungusBySido = (sidoSlug: string) =>
  sigungus.filter((s) => s.parentSlug === sidoSlug);

export const getSigungu = (sidoSlug: string, guSlug: string) =>
  sigungus.find((s) => s.parentSlug === sidoSlug && s.regionSlug === guSlug);

export const stationsByGroup = (group: string) =>
  stations.filter((s) => s.stationGroup === group);

export const getStation = (group: string, slug: string) =>
  stations.find((s) => s.stationGroup === group && s.stationSlug === slug);

export const getService = (slug: string) =>
  services.find((s) => s.slug === slug);

/** 같은 시군구에 속한 역 (시·도 단위로 구분 — sigunguSlug 중복 방지) */
export const stationsInSigungu = (sidoSlug: string, sigunguSlug: string) =>
  stations.filter(
    (s) => s.stationGroup === sidoSlug && s.sigunguSlug === sigunguSlug
  );

/** 같은 권역 내 인접 역 (자기 자신 제외, n개) */
export const nearbyStationsOf = (station: Station, n = 4) =>
  stations
    .filter(
      (s) =>
        s.stationGroup === station.stationGroup &&
        s.stationSlug !== station.stationSlug
    )
    .slice(0, n);

export const stationByName = (name: string) =>
  stations.find((s) => s.stationName === name);

// ─────────────────────────────────────────────────────────────
// 생활권(life-area) — 지역↔역 중간 허브
// ─────────────────────────────────────────────────────────────
export interface LifeArea {
  name: string;
  slug: string;
  sidoSlug: string;
  memberAreas: string[];
  memberStations: string[];
  p1: string;
  p2: string;
}

const lifeModules = import.meta.glob<{ default: any[] }>(
  "../data/life/*.json",
  { eager: true }
);
const lifeAreasAll: LifeArea[] = [];
for (const [filePath, mod] of Object.entries(lifeModules)) {
  const sidoSlug = filePath.split("/").pop()!.replace(".json", "");
  const arr = ((mod as any).default ?? mod) as Omit<LifeArea, "sidoSlug">[];
  for (const la of arr) lifeAreasAll.push({ ...la, sidoSlug });
}

export const lifeAreas = lifeAreasAll;
export const lifeAreasOfSido = (sidoSlug: string) =>
  lifeAreasAll.filter((l) => l.sidoSlug === sidoSlug);
export const getLifeArea = (sidoSlug: string, slug: string) =>
  lifeAreasAll.find((l) => l.sidoSlug === sidoSlug && l.slug === slug);

/** 행정동 이름으로 동 상세 페이지 경로 찾기 (해당 권역에서) */
export const dongPathByName = (sidoSlug: string, name: string): string | null => {
  for (const gu of sigungus.filter((s) => s.parentSlug === sidoSlug)) {
    const d = dongsOf(sidoSlug, gu.regionSlug).find((x) => x.name === name);
    if (d && hasDongDetail(sidoSlug, gu.regionSlug, d.slug)) {
      return `/area/${sidoSlug}/${gu.regionSlug}/${d.slug}/`;
    }
  }
  return null;
};

/** 1차 우선 시군구 */
export const prioritySigungus = (sidoSlug: string) =>
  sigungusBySido(sidoSlug).filter((s) => s.indexPriority === 1);
