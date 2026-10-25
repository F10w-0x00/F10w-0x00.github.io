// src/utils/posts.js
// 统一文章元数据解析与辅助方法

export function formatChineseDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return `${m}月${day}日`;
}

export function formatISODate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString();
}

export function getSlugFromPath(filePath) {
  const basename = filePath.split('/').pop().replace(/\.md$/, '');
  return basename;
}

export function processPosts(postModules) {
  const posts = Object.entries(postModules).map(([filePath, mod]) => {
    const slug = getSlugFromPath(filePath);
    const fm = mod.frontmatter || {};
    return {
      slug,
      filePath,
      Content: mod.Content,
      title: fm.title || slug,
      description: fm.description || '',
      date: fm.date || '2026-01-01',
      dateFormatted: formatChineseDate(fm.date),
      dateISO: formatISODate(fm.date),
      cover: fm.cover || '',
      category: fm.category || '未分类',
      words: fm.words ? `${fm.words} 字` : '2000 字',
      rawWords: fm.words || 2000,
      headings: mod.headings || []
    };
  });

  // 按日期降序排序 (最新在前)
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
}
