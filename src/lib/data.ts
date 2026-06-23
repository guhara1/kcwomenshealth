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
  nearbyStations: string[];
  adjacentAreas: string[];
  landmarks: string[];
  character: string;
  p1: string;
  p2: string;
  p3: string;
}

// dong-detail/{gu}.json 들을 자동 로드 (콘텐츠가 준비된 동만 색인 → 도어웨이 방지)
const detailModules = import.meta.glob<{ default: Record<string, DongDetail> }>(
  "../data/dong-detail/*.json",
  { eager: true }
);
const dongDetails: Record<string, Record<string, DongDetail>> = {};
for (const [filePath, mod] of Object.entries(detailModules)) {
  const gu = filePath.split("/").pop()!.replace(".json", "");
  dongDetails[gu] = (mod as any).default ?? (mod as any);
}

/** 특정 구·동의 상세 콘텐츠 (없으면 undefined → 페이지 미생성) */
export const dongDetailFor = (
  guSlug: string,
  dongSlug: string
): DongDetail | undefined => dongDetails[guSlug]?.[dongSlug];

export const hasDongDetail = (guSlug: string, dongSlug: string): boolean =>
  Boolean(dongDetails[guSlug]?.[dongSlug]);

export const sidos = sidoData as Sido[];
export const sigungus = sigunguData as Sigungu[];
export const stations = stationData as Station[];
export const services = serviceData as Service[];
const dongs = dongData as Record<string, Dong[]>;

/** 자치구의 대표 행정동 목록 (ㄱㄴㄷ 정렬). 데이터 없으면 nearbyAreas 기반 폴백 */
export const dongsOf = (guSlug: string): Dong[] => {
  const list = dongs[guSlug];
  if (list && list.length) {
    return [...list].sort((a, b) => a.name.localeCompare(b.name, "ko"));
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
  for (const [guSlug, map] of Object.entries(dongDetails)) {
    const gu = sigungus.find((s) => s.regionSlug === guSlug);
    if (!gu || gu.contentStatus !== "ready") continue;
    const sidoSlug = gu.parentSlug;
    const guDongs = dongsOf(guSlug);
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

/** 같은 시군구에 속한 역 */
export const stationsInSigungu = (sigunguSlug: string) =>
  stations.filter((s) => s.sigunguSlug === sigunguSlug);

/** 같은 권역 내 인접 역 (자기 자신 제외, n개) */
export const nearbyStationsOf = (station: Station, n = 4) =>
  stations
    .filter(
      (s) =>
        s.stationGroup === station.stationGroup &&
        s.stationSlug !== station.stationSlug
    )
    .slice(0, n);

/** 1차 우선 시군구 */
export const prioritySigungus = (sidoSlug: string) =>
  sigungusBySido(sidoSlug).filter((s) => s.indexPriority === 1);
