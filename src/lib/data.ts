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
