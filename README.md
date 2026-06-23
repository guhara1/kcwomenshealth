# VIP 마사지 — 서울·경기·인천·부산 출장마사지·홈타이 지역 안내

Astro 기반 정적 사이트. 지역(구·시·군)과 지하철역 생활권을 기준으로 방문형 관리
이용 전 확인사항을 안내합니다. 도어웨이 위험을 줄이기 위해 `contentStatus`가
`ready`인 데이터만 색인하고, 그 외(`draft`/`noindex`)는 `noindex`로 처리합니다.

## 실행

```bash
npm install
npm run dev      # 개발 서버
npm run build    # dist/ 정적 빌드 (sitemap 포함)
npm run preview  # 빌드 결과 미리보기
```

## 배포

Cloudflare Pages 권장. 빌드 명령 `npm run build`, 출력 디렉터리 `dist`.

## ⚠️ 운영 전 교체해야 하는 값

| 항목 | 위치 |
| --- | --- |
| 배포 도메인 | `astro.config.mjs` (`SITE_URL`), `src/lib/site.ts` (`url`), `public/robots.txt` |
| 텔레그램 링크 (예약/제작문의/제휴문의) | `src/lib/site.ts` → `TELEGRAM` |
| 상호·전화·운영시간 | `src/lib/site.ts` → `SITE` (현재: VIP 마사지 / 0508-202-4719) |

텔레그램 핸들은 현재 플레이스홀더(`vip_massage`, `vip_massage_build`,
`vip_massage_ad`)입니다. 실제 계정/채널로 교체하세요.

## 구조

- `src/data/regions/` — `sido.json`, `sigungu.json` (지역 데이터)
- `src/data/stations/stations.json` — 지하철역 데이터
- `src/data/services.json` — 서비스 안내
- `src/data/seo/` — 색인/noindex 규칙
- `src/lib/` — 사이트 설정(`site.ts`), 데이터 로더(`data.ts`), 스키마(`seo.ts`)
- `src/layouts/BaseLayout.astro` — 공통 SEO 메타 + JSON-LD 스키마
- `src/pages/` — 메인 / 지역 / 역 / 서비스 / 예약 / 가이드 페이지

## 색인 단계 확장

`indexPriority`(1·2·3·0)와 `contentStatus`(`ready`/`draft`/`noindex`/`blocked`)로
단계적 색인을 관리합니다. 새 지역·역을 색인하려면 데이터의 `contentStatus`를
`ready`로 바꾸고 본문(생활권·인접 행정동·내부링크)을 충분히 채우세요.

## SEO 디자인 토큰

`src/styles/tokens.css`의 프리미엄 팔레트(딥네이비·포인트 블루·골드 액센트·오렌지
CTA)와 `global.css`의 컴포넌트 오버레이를 사용합니다. 폰트는 Pretendard.
