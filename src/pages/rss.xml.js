// src/pages/rss.xml.js
import { processPosts } from '../utils/posts.js';

export async function GET(context) {
  const postFiles = import.meta.glob('../../posts/*.md', { eager: true });
  const posts = processPosts(postFiles);

  const site = context.site ? String(context.site).replace(/\/$/, '') : 'https://f10w-0x00.github.io';

  const items = posts.map(post => `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${site}/blog/${post.slug}/</link>
      <guid isPermaLink="true">${site}/blog/${post.slug}/</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description><![CDATA[${post.description}]]></description>
      <category>${post.category}</category>
    </item>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>f10w-0x00</title>
    <link>${site}/</link>
    <description><![CDATA[f10w-0x00 的个人博客，收录学习、技术与日常的观察和记录。]]></description>
    <language>zh-CN</language>
    <atom:link href="${site}/rss.xml" rel="self" type="application/rss+xml" />
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
