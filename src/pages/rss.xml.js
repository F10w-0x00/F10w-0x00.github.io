// src/pages/rss.xml.js
import { getAllPosts } from '../utils/posts';

function escapeXml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeCdata(str) {
  return String(str ?? '').replace(/]]>/g, ']]]]><![CDATA[>');
}

export async function GET(context) {
  const posts = await getAllPosts({ includeDrafts: false });
  const site = context.site ? String(context.site).replace(/\/$/, '') : 'https://f10w-0x00.github.io';

  const items = posts
    .map((post) => {
      const link = `${site}/blog/${encodeURIComponent(post.slug)}/`;
      const pubDate = new Date(post.dateISO).toUTCString();
      return `    <item>
      <title><![CDATA[${escapeCdata(post.title)}]]></title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${escapeCdata(post.description)}]]></description>
      <category>${escapeXml(post.category)}</category>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>f10w-0x00</title>
    <link>${escapeXml(site)}/</link>
    <description><![CDATA[f10w-0x00 的个人博客，收录学习、技术与日常的观察和记录。]]></description>
    <language>zh-CN</language>
    <atom:link href="${escapeXml(site)}/rss.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8'
    }
  });
}
