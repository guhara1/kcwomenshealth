import { programs, lifeAreas, sidos, sigungus } from "../lib/data";
import { SITE } from "../lib/site";

const esc = (s: string) =>
  (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export async function GET() {
  const base = SITE.url;
  const buildDate = "Wed, 24 Jun 2026 00:00:00 GMT";

  type Item = { title: string; link: string; desc: string };
  const items: Item[] = [];

  for (const s of sidos) {
    items.push({
      title: `${s.regionName} 출장마사지·홈타이 지역 안내`,
      link: `${base}/area/${s.regionSlug}/`,
      desc: s.contentFocus ?? `${s.regionName} 지역별·지하철역별 안내`,
    });
  }
  for (const p of programs) {
    items.push({
      title: `${p.name} 안내`,
      link: `${base}/program/${p.slug}/`,
      desc: p.summary,
    });
  }
  for (const l of lifeAreas) {
    items.push({
      title: `${l.name} 출장마사지·홈타이 안내`,
      link: `${base}/life/${l.sidoSlug}/${l.slug}/`,
      desc: (l.p1 ?? "").slice(0, 100),
    });
  }
  for (const g of sigungus.filter((x) => x.contentStatus === "ready")) {
    items.push({
      title: `${g.regionName} 출장마사지·홈타이 안내`,
      link: `${base}/area/${g.parentSlug}/${g.regionSlug}/`,
      desc: `${g.regionName} 주요 생활권별 방문 가능 지역과 예약 안내`,
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
${body}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
