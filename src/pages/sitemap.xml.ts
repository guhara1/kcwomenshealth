import {
  services,
  sidos,
  sigungus,
  stations,
  lifeAreas,
  programs,
  allDetailDongs,
} from "../lib/data";
import { SITE } from "../lib/site";

// URL 유형별 우선순위/갱신주기
function meta(path: string): { priority: string; changefreq: string } {
  if (path === "/") return { priority: "1.0", changefreq: "daily" };
  if (/^\/(area|station|life|program)\/$/.test(path))
    return { priority: "0.9", changefreq: "daily" };
  if (/^\/area\/[^/]+\/$/.test(path))
    return { priority: "0.9", changefreq: "weekly" };
  if (
    /^\/area\/[^/]+\/[^/]+\/$/.test(path) ||
    /^\/life\/[^/]+\/[^/]+\/$/.test(path) ||
    /^\/program\/[^/]+\/$/.test(path)
  )
    return { priority: "0.8", changefreq: "weekly" };
  if (
    /^\/area\/[^/]+\/[^/]+\/[^/]+\/$/.test(path) ||
    /^\/station\/[^/]+\/[^/]+\/$/.test(path)
  )
    return { priority: "0.7", changefreq: "weekly" };
  return { priority: "0.6", changefreq: "monthly" };
}

export async function GET() {
  const base = SITE.url.replace(/\/$/, "");
  const lastmod = new Date().toISOString();

  const paths = new Set<string>();
  const add = (p: string) => paths.add(p);

  // 정적/허브 페이지 (모두 인덱스 — noindex 없음)
  add("/");
  ["/area/", "/station/", "/life/", "/program/"].forEach(add);
  [
    "/reservation/",
    "/guide/before-use/",
    "/contact/",
    "/privacy/",
    "/terms/",
  ].forEach(add);
  services.forEach((s) => add(`/service/${s.slug}/`));

  // 권역(시·도)
  sidos.forEach((s) => add(`/area/${s.regionSlug}/`));
  // 구/시/군 (생성되는 전체)
  sigungus.forEach((g) => add(`/area/${g.parentSlug}/${g.regionSlug}/`));
  // 행정동 상세
  allDetailDongs().forEach((e) =>
    add(`/area/${e.sidoSlug}/${e.guSlug}/${e.dong.slug}/`)
  );
  // 역세권 인덱스 + 역 상세
  ["seoul", "gyeonggi", "incheon", "busan"].forEach((g) =>
    add(`/station/${g}/`)
  );
  stations.forEach((st) => add(`/station/${st.stationGroup}/${st.stationSlug}/`));
  // 생활권 상세
  lifeAreas.forEach((l) => add(`/life/${l.sidoSlug}/${l.slug}/`));
  // 프로그램 상세
  programs.forEach((p) => add(`/program/${p.slug}/`));

  const body = [...paths]
    .sort()
    .map((p) => {
      const { priority, changefreq } = meta(p);
      return `  <url>
    <loc>${base}${p}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
