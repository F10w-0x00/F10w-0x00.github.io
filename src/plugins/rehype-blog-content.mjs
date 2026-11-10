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

const EXT_CONFIG = {
  pdf: { label: 'PDF 文档', badge: 'PDF', themeColor: '#c75450', themeBg: 'rgba(199, 84, 80, 0.12)' },
  zip: { label: 'ZIP 压缩包', badge: 'ZIP', themeColor: '#b88636', themeBg: 'rgba(184, 134, 54, 0.12)' },
  rar: { label: 'RAR 压缩包', badge: 'RAR', themeColor: '#b88636', themeBg: 'rgba(184, 134, 54, 0.12)' },
  '7z': { label: '7Z 压缩包', badge: '7Z', themeColor: '#b88636', themeBg: 'rgba(184, 134, 54, 0.12)' },
  tar: { label: 'TAR 归档', badge: 'TAR', themeColor: '#b88636', themeBg: 'rgba(184, 134, 54, 0.12)' },
  gz: { label: 'GZ 压缩包', badge: 'GZ', themeColor: '#b88636', themeBg: 'rgba(184, 134, 54, 0.12)' },
  dmg: { label: 'macOS 镜像', badge: 'DMG', themeColor: '#4a7c91', themeBg: 'rgba(74, 124, 145, 0.12)' },
  pkg: { label: 'macOS 安装包', badge: 'PKG', themeColor: '#4a7c91', themeBg: 'rgba(74, 124, 145, 0.12)' },
  exe: { label: 'Windows 程序', badge: 'EXE', themeColor: '#4b6e96', themeBg: 'rgba(75, 110, 150, 0.12)' },
  apk: { label: 'Android 安装包', badge: 'APK', themeColor: '#4d8b67', themeBg: 'rgba(77, 139, 103, 0.12)' },
  ipa: { label: 'iOS 安装包', badge: 'IPA', themeColor: '#4a7c91', themeBg: 'rgba(74, 124, 145, 0.12)' },
  epub: { label: 'EPUB 电子书', badge: 'EPUB', themeColor: '#7d6a91', themeBg: 'rgba(125, 106, 145, 0.12)' },
  mobi: { label: 'MOBI 电子书', badge: 'MOBI', themeColor: '#7d6a91', themeBg: 'rgba(125, 106, 145, 0.12)' },
  azw3: { label: 'Kindle 电子书', badge: 'AZW3', themeColor: '#7d6a91', themeBg: 'rgba(125, 106, 145, 0.12)' },
  doc: { label: 'Word 文档', badge: 'DOC', themeColor: '#4b7194', themeBg: 'rgba(75, 113, 148, 0.12)' },
  docx: { label: 'Word 文档', badge: 'DOCX', themeColor: '#4b7194', themeBg: 'rgba(75, 113, 148, 0.12)' },
  xls: { label: 'Excel 表格', badge: 'XLS', themeColor: '#3f7e59', themeBg: 'rgba(63, 126, 89, 0.12)' },
  xlsx: { label: 'Excel 表格', badge: 'XLSX', themeColor: '#3f7e59', themeBg: 'rgba(63, 126, 89, 0.12)' },
  ppt: { label: 'PPT 演示', badge: 'PPT', themeColor: '#a85d47', themeBg: 'rgba(168, 93, 71, 0.12)' },
  pptx: { label: 'PPT 演示', badge: 'PPTX', themeColor: '#a85d47', themeBg: 'rgba(168, 93, 71, 0.12)' },
  mp3: { label: '音频文件', badge: 'MP3', themeColor: '#9c5471', themeBg: 'rgba(156, 84, 113, 0.12)' },
  wav: { label: '音频文件', badge: 'WAV', themeColor: '#9c5471', themeBg: 'rgba(156, 84, 113, 0.12)' },
  flac: { label: '无损音频', badge: 'FLAC', themeColor: '#9c5471', themeBg: 'rgba(156, 84, 113, 0.12)' },
  mp4: { label: '视频文件', badge: 'MP4', themeColor: '#6c628e', themeBg: 'rgba(108, 98, 142, 0.12)' },
  mov: { label: '视频文件', badge: 'MOV', themeColor: '#6c628e', themeBg: 'rgba(108, 98, 142, 0.12)' },
  txt: { label: '文本文件', badge: 'TXT', themeColor: '#6b7280', themeBg: 'rgba(107, 114, 128, 0.12)' },
  csv: { label: 'CSV 数据', badge: 'CSV', themeColor: '#3f7e59', themeBg: 'rgba(63, 126, 89, 0.12)' }
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
    function visit(node, parent, index) {
      if (!node) return;

      if (node.type === "element") {
        // 0. 单行文件引用自动转换为下载卡片（方案 1.1 双行排版 + 语法 A 自动探测）
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
            const isDownloadable = isExplicitDownload || isFilesDir || (ext && EXT_CONFIG[ext]);

            if (isDownloadable) {
              const decodedClean = decodeURIComponent(cleanUrl);
              const physicalName = path.basename(decodedClean) || "download";
              let fileSizeBytes = null;

              if (!href.startsWith("http://") && !href.startsWith("https://") && !href.startsWith("//")) {
                const relativePath = decodedClean.replace(/^\//, "");
                const localPath = path.resolve(process.cwd(), "public", relativePath);
                try {
                  if (fs.existsSync(localPath)) {
                    const st = fs.statSync(localPath);
                    if (st.isFile()) fileSizeBytes = st.size;
                  }
                } catch (e) {}
              }

              const formattedSize = formatBytes(fileSizeBytes);
              const extConfig = EXT_CONFIG[ext] || {
                label: ext ? `${ext.toUpperCase()} 文件` : "文件下载",
                badge: ext ? ext.toUpperCase().slice(0, 4) : "FILE",
                themeColor: "#6b7280",
                themeBg: "rgba(107, 114, 128, 0.12)"
              };

              const rawUserText = getNodeDeepText(aNode).trim();
              let displayTitle = physicalName;
              if (rawUserText && rawUserText !== href && rawUserText !== cleanUrl) {
                displayTitle = rawUserText;
              }

              // 方案 1.1: 第二行统一展示「格式 · 文件大小」，如「PDF 文档 · 2.4 MB」，保持清爽无冗余
              const displayMeta = formattedSize ? `${extConfig.label} · ${formattedSize}` : extConfig.label;

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
                  tagName: "div",
                  properties: {
                    className: ["file-asset-icon-box"],
                    style: `--file-theme-color: ${extConfig.themeColor}; --file-theme-bg: ${extConfig.themeBg};`
                  },
                  children: [
                    {
                      type: "element",
                      tagName: "svg",
                      properties: {
                        className: ["file-asset-icon-svg"],
                        viewBox: "0 0 32 32",
                        fill: "none",
                        width: 28,
                        height: 28,
                        ariaHidden: "true",
                        focusable: "false"
                      },
                      children: [
                        {
                          type: "element",
                          tagName: "path",
                          properties: {
                            d: "M6 5C6 3.89543 6.89543 3 8 3H19L26 10V27C26 28.1046 25.1046 29 24 29H8C6.89543 29 6 28.1046 6 27V5Z",
                            fill: "currentColor",
                            fillOpacity: "0.12",
                            stroke: "currentColor",
                            strokeWidth: "1.8",
                            strokeLinejoin: "round"
                          },
                          children: []
                        },
                        {
                          type: "element",
                          tagName: "path",
                          properties: {
                            d: "M19 3V10H26",
                            stroke: "currentColor",
                            strokeWidth: "1.8",
                            strokeLinejoin: "round"
                          },
                          children: []
                        }
                      ]
                    },
                    {
                      type: "element",
                      tagName: "span",
                      properties: { className: ["file-asset-ext-badge"] },
                      children: [{ type: "text", value: extConfig.badge }]
                    }
                  ]
                },
                {
                  type: "element",
                  tagName: "div",
                  properties: { className: ["file-asset-body"] },
                  children: [
                    {
                      type: "element",
                      tagName: "div",
                      properties: { className: ["file-asset-title"], title: displayTitle },
                      children: [{ type: "text", value: displayTitle }]
                    },
                    {
                      type: "element",
                      tagName: "div",
                      properties: { className: ["file-asset-meta"] },
                      children: [{ type: "text", value: displayMeta }]
                    }
                  ]
                },
                {
                  type: "element",
                  tagName: "div",
                  properties: { className: ["file-asset-action"] },
                  children: [
                    {
                      type: "element",
                      tagName: "span",
                      properties: { className: ["file-asset-btn"] },
                      children: [
                        {
                          type: "element",
                          tagName: "svg",
                          properties: {
                            className: ["file-asset-download-arrow"],
                            viewBox: "0 0 24 24",
                            fill: "none",
                            stroke: "currentColor",
                            strokeWidth: "2",
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            width: 15,
                            height: 15,
                            ariaHidden: "true"
                          },
                          children: [
                            {
                              type: "element",
                              tagName: "path",
                              properties: { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" },
                              children: []
                            },
                            {
                              type: "element",
                              tagName: "polyline",
                              properties: { points: "7 10 12 15 17 10" },
                              children: []
                            },
                            {
                              type: "element",
                              tagName: "line",
                              properties: { x1: "12", y1: "15", x2: "12", y2: "3" },
                              children: []
                            }
                          ]
                        },
                        {
                          type: "element",
                          tagName: "span",
                          properties: { className: ["file-asset-btn-text"] },
                          children: [{ type: "text", value: "下载" }]
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
            } catch(e) {}
          }
        }
      }

      if (node.children && Array.isArray(node.children)) {
        for (let i = 0; i < node.children.length; i++) {
          visit(node.children[i], node, i);
        }
      }
    }

    visit(tree, null, 0);
  };
}
