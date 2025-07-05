export default function handler(req, res) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://playotoron.com/</loc>
    <lastmod>2025-07-06</lastmod>
    <priority>1.0</priority>
  </url>
</urlset>`;

  res.writeHead(200, {
    'Content-Type': 'application/xml',
    'Cache-Control': 'public, max-age=0, s-maxage=600'  // ← 任意でキャッシュ対策
  });
  res.end(xml);
}
