// src/scripts/shelf.js
// Gallery-Grade 3D Shelf 引擎：精装书 + 超薄论文叠真实三角投影排布、滚轮/触屏/键盘/胶囊分组、跟随光标与预览弹窗

(() => {
  const root = document.querySelector('[data-shelf-root]');
  if (!root || root.dataset.shelfReady === 'true') return;
  root.dataset.shelfReady = 'true';

  const stage = root.querySelector('[data-shelf-stage]');
  const track = root.querySelector('[data-shelf-track]');
  const tabsWrap = root.querySelector('[data-shelf-tabs]');
  const tabIndicator = root.querySelector('[data-shelf-tab-indicator]');
  const cursorEl = root.querySelector('[data-shelf-cursor]');
  const modal = document.querySelector('[data-shelf-modal]');
  const dataScript = document.getElementById('shelf-items-data');

  if (!stage || !track || !dataScript) return;

  let items = [];
  try {
    items = JSON.parse(dataScript.textContent || '[]');
  } catch {
    return;
  }

  const N = items.length;
  if (N === 0) return;

  const isInfinite = root.dataset.shelfInfinite === 'true';
  const slots = Array.from(track.querySelectorAll('[data-shelf-slot]'));
  const tabs = Array.from(root.querySelectorAll('[data-shelf-group]'));

  let activeSlot = isInfinite ? N : 0;
  const getLogicalIndex = (slotIdx) => ((slotIdx % N) + N) % N;

  function computeSlotGeometries() {
    const csRoot = getComputedStyle(root);
    const scale = parseFloat(csRoot.getPropertyValue('--shelf-scale')) || 1;

    // 读取真实渲染基准书高（由 clamp(--base-book-h) 决定）
    const sampleSlot = slots[0];
    const sampleScale = parseFloat(sampleSlot?.dataset.heightScale || '1') || 1;
    const baseBookH = (sampleSlot ? sampleSlot.getBoundingClientRect().height / sampleScale : 380) || 380;

    return {
      scale,
      items: slots.map((slot) => {
        const isPaper = slot.dataset.itemType === 'paper';
        const thickness = (parseFloat(slot.dataset.thickness || '60') || 60) * scale;
        const hScale = parseFloat(slot.dataset.heightScale || '1') || 1;
        const ratio = parseFloat(slot.dataset.coverRatio || '0.74') || 0.74;
        const coverW = baseBookH * hScale * ratio;

        // 严格按 3D 旋转角计算水平视觉投影宽，避免不同厚度书/论文重叠或过宽留白
        const shelvedAngleRad = ((isPaper ? 56 : 76) * Math.PI) / 180;
        const shelvedWidth =
          thickness * Math.sin(shelvedAngleRad) + coverW * Math.cos(shelvedAngleRad);

        const activeWidth = isPaper
          ? coverW + 18 * scale
          : coverW * Math.cos((19 * Math.PI) / 180) + thickness * Math.sin((19 * Math.PI) / 180) + 6 * scale;

        return { isPaper, thickness, coverW, shelvedWidth, activeWidth };
      }),
    };
  }

  function layoutShelf(instant = false) {
    const { scale, items: geos } = computeSlotGeometries();
    const activeGeo = geos[activeSlot] || geos[0];
    const activeGap = Math.max(38, Math.round(46 * scale));
    const shelfGap = Math.max(12, Math.round(16 * scale));
    const positions = new Array(slots.length).fill(0);

    // 向左侧逐项累加精确三角投影宽度
    let leftEdge = -(activeGeo.activeWidth / 2 + activeGap);
    for (let i = activeSlot - 1; i >= 0; i--) {
      const w = geos[i].shelvedWidth;
      positions[i] = leftEdge - w / 2;
      leftEdge -= w + shelfGap;
    }

    // 向右侧逐项累加精确三角投影宽度
    let rightEdge = activeGeo.activeWidth / 2 + activeGap;
    for (let i = activeSlot + 1; i < slots.length; i++) {
      const w = geos[i].shelvedWidth;
      positions[i] = rightEdge + w / 2;
      rightEdge += w + shelfGap;
    }

    slots.forEach((slot, idx) => {
      const dist = idx - activeSlot;
      const absDist = Math.abs(dist);
      const isAct = dist === 0;
      const geo = geos[idx];
      const logicalItem = items[getLogicalIndex(idx)];

      if (instant) slot.classList.add('is-instant');
      slot.style.setProperty('--tx', `${positions[idx].toFixed(2)}px`);
      slot.style.setProperty('--hit-w', `${Math.round(isAct ? geo.activeWidth : geo.shelvedWidth)}px`);
      slot.style.setProperty(
        '--shadow-w',
        `${Math.round(isAct ? geo.activeWidth * 0.92 : geo.shelvedWidth * 0.94)}px`
      );
      slot.style.zIndex = isAct ? '100' : String(Math.max(1, 50 - absDist));
      slot.classList.toggle('is-active', isAct);
      slot.classList.toggle('is-left', dist < 0);
      slot.classList.toggle('is-right', dist > 0);

      const hitBtn = slot.querySelector('.shelf-hit');
      if (hitBtn && logicalItem) {
        hitBtn.setAttribute(
          'aria-label',
          isAct
            ? `打开预览：${logicalItem.postTitle}`
            : `切换到 ${logicalItem.typeLabel} ${logicalItem.numberLabel}：${logicalItem.postTitle}`
        );
      }
    });

    if (instant) {
      track.getBoundingClientRect();
      slots.forEach((slot) => slot.classList.remove('is-instant'));
    }

    const activeItem = items[getLogicalIndex(activeSlot)];
    if (activeItem) {
      syncTabs(activeItem.group);
    }
  }

  function syncTabs(activeGroupName) {
    if (!tabsWrap || !tabIndicator || tabs.length === 0) return;

    let activeBtn = tabs.find((b) => b.dataset.shelfGroup === activeGroupName);
    if (!activeBtn) activeBtn = tabs[0];

    tabs.forEach((btn) => {
      const isAct = btn === activeBtn;
      btn.classList.toggle('is-active', isAct);
      btn.setAttribute('aria-selected', String(isAct));
    });

    if (activeBtn) {
      const left = activeBtn.offsetLeft;
      const width = activeBtn.offsetWidth;
      tabIndicator.style.transform = `translate3d(${left}px, 0, 0)`;
      tabIndicator.style.width = `${width}px`;
      tabIndicator.classList.add('is-ready');
    }
  }

  let normalizeTimer = 0;
  function setActiveSlot(targetSlot, { instant = false } = {}) {
    clearTimeout(normalizeTimer);

    if (isInfinite) {
      activeSlot = targetSlot;
      layoutShelf(instant);

      if (activeSlot < N || activeSlot >= 2 * N) {
        const normalized = N + getLogicalIndex(activeSlot);
        normalizeTimer = window.setTimeout(() => {
          activeSlot = normalized;
          layoutShelf(true);
        }, 560);
      }
    } else {
      activeSlot = ((targetSlot % N) + N) % N;
      layoutShelf(instant);
    }
  }

  function goToLogicalIndex(logicalIdx) {
    if (!isInfinite) {
      setActiveSlot(logicalIdx);
      return;
    }
    let bestSlot = N + logicalIdx;
    let bestDist = Infinity;
    for (let copy = 0; copy < 3; copy++) {
      const candidate = copy * N + logicalIdx;
      const d = Math.abs(candidate - activeSlot);
      if (d < bestDist) {
        bestDist = d;
        bestSlot = candidate;
      }
    }
    setActiveSlot(bestSlot);
  }

  function stepBy(delta) {
    if (N <= 1) return;
    setActiveSlot(activeSlot + delta);
  }

  // ==========================================
  // 1. 悬停与点击交互（统一平面热区，零 3D 穿透）
  // ==========================================
  slots.forEach((slot, idx) => {
    const hitBtn = slot.querySelector('.shelf-hit');
    if (!hitBtn) return;

    hitBtn.addEventListener('pointerenter', () => {
      if (!slot.classList.contains('is-active')) {
        slot.classList.add('is-hovered');
      }
    });

    hitBtn.addEventListener('pointerleave', () => {
      slot.classList.remove('is-hovered');
    });

    hitBtn.addEventListener('click', () => {
      slot.classList.remove('is-hovered');
      if (idx === activeSlot) {
        openModal(getLogicalIndex(idx), hitBtn);
      } else {
        setActiveSlot(idx);
      }
    });
  });

  // ==========================================
  // 2. 顶部胶囊分组切换
  // ==========================================
  tabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      const group = btn.dataset.shelfGroup;
      if (group === '__all__') {
        goToLogicalIndex(0);
        return;
      }
      const firstIdx = Number(btn.dataset.firstIndex);
      if (Number.isFinite(firstIdx)) {
        goToLogicalIndex(firstIdx);
      }
    });
  });

  // ==========================================
  // 3. 滚轮横向拨动 + 触摸轻扫 + 键盘方向键
  // ==========================================
  let wheelLockUntil = 0;
  let wheelAccum = 0;

  const isModalOpen = () => Boolean(modal && !modal.hidden && modal.classList.contains('is-open'));

  const isOverlayOpen = () => {
    const settingsPanel = document.querySelector('[data-settings-panel]');
    const settingsOpen = Boolean(settingsPanel && !settingsPanel.hidden);
    return settingsOpen || isModalOpen();
  };

  window.addEventListener(
    'wheel',
    (e) => {
      if (N <= 1 || isOverlayOpen()) return;
      if (window.innerWidth < 720 || window.innerHeight < 620) return;

      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 2) return;
      e.preventDefault();

      const now = Date.now();
      if (now < wheelLockUntil) return;

      wheelAccum += delta;
      if (Math.abs(wheelAccum) >= 28) {
        stepBy(wheelAccum > 0 ? 1 : -1);
        wheelAccum = 0;
        wheelLockUntil = now + 320;
      }
    },
    { passive: false }
  );

  let touchStartX = 0;
  let touchStartY = 0;
  stage.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    },
    { passive: true }
  );
  stage.addEventListener(
    'touchend',
    (e) => {
      if (N <= 1 || e.changedTouches.length !== 1) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        stepBy(dx < 0 ? 1 : -1);
      }
    },
    { passive: true }
  );

  document.addEventListener('keydown', (e) => {
    if (isModalOpen()) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
      } else if (e.key === 'Tab') {
        trapModalFocus(e);
      }
      return;
    }

    if (isOverlayOpen()) return;
    if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stepBy(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      stepBy(1);
    }
  });

  // ==========================================
  // 4. 自定义跟随光标（桌面精细指针专用，零空闲开销）
  // ==========================================
  const finePointer = window.matchMedia('(pointer: fine) and (hover: hover)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (cursorEl && finePointer.matches && !reducedMotion.matches) {
    let targetX = -100;
    let targetY = -100;
    let curX = -100;
    let curY = -100;
    let cursorVisible = false;
    let rafId = 0;

    const tickCursor = () => {
      curX += (targetX - curX) * 0.24;
      curY += (targetY - curY) * 0.24;
      cursorEl.style.transform = `translate3d(${curX.toFixed(1)}px, ${curY.toFixed(1)}px, 0) translate(-50%, -50%)`;

      if (cursorVisible || Math.abs(targetX - curX) > 0.3 || Math.abs(targetY - curY) > 0.3) {
        rafId = window.requestAnimationFrame(tickCursor);
      } else {
        rafId = 0;
      }
    };

    stage.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      stage.classList.add('has-custom-cursor');
      targetX = curX = e.clientX;
      targetY = curY = e.clientY;
      cursorVisible = true;
      cursorEl.classList.add('is-visible');
      if (!rafId) rafId = window.requestAnimationFrame(tickCursor);
    });

    stage.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      targetX = e.clientX;
      targetY = e.clientY;
      const target = e.target;
      const overActive = Boolean(target instanceof Element && target.closest('.shelf-slot.is-active .shelf-hit'));
      cursorEl.classList.toggle('is-open', overActive);
      if (!cursorVisible) {
        cursorVisible = true;
        cursorEl.classList.add('is-visible');
      }
      if (!rafId) rafId = window.requestAnimationFrame(tickCursor);
    });

    stage.addEventListener('pointerleave', () => {
      cursorVisible = false;
      stage.classList.remove('has-custom-cursor');
      cursorEl.classList.remove('is-visible', 'is-open');
    });
  }

  // ==========================================
  // 5. 沉浸式预览弹窗（焦点捕获、Esc 关闭与 URL Hash 同步）
  // ==========================================
  let lastFocusedBeforeModal = null;
  let closeModalTimer = 0;

  const modalKicker = modal?.querySelector('[data-modal-kicker]');
  const modalTitle = modal?.querySelector('[data-modal-title]');
  const modalMeta = modal?.querySelector('[data-modal-meta]');
  const modalDesc = modal?.querySelector('[data-modal-desc]');
  const modalOutlineWrap = modal?.querySelector('[data-modal-outline-wrap]');
  const modalOutline = modal?.querySelector('[data-modal-outline]');
  const modalLink = modal?.querySelector('[data-modal-link]');
  const modalArtwork = modal?.querySelector('[data-modal-artwork]');
  const modalCloseBtn = modal?.querySelector('.shelf-modal-close');

  function getModalFocusable() {
    if (!modal) return [];
    return Array.from(
      modal.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
    );
  }

  function trapModalFocus(e) {
    const focusables = getModalFocusable();
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function openModal(logicalIdx, triggerEl = null) {
    if (!modal) return;
    const item = items[logicalIdx];
    if (!item) return;

    clearTimeout(closeModalTimer);
    lastFocusedBeforeModal = triggerEl || document.activeElement;

    if (modalKicker) {
      modalKicker.textContent = `${item.typeLabel} ${item.numberLabel} · ${item.group}`;
    }
    if (modalTitle) {
      modalTitle.textContent = item.postTitle;
    }
    if (modalMeta) {
      const pagesPart = item.pages ? `${item.pages} 页` : '';
      const parts = [item.author, pagesPart, item.dateFormatted, item.words].filter(Boolean);
      modalMeta.textContent = parts.join('  /  ');
    }
    if (modalDesc) {
      modalDesc.textContent = item.description || '点击下方按钮阅读完整笔记。';
    }

    if (modalOutline && modalOutlineWrap) {
      modalOutline.textContent = '';
      if (Array.isArray(item.outline) && item.outline.length > 0) {
        modalOutlineWrap.hidden = false;
        item.outline.forEach((heading, i) => {
          const li = document.createElement('li');
          const num = document.createElement('span');
          num.className = 'shelf-modal-outline-num';
          num.textContent = String(i + 1).padStart(2, '0');
          const txt = document.createElement('span');
          txt.className = 'shelf-modal-outline-text';
          txt.textContent = heading;
          li.append(num, txt);
          modalOutline.append(li);
        });
      } else {
        modalOutlineWrap.hidden = true;
      }
    }

    if (modalLink) {
      modalLink.setAttribute('href', item.url);
    }

    if (modalArtwork) {
      modalArtwork.textContent = '';
      modalArtwork.style.aspectRatio = String(item.coverRatio || 0.74);
      const tpl = document.getElementById(`shelf-modal-art-${logicalIdx}`);
      if (tpl instanceof HTMLTemplateElement) {
        modalArtwork.append(tpl.content.cloneNode(true));
      }
    }

    modal.hidden = false;
    modal.offsetHeight;
    modal.classList.add('is-open');

    try {
      window.history.replaceState(null, '', `#shelf=${encodeURIComponent(item.slug)}`);
    } catch {}

    window.setTimeout(() => {
      modalCloseBtn?.focus({ preventScroll: true });
    }, 30);
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.classList.remove('is-open');
    try {
      if (window.location.hash.startsWith('#shelf=')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } catch {}

    const finish = () => {
      modal.hidden = true;
      if (lastFocusedBeforeModal instanceof HTMLElement) {
        lastFocusedBeforeModal.focus({ preventScroll: true });
      }
    };

    if (reducedMotion.matches) {
      finish();
    } else {
      closeModalTimer = window.setTimeout(finish, 230);
    }
  }

  modal?.querySelectorAll('[data-shelf-modal-close]').forEach((el) => {
    el.addEventListener('click', closeModal);
  });

  // ==========================================
  // 6. 初始渲染、窗口自适应与 URL Hash 深链恢复
  // ==========================================
  const initialHashMatch = window.location.hash.match(/^#shelf=(.+)$/);
  if (initialHashMatch) {
    const slug = decodeURIComponent(initialHashMatch[1]);
    const foundIdx = items.findIndex((it) => it.slug === slug);
    if (foundIdx >= 0) {
      activeSlot = isInfinite ? N + foundIdx : foundIdx;
    }
  }

  layoutShelf(true);

  if (initialHashMatch) {
    const slug = decodeURIComponent(initialHashMatch[1]);
    const foundIdx = items.findIndex((it) => it.slug === slug);
    if (foundIdx >= 0) {
      openModal(foundIdx);
    }
  }

  let resizeRaf = 0;
  window.addEventListener('resize', () => {
    if (resizeRaf) return;
    resizeRaf = window.requestAnimationFrame(() => {
      resizeRaf = 0;
      layoutShelf(true);
    });
  });

  document.fonts?.ready?.then(() => {
    const activeItem = items[getLogicalIndex(activeSlot)];
    if (activeItem) syncTabs(activeItem.group);
  });
})();
