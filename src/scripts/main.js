// src/scripts/main.js
// 统一客户端交互主脚本：包含网站设置、已读文章标记、代码块增强（复制与折叠）

(() => {
  const STORAGE_PREFIX = 'KenShelter';

  // ==========================================
  // 1. 网站设置抽屉面板与偏好切换
  // ==========================================
  function initSettingsPanel() {
    const toggleBtn = document.querySelector('[data-settings-toggle]');
    const panel = document.querySelector('[data-settings-panel]');
    if (!toggleBtn || !panel) return;

    function updateActiveOptions() {
      const currentTheme = document.documentElement.dataset.themeMode || 'auto';
      const currentFontSize = document.documentElement.dataset.fontSize || 'm';
      const currentWidth = document.documentElement.dataset.contentWidth || 'm';

      document.querySelectorAll('[data-setting-option]').forEach(btn => {
        const name = btn.getAttribute('data-setting-name');
        const val = btn.getAttribute('data-setting-value');
        let isActive = false;
        if (name === 'theme' && val === currentTheme) isActive = true;
        if (name === 'fontSize' && val === currentFontSize) isActive = true;
        if (name === 'contentWidth' && val === currentWidth) isActive = true;
        btn.setAttribute('aria-pressed', String(isActive));
      });
    }

    function openPanel() {
      panel.hidden = false;
      toggleBtn.setAttribute('aria-expanded', 'true');
      updateActiveOptions();
    }

    function closePanel() {
      panel.hidden = true;
      toggleBtn.setAttribute('aria-expanded', 'false');
    }

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (panel.hidden) openPanel();
      else closePanel();
    });

    document.addEventListener('click', (e) => {
      if (!panel.hidden && !panel.contains(e.target) && !toggleBtn.contains(e.target)) {
        closePanel();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !panel.hidden) {
        closePanel();
        toggleBtn.focus();
      }
    });

    document.querySelectorAll('[data-setting-option]').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-setting-name');
        const val = btn.getAttribute('data-setting-value');
        if (!name || !val) return;

        try {
          if (name === 'theme') {
            document.documentElement.dataset.themeMode = val;
            if (val === 'auto') {
              delete document.documentElement.dataset.theme;
              localStorage.removeItem(`${STORAGE_PREFIX}-theme`);
            } else {
              document.documentElement.dataset.theme = val;
              localStorage.setItem(`${STORAGE_PREFIX}-theme`, val);
            }
          } else if (name === 'fontSize') {
            document.documentElement.dataset.fontSize = val;
            localStorage.setItem(`${STORAGE_PREFIX}-font-size`, val);
          } else if (name === 'contentWidth') {
            document.documentElement.dataset.contentWidth = val;
            localStorage.setItem(`${STORAGE_PREFIX}-content-width`, val);
          }
        } catch (e) {}

        updateActiveOptions();
      });
    });

    updateActiveOptions();
  }

  // ==========================================
  // 2. 已读博文（Visited Checkmark）本地标记
  // ==========================================
  function initVisitedMarks() {
    const visitedKey = `${STORAGE_PREFIX}-visited-posts`;

    function getVisitedSet() {
      try {
        return new Set(JSON.parse(localStorage.getItem(visitedKey) || '[]'));
      } catch {
        return new Set();
      }
    }

    function saveVisited(slug) {
      if (!slug) return;
      try {
        const visited = getVisitedSet();
        visited.add(slug);
        localStorage.setItem(visitedKey, JSON.stringify([...visited]));
      } catch {}
    }

    function updateMarks() {
      const visited = getVisitedSet();
      document.querySelectorAll('[data-reading-post-slug]').forEach(card => {
        const slug = card.getAttribute('data-reading-post-slug');
        const icon = card.querySelector('[data-post-visited-icon]');
        if (slug && icon) {
          icon.classList.toggle('is-visited', visited.has(slug));
        }
      });
    }

    // 若当前正在阅读某文章，自动记为已读
    const readingElem = document.querySelector('[data-post-reading]');
    if (readingElem) {
      const slug = readingElem.getAttribute('data-reading-post-slug');
      if (slug) saveVisited(slug);
    }

    // 监听列表点击立即打勾
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href*="/blog/20"]');
      const card = link ? link.closest('[data-reading-post-slug]') : null;
      if (card) {
        const slug = card.getAttribute('data-reading-post-slug');
        if (slug) {
          saveVisited(slug);
          const icon = card.querySelector('[data-post-visited-icon]');
          if (icon) icon.classList.add('is-visited');
        }
      }
    }, { passive: true });

    updateMarks();
  }

  // ==========================================
  // 3. 代码块增强（复制按钮与长代码折叠）
  // ==========================================
  function initCodeBlocks() {
    const COPY_SVG = `<svg class="code-copy-button__copy-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg><svg class="code-copy-button__success-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    const CHEVRON_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"></path></svg>`;

    document.querySelectorAll('.prose pre').forEach((pre, idx) => {
      if (pre.dataset.codeReady === 'true') return;
      pre.dataset.codeReady = 'true';

      const code = pre.querySelector('code');
      const rawText = code ? code.textContent || '' : pre.textContent || '';
      const lines = rawText.replace(/\n$/, '').split('\n');

      // 提取代码语言
      const lang = pre.getAttribute('data-language') || pre.className.match(/language-(\w+)/)?.[1] || '';

      // 外层包装容器 .code-block
      const wrapper = document.createElement('div');
      wrapper.className = 'code-block';
      if (lang) wrapper.dataset.codeLanguage = lang;

      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.append(pre);

      // 复制按钮
      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'code-copy-button';
      copyBtn.setAttribute('aria-label', `复制代码块 ${idx + 1}`);
      copyBtn.title = '复制代码';
      copyBtn.innerHTML = COPY_SVG;

      let resetTimer;
      copyBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        clearTimeout(resetTimer);
        try {
          await navigator.clipboard.writeText(rawText);
          copyBtn.dataset.state = 'copied';
          copyBtn.setAttribute('aria-label', '已复制');
        } catch {
          copyBtn.dataset.state = 'error';
        }
        resetTimer = setTimeout(() => {
          delete copyBtn.dataset.state;
          copyBtn.setAttribute('aria-label', `复制代码块 ${idx + 1}`);
        }, 1500);
      });

      pre.prepend(copyBtn);

      // 超过 10 行时触发折叠
      if (lines.length > 10) {
        wrapper.classList.add('collapsible-code-block', 'collapsible-block', 'is-collapsed');
        pre.classList.add('collapsible-block-content');

        // 计算折叠高度：7 行高度 + paddingTop + paddingBottom
        const computed = window.getComputedStyle(pre);
        const lineHeight = parseFloat(computed.lineHeight) || 24;
        const padTop = parseFloat(computed.paddingTop) || 24;
        const padBottom = parseFloat(computed.paddingBottom) || 24;
        const collapsedHeight = lineHeight * 7 + padTop + padBottom;

        pre.style.setProperty('--collapsible-collapsed-height', `${collapsedHeight}px`);
        pre.style.setProperty('--collapsible-expanded-height', `${pre.scrollHeight + 40}px`);

        // 折叠切换按钮
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'collapsible-block-toggle';
        toggleBtn.setAttribute('aria-label', '展开代码块');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.title = '展开';
        toggleBtn.innerHTML = `<span>展开</span>${CHEVRON_SVG}`;

        // 底部渐隐点击展开层
        const revealBtn = document.createElement('button');
        revealBtn.type = 'button';
        revealBtn.className = 'collapsible-block-reveal';
        revealBtn.setAttribute('aria-label', '展开代码块');
        revealBtn.title = '展开';

        function toggleCollapse(expand) {
          const isCollapsed = typeof expand === 'boolean' ? !expand : wrapper.classList.contains('is-collapsed');
          wrapper.classList.toggle('is-collapsed', !isCollapsed);
          const nowExpanded = !wrapper.classList.contains('is-collapsed');
          toggleBtn.setAttribute('aria-expanded', String(nowExpanded));
          toggleBtn.title = nowExpanded ? '收起' : '展开';
          toggleBtn.setAttribute('aria-label', `${nowExpanded ? '收起' : '展开'}代码块`);
          toggleBtn.querySelector('span').textContent = nowExpanded ? '收起' : '展开';

          if (nowExpanded) {
            pre.style.maxHeight = 'none';
          } else {
            pre.style.removeProperty('max-height');
          }
        }

        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleCollapse();
        });
        revealBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleCollapse(true);
        });

        copyBtn.after(toggleBtn);
        wrapper.append(revealBtn);
      }
    });
  }

  // ==========================================
  // 4. 初始化入口
  // ==========================================
  function initAll() {
    initSettingsPanel();
    initVisitedMarks();
    initCodeBlocks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll, { once: true });
  } else {
    initAll();
  }

  document.addEventListener('astro:page-load', initAll);
})();
