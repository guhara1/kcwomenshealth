// ─────────────────────────────────────────────────────────────
// 사이트 전역 설정 (브랜드 / 연락처 / 외부 링크)
// 실제 운영 값으로 교체할 항목은 주석으로 표시했습니다.
// ─────────────────────────────────────────────────────────────

export const SITE = {
  /** 상호 */
  name: "VIP 마사지",
  /** 영문/슬로건 */
  brandEn: "VIP MASSAGE",
  /** 사이트 한 줄 소개 (80자 이내) */
  tagline: "서울·경기·인천·부산 출장마사지·홈타이 지역별 지하철역별 안내 플랫폼",

  /** 전화 예약 번호 */
  phone: "0508-202-4719",
  phoneHref: "tel:0508-202-4719",

  /** 배포 도메인 (실제 도메인으로 교체) */
  url: "https://www.vip-massage.co.kr",

  /** 대표 OG/썸네일 이미지 (선호 이미지 지정용) */
  ogImage: "/og-image.svg",

  /** 운영 시간 안내 */
  hours: "10:00 ~ 익일 05:00 (연중무휴)",
} as const;

// ─────────────────────────────────────────────────────────────
// 텔레그램 링크 (제작·광고 문의 전용 — 푸터에서만 사용)
//  ⚠️ webBuild 핸들은 실제 텔레그램 계정으로 교체하세요.
// ─────────────────────────────────────────────────────────────
export const TELEGRAM = {
  /** 웹사이트 제작 문의 텔레그램 */
  webBuild: "https://t.me/vip_massage_build",
  /** 광고 문의 텔레그램 */
  ad: "https://t.me/googleseolab",
} as const;

// 4대 권역
export const SIDO_LIST = [
  { slug: "seoul", name: "서울", short: "서울" },
  { slug: "gyeonggi", name: "경기", short: "경기" },
  { slug: "incheon", name: "인천", short: "인천" },
  { slug: "busan", name: "부산", short: "부산" },
] as const;

export type SidoSlug = (typeof SIDO_LIST)[number]["slug"];

export const sidoName = (slug: string) =>
  SIDO_LIST.find((s) => s.slug === slug)?.name ?? slug;
