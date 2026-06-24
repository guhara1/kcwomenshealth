import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import sigungu from "./src/data/regions/sigungu.json" with { type: "json" };

// 배포 도메인. 실제 도메인으로 교체하세요.
export const SITE_URL = "https://kcwomenshealth.com";

// contentStatus 가 ready 가 아닌(noindex 처리되는) 지역 경로는 sitemap 에서 제외
const noindexPaths = sigungu
  .filter((g) => g.contentStatus !== "ready")
  .map((g) => `/area/${g.parentSlug}/${g.regionSlug}/`);

// URL 유형별 우선순위/갱신주기 (검색엔진 크롤링 힌트)
function priorityFor(path) {
  if (path === "/") return { priority: 1.0, changefreq: "daily" };
  if (/^\/(area|station|life|program)\/?$/.test(path))
    return { priority: 0.9, changefreq: "daily" };
  if (/^\/area\/[^/]+\/?$/.test(path))
    return { priority: 0.9, changefreq: "weekly" };
  if (
    /^\/area\/[^/]+\/[^/]+\/?$/.test(path) ||
    /^\/life\/[^/]+\/[^/]+\/?$/.test(path) ||
    /^\/program\/[^/]+\/?$/.test(path)
  )
    return { priority: 0.8, changefreq: "weekly" };
  if (
    /^\/area\/[^/]+\/[^/]+\/[^/]+\/?$/.test(path) ||
    /^\/station\/[^/]+\/[^/]+\/?$/.test(path)
  )
    return { priority: 0.7, changefreq: "weekly" };
  return { priority: 0.6, changefreq: "monthly" };
}

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
      lastmod: new Date(),
      serialize(item) {
        const path = new URL(item.url).pathname;
        const { priority, changefreq } = priorityFor(path);
        item.priority = priority;
        item.changefreq = changefreq;
        return item;
      },
    }),
  ],
});
