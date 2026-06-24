import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import sigungu from "./src/data/regions/sigungu.json" with { type: "json" };

// 배포 도메인. 실제 도메인으로 교체하세요.
export const SITE_URL = "https://www.kcwomenshealth.com";

// contentStatus 가 ready 가 아닌(noindex 처리되는) 지역 경로는 sitemap 에서 제외
const noindexPaths = sigungu
  .filter((g) => g.contentStatus !== "ready")
  .map((g) => `/area/${g.parentSlug}/${g.regionSlug}/`);

export default defineConfig({
  site: SITE_URL,
  trailingSlash: "ignore",
  build: {
    format: "directory",
  },
  integrations: [
    sitemap({
      // noindex / 비공개 페이지는 sitemap 에서 제외
      filter: (page) => {
        if (page.includes("/privacy")) return false;
        if (page.includes("/terms")) return false;
        const path = new URL(page).pathname;
        return !noindexPaths.includes(path);
      },
    }),
  ],
});
