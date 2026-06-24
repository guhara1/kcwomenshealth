import { defineConfig } from "astro/config";

// 배포 도메인
export const SITE_URL = "https://kcwomenshealth.com";

// 사이트맵은 단일 파일(/sitemap.xml)로 직접 생성합니다 → src/pages/sitemap.xml.ts
// (모든 페이지를 한 파일에 노출. 인덱스 분할 없음, noindex 없음)
export default defineConfig({
  site: SITE_URL,
  trailingSlash: "ignore",
  build: {
    format: "directory",
  },
});
