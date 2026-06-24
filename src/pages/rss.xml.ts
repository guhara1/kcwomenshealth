import {
  programs,
  lifeAreas,
  sidos,
  sigungus,
  allDetailDongs,
  stations,
  getSigungu,
} from "../lib/data";
import { SITE } from "../lib/site";

const esc = (s: string) =>
  (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const sidoKo: Record<string, string> = {
  seoul: "서울",
  gyeonggi: "경기",
  incheon: "인천",
  busan: "부산",
};

export async function GET() {
  const base = SITE.url;
  const buildDate = new Date().toUTCString();

  type Item = { title: string; link: string; desc: string };
  const items: Item[] = [];

  // 1) 권역(시·도)
  for (const s of sidos) {
    items.push({
      title: `${s.regionName} 출장마사지·홈타이 지역 안내`,
      link: `${base}/area/${s.regionSlug}/`,
      desc: s.contentFocus ?? `${s.regionName} 지역별·지하철역별 안내`,
    });
  }
  // 2) 프로그램
  for (const p of programs) {
    items.push({
      title: `${p.name} 안내`,
      link: `${base}/program/${p.slug}/`,
      desc: p.summary,
    });
  }
  // 3) 생활권
  for (const l of lifeAreas) {
    items.push({
      title: `${l.name} 출장마사지·홈타이 안내`,
      link: `${base}/life/${l.sidoSlug}/${l.slug}/`,
      desc: (l.p1 ?? "").slice(0, 100),
    });
  }
  // 4) 구/시 (색인 가능한 곳)
  for (const g of sigungus.filter((x) => x.contentStatus === "ready")) {
    items.push({
      title: `${g.regionName} 출장마사지·홈타이 안내`,
      link: `${base}/area/${g.parentSlug}/${g.regionSlug}/`,
      desc: `${g.regionName} 주요 생활권별 방문 가능 지역과 예약 안내`,
    });
  }
  // 5) 행정동 상세
  for (const e of allDetailDongs()) {
    const gu = getSigungu(e.sidoSlug, e.guSlug);
    items.push({
      title: `${e.dong.name} 출장마사지·홈타이 안내`,
      link: `${base}/area/${e.sidoSlug}/${e.guSlug}/${e.dong.slug}/`,
      desc: `${sidoKo[e.sidoSlug] ?? ""} ${gu?.regionName ?? ""} ${e.dong.name} 생활권 안내`.trim(),
    });
  }
  // 6) 지하철역 상세
  for (const st of stations) {
    items.push({
      title: `${st.stationName} 출장마사지·홈타이 안내`,
      link: `${base}/station/${st.stationGroup}/${st.stationSlug}/`,
      desc: `${st.stationName} 인근 ${(st.nearbyAreas ?? []).slice(0, 3).join(", ")} 생활권 안내`,
    });
  }

  const body = items
    .map(
      (it) => `    <item>
      <title>${esc(it.title)}</title>
      <link>${it.link}</link>
      <guid isPermaLink="true">${it.link}</guid>
      <description>${esc(it.desc)}</description>
      <pubDate>${buildDate}</pubDate>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE.name)} — 출장마사지·홈타이 지역 안내</title>
    <link>${base}/</link>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${esc(SITE.tagline)}</description>
    <language>ko</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <ttl>1440</ttl>
${body}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
