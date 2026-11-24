// src/plugins/rehype-blog-content.mjs
import fs from 'node:fs';
import path from 'node:path';

const faviconMap = {
  "obsidian.md": "/favicons/external-links/obsidian-md.ico",
  "bilibili.com": "/favicons/external-links/bilibili-com.ico",
  "space.bilibili.com": "/favicons/external-links/bilibili-com.ico",
  "www.bilibili.com": "/favicons/external-links/bilibili-com.ico",
  "apple.com": "/favicons/external-links/www-apple-com-cn.ico",
  "apple.com.cn": "/favicons/external-links/www-apple-com-cn.ico",
  "www.apple.com.cn": "/favicons/external-links/www-apple-com-cn.ico",
  "github.com": "/favicons/external-links/github-com.png",
  "yashjawale.github.io": "/favicons/external-links/yashjawale-github-io.png",
  "ggame.gledos.science": "/favicons/external-links/ggame-gledos-science.png",
  "zh.wikipedia.org": "/favicons/external-links/zh-wikipedia-org.ico"
};

const EXT_LABELS = {
  pdf: 'PDF 文档',
  md: 'Markdown 文档',
  txt: '文本文件',
  csv: 'CSV 数据',
  zip: 'ZIP 压缩包',
  rar: 'RAR 压缩包',
  '7z': '7Z 压缩包',
  tar: 'TAR 归档',
  gz: 'GZ 压缩包',
  dmg: 'macOS 镜像',
  pkg: 'macOS 安装包',
  exe: 'Windows 程序',
  msi: 'Windows 安装包',
  apk: 'Android 安装包',
  ipa: 'iOS 安装包',
  epub: 'EPUB 电子书',
  mobi: 'MOBI 电子书',
  azw3: 'Kindle 电子书',
  doc: 'Word 文档',
  docx: 'Word 文档',
  xls: 'Excel 表格',
  xlsx: 'Excel 表格',
  ppt: 'PPT 演示',
  pptx: 'PPT 演示',
  mp3: '音频文件',
  wav: '音频文件',
  flac: '无损音频',
  mp4: '视频文件',
  mov: '视频文件'
};

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getNodeDeepText(n) {
  if (!n) return '';
  if (n.type === 'text') return n.value || '';
  if (n.children && Array.isArray(n.children)) {
    return n.children.map(getNodeDeepText).join('');
  }
  return '';
}

export default function rehypeBlogContent() {
  return function transformer(tree) {
    function visit(node) {
      if (!node) return;

      if (node.type === "element") {
        // 0. 单行文件引用自动转换为极简附件下载卡片
        if (node.tagName === "p" && node.children && Array.isArray(node.children)) {
          const nonWhitespace = node.children.filter(c => !(c.type === "text" && !c.value.trim()));
          if (nonWhitespace.length === 1 && nonWhitespace[0].tagName === "a") {
            const aNode = nonWhitespace[0];
            let href = (aNode.properties && aNode.properties.href) ? String(aNode.properties.href).trim() : "";
            const isExplicitDownload = href.startsWith("download:") || aNode.properties?.download !== undefined;
            if (href.startsWith("download:")) {
              href = href.replace(/^download:/, "");
            }
            const cleanUrl = href.split("?")[0].split("#")[0];
            const extMatch = cleanUrl.match(/\.([a-z0-9]+)$/i);
            const ext = extMatch ? extMatch[1].toLowerCase() : "";
            const isFilesDir = cleanUrl.includes("/files/");
            const isDownloadable = isExplicitDownload || isFilesDir || (ext && EXT_LABELS[ext]);

            if (isDownloadable) {
              let decodedClean = cleanUrl;
              try {
                decodedClean = decodeURIComponent(cleanUrl);
              } catch {}
              const physicalName = path.basename(decodedClean) || "download";
              let fileSizeBytes = null;

              if (!href.startsWith("http://") && !href.startsWith("https://") && !href.startsWith("//")) {
                const publicDir = path.resolve(process.cwd(), "public");
                const relativePath = decodedClean.replace(/^\/+/, "");
                const localPath = path.resolve(publicDir, relativePath);
                if (localPath.startsWith(publicDir + path.sep)) {
                  try {
                    if (fs.existsSync(localPath)) {
                      const st = fs.statSync(localPath);
                      if (st.isFile()) fileSizeBytes = st.size;
                    }
                  } catch (e) {}
                }
              }

              const formattedSize = formatBytes(fileSizeBytes);
              const typeLabel = EXT_LABELS[ext] || (ext ? `${ext.toUpperCase()} 文件` : "文件");
              const rawUserText = getNodeDeepText(aNode).trim();
              let displayTitle = physicalName;
              if (rawUserText && rawUserText !== href && rawUserText !== cleanUrl) {
                displayTitle = rawUserText;
              }
              const displayMeta = formattedSize ? `${typeLabel} · ${formattedSize}` : typeLabel;

              node.tagName = "a";
              node.properties = {
                href: href,
                download: physicalName,
                className: ["file-asset-card"],
                target: "_blank",
                rel: "noopener noreferrer",
                "data-file-ext": ext || "file",
                title: `${displayTitle} (${physicalName})`
              };
              node.children = [
                {
                  type: "element",
                  tagName: "span",
                  properties: { className: ["file-asset-icon"], ariaHidden: "true" },
                  children: [
                    {
                      type: "element",
                      tagName: "svg",
                      properties: {
                        viewBox: "0 0 24 24",
                        fill: "none",
                        stroke: "currentColor",
                        strokeWidth: "1.85",
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        width: 19,
                        height: 19,
                        ariaHidden: "true",
                        focusable: "false"
                      },
                      children: [
                        {
                          type: "element",
                          tagName: "path",
                          properties: {
                            d: "M14.5 3.5H7.5A2 2 0 0 0 5.5 5.5v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8.5L14.5 3.5Z"
                          },
                          children: []
                        },
                        {
                          type: "element",
                          tagName: "path",
                          properties: { d: "M14 3.5v4.5a1 1 0 0 0 1 1h3.5" },
                          children: []
                        }
                      ]
                    }
                  ]
                },
                {
                  type: "element",
                  tagName: "span",
                  properties: { className: ["file-asset-body"] },
                  children: [
                    {
                      type: "element",
                      tagName: "span",
                      properties: { className: ["file-asset-title"] },
                      children: [{ type: "text", value: displayTitle }]
                    },
                    {
                      type: "element",
                      tagName: "span",
                      properties: { className: ["file-asset-meta"] },
                      children: [{ type: "text", value: displayMeta }]
                    }
                  ]
                },
                {
                  type: "element",
                  tagName: "span",
                  properties: { className: ["file-asset-download"], ariaHidden: "true" },
                  children: [
                    {
                      type: "element",
                      tagName: "svg",
                      properties: {
                        viewBox: "0 0 24 24",
                        fill: "none",
                        stroke: "currentColor",
                        strokeWidth: "1.85",
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        width: 20,
                        height: 20,
                        ariaHidden: "true",
                        focusable: "false"
                      },
                      children: [
                        {
                          type: "element",
                          tagName: "path",
                          properties: { d: "M12 4.5v11" },
                          children: []
                        },
                        {
                          type: "element",
                          tagName: "path",
                          properties: { d: "m7.75 11.25 4.25 4.25 4.25-4.25" },
                          children: []
                        },
                        {
                          type: "element",
                          tagName: "path",
                          properties: { d: "M5.5 19.5h13" },
                          children: []
                        }
                      ]
                    }
                  ]
                }
              ];
              return;
            }
          }
        }

        // 1. 图注 Figure 转换: p > img[title]
        if (node.tagName === "p" && node.children && node.children.length === 1 && node.children[0].tagName === "img") {
          const img = node.children[0];
          const title = img.properties && (img.properties.title || img.properties["data-caption"]);
          if (title) {
            node.tagName = "figure";
            node.properties = node.properties || {};
            node.properties.className = ["post-image-figure"];
            img.properties.loading = "lazy";
            img.properties.decoding = "async";
            node.children = [
              img,
              {
                type: "element",
                tagName: "figcaption",
                properties: { className: ["post-image-caption"] },
                children: [{ type: "text", value: title }]
              }
            ];
          }
        }

        // 2. 独立 img 补充 loading/decoding
        if (node.tagName === "img") {
          node.properties = node.properties || {};
          node.properties.loading = node.properties.loading || "lazy";
          node.properties.decoding = node.properties.decoding || "async";
        }

        // 3. Callout 提示框转换
        if (node.tagName === "blockquote") {
          const firstP = node.children && node.children.find(c => c.tagName === "p");
          if (firstP && firstP.children && firstP.children[0] && firstP.children[0].type === "text") {
            const firstText = firstP.children[0].value;
            const match = firstText.match(/^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)(?:[ \t]+([^\]]+))?\](?:[ \t]+([^\n]+))?/i);
            if (match) {
              const alertType = match[1].toLowerCase();
              const tagModifier = match[2] ? match[2].trim() : "";
              const outsideTitle = match[3] ? match[3].trim() : "";
              const isIconOnly = tagModifier === "CALLOUT-ICON-ONLY" || outsideTitle === "CALLOUT-ICON-ONLY";
              const customTitle = isIconOnly ? "" : (outsideTitle || tagModifier);

              node.properties = node.properties || {};
              node.properties.className = isIconOnly
                ? ["callout", `callout-${alertType}`, "callout-icon-only"]
                : ["callout", `callout-${alertType}`];

              // 剥离 [!TYPE] 标记
              const remainingText = firstText.substring(match[0].length).replace(/^\n+/, "");
              if (remainingText.trim()) {
                firstP.children[0].value = remainingText;
              } else {
                firstP.children.shift();
              }

              // 在前面插入 callout-title（仅在非 icon-only 时）
              if (!isIconOnly) {
                const titleText = customTitle || alertType.toUpperCase();
                node.children.unshift({
                  type: "element",
                  tagName: "p",
                  properties: { className: ["callout-title"] },
                  children: [{ type: "text", value: titleText }]
                });
              }

              // 如果首个 p 为空则移除
              if (firstP.children.length === 0) {
                const pIdx = node.children.indexOf(firstP);
                if (pIdx !== -1) node.children.splice(pIdx, 1);
              }
            }
          }
        }

        // 4. 外链自动注入 Favicon（跳过下载卡片）
        if (node.tagName === "a" && node.properties && node.properties.href) {
          if (node.properties.className && (
            node.properties.className.includes("file-asset-card") ||
            (Array.isArray(node.properties.className) && node.properties.className.includes("file-asset-card"))
          )) {
            return;
          }

          const href = String(node.properties.href);
          if (href.startsWith("http://") || href.startsWith("https://")) {
            try {
              const url = new URL(href);
              const host = url.hostname.replace(/^www\./, "");
              if (!host.includes("f10w-0x00.github.io")) {
                node.properties.target = "_blank";
                node.properties.rel = "noopener noreferrer";
                node.properties.className = node.properties.className || [];
                if (!node.properties.className.includes("external-link-with-favicon")) {
                  node.properties.className.push("external-link-with-favicon");
                }
                node.properties["data-link-reading-kind"] = "external";

                let iconSrc = null;
                for (const [domain, iconPath] of Object.entries(faviconMap)) {
                  if (url.hostname === domain || url.hostname.endsWith("." + domain)) {
                    iconSrc = iconPath;
                    break;
                  }
                }

                if (iconSrc) {
                  const hasFavicon = node.children && node.children.some(c => c.tagName === "img" && c.properties && c.properties.className && c.properties.className.includes("external-link-favicon"));
                  if (!hasFavicon) {
                    node.children.unshift({
                      type: "element",
                      tagName: "img",
                      properties: {
                        src: iconSrc,
                        alt: "",
                        className: ["external-link-favicon"],
                        width: 16,
                        height: 16,
                        loading: "lazy",
                        decoding: "async",
                        ariaHidden: "true"
                      },
                      children: []
                    });
                  }
                }
              }
            } catch (e) {}
          }
        }
      }

      if (node.children && Array.isArray(node.children)) {
        for (let i = 0; i < node.children.length; i++) {
          visit(node.children[i]);
        }
      }
    }

    visit(tree);
  };
}
