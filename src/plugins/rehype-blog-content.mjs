// src/plugins/rehype-blog-content.mjs
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

export default function rehypeBlogContent() {
  return function transformer(tree) {
    function visit(node, parent, index) {
      if (!node) return;

      if (node.type === "element") {
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

        // 4. 外链自动注入 Favicon
        if (node.tagName === "a" && node.properties && node.properties.href) {
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
