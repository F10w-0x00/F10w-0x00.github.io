// src/scripts/main.js
// 统一客户端交互主脚本：包含网站设置、已读文章标记、代码块增强与长内容（代码/引用）渐隐折叠

(() => {
  const STORAGE_PREFIX = 'KenShelter';

  // ==========================================
  // 1. 网站设置抽屉面板与偏好切换（分段控制器平滑滑动）
  // ==========================================
  function initSettingsPanel() {
    const toggleBtn = document.querySelector('[data-settings-toggle]');
    const panel = document.querySelector('[data-settings-panel]');
    if (!toggleBtn || !panel) return;

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

    document.addEventListener('pointerdown', (e) => {
      if (!panel.hidden && !panel.contains(e.target) && !toggleBtn.contains(e.target)) {
        closePanel();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !panel.hidden) {
        closePanel();
        toggleBtn.focus({ preventScroll: true });
      }
    });

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

    document.addEventListener(
      'click',
      (e) => {
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
      },
      { passive: true }
    );

    updateMarks();
  }

  // ==========================================
  // 3. 通用长块（代码块 & 引用块）渐隐折叠与交互引擎
  // ==========================================
  const CHEVRON_SVG = `
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="m6 9 6 6 6-6"></path>
    </svg>
  `;
  const COPY_SVG = `
    <svg class="code-copy-button__copy-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
    </svg>
    <svg class="code-copy-button__success-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  `;

  const isReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const recalcFns = [];
  let recalcRafId = 0;

  const scheduleRecalc = () => {
    if (recalcRafId) return;
    recalcRafId = window.requestAnimationFrame(() => {
      recalcRafId = 0;
      recalcFns.forEach((fn) => fn());
    });
  };

  const getLineHeight = (el) => {
    const s = window.getComputedStyle(el);
    const lh = s.lineHeight;
    const num = Number.parseFloat(lh);
    if (Number.isFinite(num)) return num;
    const fs = Number.parseFloat(s.fontSize);
    return Number.isFinite(fs) ? fs * 1.6 : 24;
  };

  const getPadding = (el) => {
    const s = window.getComputedStyle(el);
    return Number.parseFloat(s.paddingTop) + Number.parseFloat(s.paddingBottom);
  };

  const setToggleState = (btn, isCollapsed, targetName) => {
    const actionText = isCollapsed ? '展开' : '收起';
    btn.innerHTML = `<span>${actionText}</span>${CHEVRON_SVG}`;
    btn.setAttribute('aria-expanded', String(!isCollapsed));
    btn.setAttribute('aria-label', `${actionText}${targetName}`);
    btn.title = actionText;
  };

  const updateExpandedHeight = (contentEl) => {
    const h = contentEl.scrollHeight + contentEl.offsetHeight - contentEl.clientHeight;
    contentEl.style.setProperty('--collapsible-expanded-height', `${h}px`);
  };

  const setCollapsedState = (wrapper, contentEl, toggleBtn, shouldCollapse) => {
    const targetName = toggleBtn.dataset.targetName || '内容';
    updateExpandedHeight(contentEl);
    wrapper.classList.toggle('is-collapsed', shouldCollapse);
    setToggleState(toggleBtn, shouldCollapse, targetName);
    if (!isReducedMotion()) {
      updateExpandedHeight(contentEl);
    }
  };

  const setupCollapsible = (wrapper, contentEl, calcHeightFn, targetName, options = {}) => {
    if (wrapper.dataset.collapsibleReady === 'true') return;
    wrapper.dataset.collapsibleReady = 'true';

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'collapsible-block-toggle';
    toggleBtn.dataset.targetName = targetName;
    setToggleState(toggleBtn, true, targetName);

    const revealBtn = document.createElement('button');
    revealBtn.type = 'button';
    revealBtn.className = 'collapsible-block-reveal';
    revealBtn.setAttribute('aria-label', `展开${targetName}`);
    revealBtn.title = `展开${targetName}`;

    wrapper.classList.add('collapsible-block', 'is-collapsed');
    contentEl.classList.add('collapsible-block-content');

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setCollapsedState(wrapper, contentEl, toggleBtn, !wrapper.classList.contains('is-collapsed'));
    });

    revealBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (wrapper.classList.contains('is-collapsed')) {
        setCollapsedState(wrapper, contentEl, toggleBtn, false);
      }
    });

    if (options.buttonPlacement === 'inside-start') {
      const afterElem = options.insertAfterSelector ? contentEl.querySelector(options.insertAfterSelector) : null;
      if (afterElem) {
        afterElem.after(toggleBtn);
      } else {
        contentEl.prepend(toggleBtn);
      }
    } else {
      wrapper.append(toggleBtn);
    }
    wrapper.append(revealBtn);

    const applyHeights = () => {
      const h = typeof calcHeightFn === 'function' ? calcHeightFn() : calcHeightFn;
      contentEl.style.setProperty('--collapsible-collapsed-height', `${h}px`);
      updateExpandedHeight(contentEl);
    };

    recalcFns.push(applyHeights);
    applyHeights();
  };

  // 代码块初始化（复制按钮 + 超过 10 行自动折叠）
  function initCodeBlocks() {
    document.querySelectorAll('.prose pre').forEach((pre, idx) => {
      if (pre.dataset.codeReady === 'true') return;
      pre.dataset.codeReady = 'true';

      const code = pre.querySelector('code');
      const rawText = code ? code.textContent || '' : pre.textContent || '';
      const lines = rawText.replace(/\n$/, '').split('\n');
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

      if (lines.length > 10) {
        wrapper.classList.add('collapsible-code-block');
        setupCollapsible(
          wrapper,
          pre,
          () => {
            const codeEl = pre.querySelector('code') || pre;
            const lh = getLineHeight(codeEl);
            const padTop = Number.parseFloat(window.getComputedStyle(pre).paddingTop) || 24;
            return Math.round(lh * 6.6 + padTop);
          },
          '代码块',
          { buttonPlacement: 'inside-start', insertAfterSelector: '.code-copy-button' }
        );
      }
    });
  }

  // 引用块初始化（非提示框且高度超过 10 行时自动折叠）
  function initQuoteBlocks() {
    document.querySelectorAll('.prose blockquote').forEach((bq) => {
      if (
        bq.classList.contains('callout') ||
        bq.closest('.collapsible-block') ||
        bq.classList.contains('collapsible-block-content')
      ) {
        return;
      }

      const lh = getLineHeight(bq);
      const estimatedLines = Math.ceil(bq.scrollHeight / lh);
      if (estimatedLines <= 10) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'collapsible-quote-block';
      bq.parentNode?.insertBefore(wrapper, bq);
      wrapper.append(bq);

      setupCollapsible(
        wrapper,
        bq,
        () => {
          const lh = getLineHeight(bq);
          const padTop = Number.parseFloat(window.getComputedStyle(bq).paddingTop) || 17;
          return Math.round(lh * 6.6 + padTop);
        },
        '引用块',
        { buttonPlacement: 'inside-start' }
      );
    });
  }

  // 监听窗口尺寸和设置变更时重新计算折叠高度
  function initCollapsibleResizeWatcher() {
    if (recalcFns.length === 0) return;
    window.addEventListener('resize', scheduleRecalc, { passive: true });
    new MutationObserver(scheduleRecalc).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-font-size', 'data-content-width']
    });
  }

  // ==========================================
  // 4. 初始化入口
  // ==========================================
  function initAll() {
    initSettingsPanel();
    initVisitedMarks();
    initCodeBlocks();
    initQuoteBlocks();
    initCollapsibleResizeWatcher();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll, { once: true });
  } else {
    initAll();
  }

  document.addEventListener('astro:page-load', initAll);
})();
