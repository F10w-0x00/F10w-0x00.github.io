// src/integrations/post-attachments.mjs
// 将文章同目录（posts/<slug>/assets/...）中的下载附件自动接入 dev 服务器与静态构建产物
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const POST_ASSETS_PREFIX = '/post-assets/';

const MIME_TYPES = {
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.gz': 'application/gzip',
  '.tar': 'application/x-tar',
  '.7z': 'application/x-7z-compressed',
  '.rar': 'application/vnd.rar',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.epub': 'application/epub+zip',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.flac': 'audio/flac',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
};

function walkHtmlFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkHtmlFiles(full));
    } else if (entry.name.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

function decodePathSegments(urlPath) {
  return urlPath
    .split('/')
    .filter(Boolean)
    .map((seg) => {
      try {
        return decodeURIComponent(seg);
      } catch {
        return seg;
      }
    });
}

export default function postAttachments() {
  const postsDir = path.resolve(process.cwd(), 'posts');

  return {
    name: 'post-attachments',
    hooks: {
      // 开发模式（pnpm dev）直接从 posts/ 实时提供 /post-assets/ 附件下载
      'astro:server:setup': ({ server }) => {
        server.middlewares.use((req, res, next) => {
          const rawUrl = req.url ? req.url.split('?')[0] : '';
          if (!rawUrl.startsWith(POST_ASSETS_PREFIX)) {
            return next();
          }

          const relUrl = rawUrl.slice(POST_ASSETS_PREFIX.length);
          const segments = decodePathSegments(relUrl);
          if (segments.length === 0) return next();

          const localPath = path.resolve(postsDir, ...segments);
          if (!localPath.startsWith(postsDir + path.sep) || !fs.existsSync(localPath) || !fs.statSync(localPath).isFile()) {
            res.statusCode = 404;
            res.end('Not Found');
            return;
          }

          const ext = path.extname(localPath).toLowerCase();
          res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
          fs.createReadStream(localPath).pipe(res);
        });
      },

      // 生产构建（pnpm build）仅拷贝已发布 HTML 实际引用的附件至 dist/post-assets/
      'astro:build:done': ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        const htmlFiles = walkHtmlFiles(outDir);
        const referenced = new Set();

        for (const htmlPath of htmlFiles) {
          const html = fs.readFileSync(htmlPath, 'utf8');
          for (const match of html.matchAll(/href="(\/post-assets\/[^"#?]+)"/g)) {
            referenced.add(match[1]);
          }
        }

        let copiedCount = 0;
        for (const assetUrl of referenced) {
          const relUrl = assetUrl.slice(POST_ASSETS_PREFIX.length);
          const segments = decodePathSegments(relUrl);
          const srcPath = path.resolve(postsDir, ...segments);

          if (!srcPath.startsWith(postsDir + path.sep) || !fs.existsSync(srcPath) || !fs.statSync(srcPath).isFile()) {
            throw new Error(`[post-attachments] 引用的文章附件不存在: ${assetUrl} -> ${srcPath}`);
          }

          const dstPath = path.resolve(outDir, 'post-assets', ...segments);
          fs.mkdirSync(path.dirname(dstPath), { recursive: true });
          fs.copyFileSync(srcPath, dstPath);
          copiedCount++;
        }

        if (copiedCount > 0) {
          logger.info(`Copied ${copiedCount} co-located post attachment(s) to dist/post-assets/`);
        }
      },
    },
  };
}
