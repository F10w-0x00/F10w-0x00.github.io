// src/scripts/main.js
// 统一客户端交互主脚本：包含网站设置、已读文章标记与代码块复制增强

(() => {
  const STORAGE_PREFIX = document.documentElement.dataset.storageNamespace || 'KenShelter';

  // ==========================================
  // 1. 网站设置抽屉面板与偏好切换（分段控制器平滑滑动）
  // ==========================================
  let settingsGlobalBound = false;
  let activeCloseSettingsPanel = null;
  let activeFocusSettingsToggle = null;

  function initSettingsPanel() {
    const toggleBtn = document.querySelector('[data-settings-toggle]');
    const panel = document.querySelector('[data-settings-panel]');
    if (!toggleBtn || !panel) return;
    if (panel.dataset.settingsReady === 'true') return;
    panel.dataset.settingsReady = 'true';

    const isReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const getSystemTheme = () => (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const resolveTheme = (t) => (t === 'light' || t === 'dark' ? t : getSystemTheme());

    const updateSettingState = (name, value) => {
      const btns = Array.from(document.querySelectorAll(`[data-setting-option][data-setting-name="${name}"]`));
      const activeIdx = btns.findIndex((b) => b.dataset.settingValue === value);
      const control = btns[0]?.closest('.segmented-control');
      if (control && activeIdx >= 0) {
        control.dataset.activeIndex = String(activeIdx);
      }
      btns.forEach((b) => {
        const isActive = b.dataset.settingValue === value;
        b.classList.toggle('is-active', isActive);
        b.setAttribute('aria-pressed', String(isActive));
      });
    };

    let themeTransitionCounter = 0;
    const setThemeWithTransition = (newThemeMode, onApplied, animateTheme = false) => {
      const curResolved = resolveTheme(document.documentElement.dataset.themeMode || 'auto');
      const targetResolved = resolveTheme(newThemeMode);
      const viewTransition = document.startViewTransition?.bind(document);

      const applyTheme = () => {
        if (newThemeMode === 'auto') {
          delete document.documentElement.dataset.theme;
          try {
            localStorage.removeItem(`${STORAGE_PREFIX}-theme`);
          } catch {}
        } else {
          document.documentElement.dataset.theme = newThemeMode;
          try {
            localStorage.setItem(`${STORAGE_PREFIX}-theme`, newThemeMode);
          } catch {}
        }
        document.documentElement.dataset.themeMode = newThemeMode;
        onApplied();
      };

      if (!(animateTheme && curResolved !== targetResolved && !isReducedMotion() && typeof viewTransition === 'function')) {
        applyTheme();
        return;
      }

      const transitionClass = targetResolved === 'dark' ? 'is-theme-transition-to-dark' : 'is-theme-transition-to-light';
      const curCount = ++themeTransitionCounter;
      document.documentElement.classList.remove('is-theme-transition-to-dark', 'is-theme-transition-to-light');
      document.documentElement.classList.add('is-theme-transitioning', transitionClass);
      document.documentElement.offsetHeight; // trigger reflow

      const cleanup = () => {
        if (themeTransitionCounter === curCount) {
          document.documentElement.classList.remove('is-theme-transitioning', transitionClass);
        }
      };

      try {
        viewTransition(() => {
          applyTheme();
        }).finished.then(cleanup, cleanup);
      } catch {
        cleanup();
        applyTheme();
      }
    };

    const applySetting = (name, val, options = {}) => {
      try {
        if (name === 'theme') {
          setThemeWithTransition(val, () => updateSettingState(name, val), Boolean(options.animateTheme));
          return;
        } else if (name === 'fontSize') {
          document.documentElement.dataset.fontSize = val;
          localStorage.setItem(`${STORAGE_PREFIX}-font-size`, val);
        } else if (name === 'contentWidth') {
          document.documentElement.dataset.contentWidth = val;
          localStorage.setItem(`${STORAGE_PREFIX}-content-width`, val);
        }
      } catch (e) {}

      updateSettingState(name, val);
    };

    function syncAllSettings() {
      const currentTheme = document.documentElement.dataset.themeMode || localStorage.getItem(`${STORAGE_PREFIX}-theme`) || 'auto';
      const currentFontSize = document.documentElement.dataset.fontSize || localStorage.getItem(`${STORAGE_PREFIX}-font-size`) || 'm';
      const currentWidth = document.documentElement.dataset.contentWidth || localStorage.getItem(`${STORAGE_PREFIX}-content-width`) || 'm';

      updateSettingState('theme', currentTheme);
      updateSettingState('fontSize', currentFontSize);
      updateSettingState('contentWidth', currentWidth);
    }

    let closeTimer;
    function finishClose() {
      clearTimeout(closeTimer);
      panel.hidden = true;
      panel.classList.remove('is-closing');
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.setAttribute('aria-label', '打开网站设置');
    }

    function closePanel() {
      if (panel.hidden || panel.classList.contains('is-closing')) return;
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.setAttribute('aria-label', '打开网站设置');
      if (isReducedMotion()) {
        finishClose();
        return;
      }
      panel.classList.add('is-closing');
      closeTimer = setTimeout(finishClose, 180);
    }

    function openPanel() {
      clearTimeout(closeTimer);
      panel.hidden = false;
      panel.classList.remove('is-closing');
      toggleBtn.setAttribute('aria-expanded', 'true');
      toggleBtn.setAttribute('aria-label', '关闭网站设置');
      syncAllSettings();
    }

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (panel.hidden || panel.classList.contains('is-closing')) openPanel();
      else closePanel();
    });

    activeCloseSettingsPanel = closePanel;
    activeFocusSettingsToggle = () => toggleBtn.focus({ preventScroll: true });

    if (!settingsGlobalBound) {
      settingsGlobalBound = true;
      document.addEventListener('pointerdown', (e) => {
        const curPanel = document.querySelector('[data-settings-panel]');
        const curToggle = document.querySelector('[data-settings-toggle]');
        if (curPanel && !curPanel.hidden && !curPanel.contains(e.target) && (!curToggle || !curToggle.contains(e.target))) {
          activeCloseSettingsPanel?.();
        }
      });

      document.addEventListener('keydown', (e) => {
        const curPanel = document.querySelector('[data-settings-panel]');
        if (e.key === 'Escape' && curPanel && !curPanel.hidden) {
          activeCloseSettingsPanel?.();
          activeFocusSettingsToggle?.();
        }
      });
    }

    panel.addEventListener('animationend', (e) => {
      if (e.target === panel && e.animationName === 'site-settings-panel-out' && panel.classList.contains('is-closing')) {
        finishClose();
      }
    });

    document.querySelectorAll('[data-setting-option]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-setting-name');
        const val = btn.getAttribute('data-setting-value');
        if (!name || !val) return;
        applySetting(name, val, { animateTheme: name === 'theme' });
      });
    });

    syncAllSettings();
  }

  // ==========================================
  // 2. 已读博文（Visited Checkmark）本地标记
  // ==========================================
  let visitedGlobalBound = false;

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
      document.querySelectorAll('[data-reading-post-slug]').forEach((card) => {
        const slug = card.getAttribute('data-reading-post-slug');
        const icon = card.querySelector('[data-post-visited-icon]');
        if (slug && icon) {
          icon.classList.toggle('is-visited', visited.has(slug));
        }
      });
    }

    const readingElem = document.querySelector('[data-post-reading]');
    if (readingElem) {
      const slug = readingElem.getAttribute('data-reading-post-slug');
      if (slug) saveVisited(slug);
    }

    if (!visitedGlobalBound) {
      visitedGlobalBound = true;
      // 监听返回上一页（BFCache 恢复）时同步更新已读状态
      window.addEventListener('pageshow', updateMarks);

      document.addEventListener(
        'click',
        (e) => {
          const link = e.target.closest('a[href^="/blog/"]');
          if (!link || link.getAttribute('href') === '/blog/' || link.getAttribute('href')?.startsWith('/blog/?')) return;
          const card = link.closest('[data-reading-post-slug]');
          if (card) {
            const slug = card.getAttribute('data-reading-post-slug');
            if (slug) {
              saveVisited(slug);
              const icon = card.querySelector('[data-post-visited-icon]');
              if (icon) icon.classList.add('is-visited');
            }
          }
        },
        { passive: true }
      );
    }

    updateMarks();
  }

  // ==========================================
  // 3. 代码块语言容器与一键复制按钮
  // ==========================================
  const COPY_SVG = `
    <svg class="code-copy-button__copy-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
    </svg>
    <svg class="code-copy-button__success-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  `;

  function initCodeBlocks() {
    document.querySelectorAll('.prose pre').forEach((pre, idx) => {
      if (pre.dataset.codeReady === 'true') return;
      pre.dataset.codeReady = 'true';

      const code = pre.querySelector('code');
      const rawText = code ? code.textContent || '' : pre.textContent || '';
      const lang = pre.getAttribute('data-language') || pre.className.match(/language-(\w+)/)?.[1] || '';

      const wrapper = document.createElement('div');
      wrapper.className = 'code-block';
      if (lang) wrapper.dataset.codeLanguage = lang;

      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.append(pre);

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
