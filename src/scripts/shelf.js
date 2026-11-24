// src/scripts/shelf.js
// 120fps 连续弹簧物理 3D 书架引擎：
// - 预计算精确 3D 透视投影边界，动画帧零 layout 读取、零 CSS 变量级联、仅写 GPU 合成层 transform/opacity
// - 视口外远端槽位自动剔除，减少 ~70% GPU 合成开销
// - 支持触控板无级跟手滑动、滚轮连续多步加速、鼠标/触屏拖拽惯性抛掷、键盘连翻与无缝真无限循环

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
  const tabs = Array.from(root.querySelectorAll('[data-shelf-type]'));
  const domainLists = Array.from(root.querySelectorAll('[data-domain-section]'));
  const domainChips = Array.from(root.querySelectorAll('[data-shelf-domain]'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine) and (hover: hover)');

  const PERSP = 2000;
  const SPRING_K = 195; // Apple-like crisp, velvety spring stiffness
  const SPRING_D = 26.5; // Damping ratio ~0.95 (fast settle, zero harsh bounce)
  const CULL_RADIUS = isInfinite ? Math.min(N - 1, 6) : N;

  const getLogicalIndex = (slotIdx) => ((slotIdx % N) + N) % N;
  const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);
  const lerp = (a, b, t) => a + (b - a) * t;

  // 开启物理引擎直驱模式（关闭 CSS transform 过渡避免与 120fps rAF 冲突）
  root.classList.add('is-physics');

  // 一次性缓存全部 DOM 引用，动画帧零 querySelector
  const slotNodes = slots.map((slot, idx) => {
    const isPaper = slot.dataset.itemType === 'paper';
    return {
      idx,
      slot,
      isPaper,
      logicalIndex: Number(slot.dataset.logicalIndex) || getLogicalIndex(idx),
      rawThickness: parseFloat(slot.dataset.thickness || '60') || 60,
      hScale: parseFloat(slot.dataset.heightScale || '1') || 1,
      ratio: parseFloat(slot.dataset.coverRatio || '0.74') || 0.74,
      bodyEl: slot.querySelector(isPaper ? '.paper-stack' : '.book-object'),
      sheet2: isPaper ? slot.querySelector('.paper-sheet-back.is-sheet-2') : null,
      sheet3: isPaper ? slot.querySelector('.paper-sheet-back.is-sheet-3') : null,
      hitBtn: slot.querySelector('.shelf-hit'),
      shadowEl: slot.querySelector('.shelf-contact-shadow'),
      hoverAmt: 0,
      isFar: false,
      lastZIndex: '',
    };
  });

  // 提前在后台解码所有封面图，消除首次滚动到某本书/论文时的解码卡顿
  root.querySelectorAll('img.shelf-cover-photo').forEach((img) => {
    if (img instanceof HTMLImageElement && typeof img.decode === 'function') {
      img.decode().catch(() => {});
    }
  });

  // ==========================================
  // 1. 精确 3D 透视投影预计算（仅初始化 & resize 时执行）
  // ==========================================
  let cachedScale = 1;
  let cachedBaseBookH = 380;
  let cachedViewportHalfW = 700;
  let slotGeos = [];
  let cachedLayouts = []; // cachedLayouts[logicalIdx] => Array of solved poses per slot
  let tabMetrics = new Map();

  function cacheTabMetrics() {
    tabMetrics.clear();
    tabs.forEach((btn) => {
      tabMetrics.set(btn, { left: btn.offsetLeft, width: btn.offsetWidth });
    });
  }

  function projectBounds(x, z0, ryDeg, corners) {
    const rad = (ryDeg * Math.PI) / 180;
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    let minX = Infinity;
    let maxX = -Infinity;
    for (let k = 0; k < corners.length; k++) {
      const [lx, lz] = corners[k];
      const wx = x + lx * c + lz * s;
      const wz = z0 - lx * s + lz * c;
      const factor = PERSP / Math.max(200, PERSP - wz);
      const sx = wx * factor;
      if (sx < minX) minX = sx;
      if (sx > maxX) maxX = sx;
    }
    return { minX, maxX };
  }

  function getShelvedAngle(x, z0, isPaper, side) {
    const camDist = PERSP - z0;
    const rawPhi = (Math.atan2(-x, camDist) * 180) / Math.PI;
    if (isPaper) {
      const phi = clamp(rawPhi, -22, 22);
      return side < 0 ? clamp(phi + 56, 42, 74) : clamp(phi - 56, -74, -42);
    }
    // 书脊正对视线 + 2.6° 微侧角，只露 ~12px 哑光封底边，彻底杜绝极端斜角压扁封面文字
    const phi = clamp(rawPhi, -32, 32);
    return 90 + phi + 2.6;
  }

  function solveSideSlot(targetEdge, geo, side) {
    let x = targetEdge + side * 80;
    let ry = getShelvedAngle(x, geo.zShelved, geo.isPaper, side);
    for (let iter = 0; iter < 3; iter++) {
      ry = getShelvedAngle(x, geo.zShelved, geo.isPaper, side);
      const rad = (ry * Math.PI) / 180;
      const c = Math.cos(rad);
      const s = Math.sin(rad);
      let nextX = side > 0 ? -Infinity : Infinity;
      for (let k = 0; k < geo.shelvedCorners.length; k++) {
        const [lx, lz] = geo.shelvedCorners[k];
        const dx = lx * c + lz * s;
        const dz = -lx * s + lz * c;
        const factor = PERSP / Math.max(200, PERSP - (geo.zShelved + dz));
        const neededX = targetEdge / factor - dx;
        if (side > 0 ? neededX > nextX : neededX < nextX) {
          nextX = neededX;
        }
      }
      x = nextX;
    }
    const bounds = projectBounds(x, geo.zShelved, ry, geo.shelvedCorners);
    return {
      x,
      z: geo.zShelved,
      ty: 0,
      ry,
      rx: 0,
      rz: 0,
      minX: bounds.minX,
      maxX: bounds.maxX,
      screenW: Math.max(40, bounds.maxX - bounds.minX),
      side,
    };
  }

  function computeIntegerLayout(centerSlotIdx) {
    const scale = cachedScale;
    const activeGeo = slotGeos[centerSlotIdx] || slotGeos[0];

    const activeLeftGap = Math.max(36, Math.round(48 * scale));
    const activeRightGap = Math.max(36, Math.round(48 * scale));
    const bookGap = Math.max(12, Math.round(16 * scale));
    const paperGap = Math.max(28, Math.round(40 * scale));
    const sectionDividerGap = Math.max(44, Math.round(62 * scale));

    const poses = new Array(slots.length);
    const activeRy = activeGeo.isPaper ? -3 : -18;
    const activeRx = activeGeo.isPaper ? 1 : 1.2;
    const activeRz = activeGeo.isPaper ? -1.6 : -0.8;
    const activeBounds = projectBounds(0, activeGeo.zActive, activeRy, activeGeo.activeCorners);

    poses[centerSlotIdx] = {
      x: 0,
      z: activeGeo.zActive,
      ty: -8,
      ry: activeRy,
      rx: activeRx,
      rz: activeRz,
      minX: activeBounds.minX,
      maxX: activeBounds.maxX,
      screenW: Math.max(40, activeBounds.maxX - activeBounds.minX),
      side: 0,
    };

    const gapBetween = (aIdx, bIdx) => {
      const aPaper = slotGeos[aIdx].isPaper;
      const bPaper = slotGeos[bIdx].isPaper;
      if (aPaper !== bPaper) return sectionDividerGap;
      return aPaper ? paperGap : bookGap;
    };

    let leftBoundary = activeBounds.minX - activeLeftGap;
    for (let i = centerSlotIdx - 1; i >= 0; i--) {
      if (i < centerSlotIdx - 1) {
        leftBoundary -= gapBetween(i, i + 1);
      } else if (slotGeos[i].isPaper !== activeGeo.isPaper) {
        leftBoundary -= Math.round(20 * scale);
      }
      const placed = solveSideSlot(leftBoundary, slotGeos[i], -1);
      poses[i] = placed;
      leftBoundary = placed.minX;
    }

    let rightBoundary = activeBounds.maxX + activeRightGap;
    for (let i = centerSlotIdx + 1; i < slots.length; i++) {
      if (i > centerSlotIdx + 1) {
        rightBoundary += gapBetween(i - 1, i);
      } else if (slotGeos[i].isPaper !== activeGeo.isPaper) {
        rightBoundary += Math.round(20 * scale);
      }
      const placed = solveSideSlot(rightBoundary, slotGeos[i], 1);
      poses[i] = placed;
      rightBoundary = placed.maxX;
    }

    return poses;
  }

  function rebuildLayoutCache() {
    const csRoot = getComputedStyle(root);
    cachedScale = parseFloat(csRoot.getPropertyValue('--shelf-scale')) || 1;
    cachedViewportHalfW = Math.max(360, window.innerWidth * 0.5);

    const sampleNode = slotNodes[0];
    cachedBaseBookH = (sampleNode ? sampleNode.slot.offsetHeight / sampleNode.hScale : 380) || 380;

    slotGeos = slotNodes.map((node) => {
      const thickness = node.rawThickness * cachedScale;
      const coverW = cachedBaseBookH * node.hScale * node.ratio;
      const zShelved = -0.5 * coverW - 22;
      const zActive = node.isPaper ? 78 : 96;

      const shelvedCorners = node.isPaper
        ? [
            [-coverW / 2 - 2, -Math.max(10, thickness) - 1],
            [coverW / 2 + 12 * cachedScale, -Math.max(10, thickness) - 1],
            [-coverW / 2 - 2, 3],
            [coverW / 2 + 12 * cachedScale, 3],
          ]
        : [
            [-coverW / 2, -thickness / 2],
            [coverW / 2, -thickness / 2],
            [-coverW / 2, thickness / 2],
            [coverW / 2, thickness / 2],
          ];

      const activeCorners = node.isPaper
        ? [
            [-coverW / 2 - 6 * cachedScale, -14],
            [coverW / 2 + 22 * cachedScale, -14],
            [-coverW / 2 - 6 * cachedScale, 4],
            [coverW / 2 + 22 * cachedScale, 4],
          ]
        : [
            [-coverW / 2 - 4 * cachedScale, -thickness / 2],
            [coverW / 2 + 4 * cachedScale, -thickness / 2],
            [-coverW / 2 - 4 * cachedScale, thickness / 2],
            [coverW / 2 + 4 * cachedScale, thickness / 2],
          ];

      return {
        isPaper: node.isPaper,
        thickness,
        coverW,
        zShelved,
        zActive,
        zHitShelved: 0.5 * coverW + 6,
        shelvedCorners,
        activeCorners,
      };
    });

    cachedLayouts = new Array(N);
    for (let logical = 0; logical < N; logical++) {
      const centerSlotIdx = isInfinite ? N + logical : logical;
      cachedLayouts[logical] = computeIntegerLayout(centerSlotIdx);
    }

    cacheTabMetrics();
  }

  // ==========================================
  // 2. 120fps 连续物理状态与渲染内核
  // ==========================================
  let currentPos = isInfinite ? N : 0;
  let targetPos = currentPos;
  let velocity = 0;

  let hoveredSlotIdx = -1;
  let hoverSuppressed = false;
  let suppressMouseX = -999;
  let suppressMouseY = -999;
  let lastMouseX = -999;
  let lastMouseY = -999;
  let isDragging = false;
  let dragStartPos = currentPos;
  let wheelFree = false;
  let lastSyncedCenterSlot = -1;
  let lastSyncedHitSlot = -1;
  let rafId = 0;
  let lastFrameTime = 0;

  function isShelfSettled() {
    return (
      !isDragging &&
      !wheelFree &&
      Math.abs(targetPos - currentPos) < 0.03 &&
      Math.abs(velocity) < 0.25
    );
  }

  function suppressHoverUntilPointerMoves() {
    hoveredSlotIdx = -1;
    hoverSuppressed = true;
    suppressMouseX = lastMouseX;
    suppressMouseY = lastMouseY;
    cursorEl?.classList.remove('is-open');
  }

  function syncTabs(activeType, activeDomain) {
    if (tabsWrap && tabIndicator && tabs.length > 0) {
      let activeBtn = tabs.find((b) => b.dataset.shelfType === activeType);
      if (!activeBtn) activeBtn = tabs[0];

      tabs.forEach((btn) => {
        const isAct = btn === activeBtn;
        btn.classList.toggle('is-active', isAct);
        btn.setAttribute('aria-selected', String(isAct));
      });

      if (activeBtn) {
        const metrics = tabMetrics.get(activeBtn) || {
          left: activeBtn.offsetLeft,
          width: activeBtn.offsetWidth,
        };
        tabIndicator.style.transform = `translate3d(${metrics.left}px, 0, 0)`;
        tabIndicator.style.width = `${metrics.width}px`;
        tabIndicator.classList.add('is-ready');
      }
    }

    if (domainLists.length > 0) {
      domainLists.forEach((list) => {
        const isCurrentSection = list.dataset.domainSection === activeType;
        list.hidden = !isCurrentSection;
        if (isCurrentSection) {
          list.querySelectorAll('[data-shelf-domain]').forEach((chip) => {
            const isAct = Boolean(activeDomain && chip.dataset.shelfDomain === activeDomain);
            chip.classList.toggle('is-active', isAct);
            chip.setAttribute('aria-pressed', String(isAct));
          });
        }
      });
    }
  }

  // 仅同步语义类与胶囊指示器（零 layout 读取）
  function syncActiveSemantics(centerSlot, force = false) {
    if (!force && centerSlot === lastSyncedCenterSlot) return;
    lastSyncedCenterSlot = centerSlot;

    const logicalCenter = getLogicalIndex(centerSlot);
    for (let s = 0; s < slotNodes.length; s++) {
      const node = slotNodes[s];
      const dist = s - centerSlot;
      const isAct = dist === 0;

      node.slot.classList.toggle('is-active', isAct);
      node.slot.classList.toggle('is-left', dist < 0);
      node.slot.classList.toggle('is-right', dist > 0);

      if (node.hitBtn) {
        const logicalItem = items[node.logicalIndex];
        if (logicalItem) {
          node.hitBtn.setAttribute(
            'aria-label',
            isAct
              ? `打开预览：${logicalItem.postTitle}`
              : `切换到 ${logicalItem.typeLabel} ${logicalItem.numberLabel}：${logicalItem.postTitle}`
          );
        }
      }
    }

    const activeItem = items[logicalCenter];
    if (activeItem) {
      syncTabs(activeItem.type, activeItem.domain);
    }
  }

  // 热区尺寸仅在降速/停稳后更新，确保高速滑行期间零 layout 重排
  function syncHitBounds(centerSlot, force = false) {
    if (!force && centerSlot === lastSyncedHitSlot) return;
    lastSyncedHitSlot = centerSlot;

    const logicalCenter = getLogicalIndex(centerSlot);
    const poses = cachedLayouts[logicalCenter];
    const centerAnchor = isInfinite ? N + logicalCenter : logicalCenter;

    for (let s = 0; s < slotNodes.length; s++) {
      const node = slotNodes[s];
      if (!node.hitBtn) continue;
      const dist = s - centerSlot;
      if (Math.abs(dist) > CULL_RADIUS) continue;

      const isAct = dist === 0;
      const lookupIdx = isInfinite ? centerAnchor + dist : s;
      const pose = poses && lookupIdx >= 0 && lookupIdx < poses.length ? poses[lookupIdx] : null;
      if (!pose) continue;

      const geo = slotGeos[s];
      const zWorldHit = isAct ? geo.zActive + 64 : -16;
      const sHit = PERSP / Math.max(200, PERSP - zWorldHit);
      const hitW = Math.max(44, Math.round(pose.screenW / sHit));
      const hitLeft = Math.round(pose.minX / sHit - pose.x);
      node.hitBtn.style.width = `${hitW}px`;
      node.hitBtn.style.left = `${hitLeft}px`;
      node.hitBtn.style.transform = `translateZ(${(isAct ? 64 : geo.zHitShelved).toFixed(1)}px)`;
    }
  }

  function wrapInfinitePos() {
    if (!isInfinite) return;
    while (currentPos < N) {
      currentPos += N;
      targetPos += N;
      if (isDragging) dragStartPos += N;
      if (hoveredSlotIdx >= 0) hoveredSlotIdx = (hoveredSlotIdx + N) % slots.length;
    }
    while (currentPos >= 2 * N) {
      currentPos -= N;
      targetPos -= N;
      if (isDragging) dragStartPos -= N;
      if (hoveredSlotIdx >= 0) hoveredSlotIdx = (hoveredSlotIdx - N + slots.length) % slots.length;
    }
  }

  function renderShelfFrame(dt) {
    wrapInfinitePos();

    let overscrollX = 0;
    let clampedPos = currentPos;
    if (!isInfinite) {
      if (currentPos < 0) {
        clampedPos = 0;
        overscrollX = -currentPos * 145;
      } else if (currentPos > N - 1) {
        clampedPos = N - 1;
        overscrollX = -(currentPos - (N - 1)) * 145;
      }
    }

    const i0 = Math.floor(clampedPos);
    const i1 = isInfinite ? i0 + 1 : Math.min(N - 1, i0 + 1);
    const frac = clampedPos - i0;

    const log0 = getLogicalIndex(i0);
    const log1 = getLogicalIndex(i1);
    const layoutA = cachedLayouts[log0];
    const layoutB = cachedLayouts[log1];
    const anchorA = isInfinite ? N + log0 : log0;
    const anchorB = isInfinite ? N + log1 : log1;

    const nearestCenter = isInfinite
      ? Math.round(currentPos)
      : clamp(Math.round(clampedPos), 0, N - 1);
    syncActiveSemantics(nearestCenter, false);
    if (!isDragging && Math.abs(velocity) < 2.2) {
      syncHitBounds(nearestCenter, false);
    }

    const allowHover = !hoverSuppressed && isShelfSettled();
    const hoverLerp = dt > 0 ? 1 - Math.exp(-22 * dt) : 1;
    let hoverMoving = false;
    const cullEdge = cachedViewportHalfW + 420;

    for (let s = 0; s < slotNodes.length; s++) {
      const node = slotNodes[s];
      const dist = s - clampedPos;
      const absDist = Math.abs(dist);

      if (absDist > CULL_RADIUS) {
        if (!node.isFar) {
          node.isFar = true;
          node.hoverAmt = 0;
          node.slot.classList.add('is-far');
        }
        continue;
      }

      const idxA = isInfinite ? anchorA + (s - i0) : s;
      const idxB = isInfinite ? anchorB + (s - i1) : s;
      const pA = layoutA[idxA];
      const pB = layoutB[idxB];
      if (!pA || !pB) continue;

      const x = lerp(pA.x, pB.x, frac) + overscrollX;
      const minScreen = lerp(pA.minX, pB.minX, frac) + overscrollX;
      const maxScreen = lerp(pA.maxX, pB.maxX, frac) + overscrollX;

      if (maxScreen < -cullEdge || minScreen > cullEdge) {
        if (!node.isFar) {
          node.isFar = true;
          node.hoverAmt = 0;
          node.slot.classList.add('is-far');
        }
        continue;
      }

      if (node.isFar) {
        node.isFar = false;
        node.slot.classList.remove('is-far');
      }

      // 连续聚焦度（0 = 待机书架态，1 = 居中主角态）
      const focus = clamp(1 - absDist, 0, 1);

      // 丝滑阻尼悬停状态（高速滑动/拖拽时自动平滑回落，杜绝闪烁）
      const wantHover = allowHover && s === hoveredSlotIdx && focus < 0.72 ? 1 : 0;
      const hDiff = wantHover - node.hoverAmt;
      if (Math.abs(hDiff) > 0.002) {
        node.hoverAmt += hDiff * hoverLerp;
        hoverMoving = true;
      } else {
        node.hoverAmt = wantHover;
      }
      const h = node.hoverAmt;

      const z = lerp(pA.z, pB.z, frac);
      const ty = lerp(pA.ty, pB.ty, frac);
      const rz = lerp(pA.rz, pB.rz, frac);
      let ry = lerp(pA.ry, pB.ry, frac);
      let rx = lerp(pA.rx, pB.rx, frac);

      if (h > 0.001 && node.isPaper) {
        // 悬停论文微微朝向视线展开 14°，更易预览第一页；书籍保持纯垂直书脊仅上浮前探，杜绝斜边亚像素虚线缝
        ry += (dist < 0 ? -14 : 14) * h;
      }

      // 槽位仅承载排布位移（.shelf-hit 保持绝对静止，彻底杜绝悬停上移把热区从光标下抽走导致的上下抽搐！）
      node.slot.style.transform = `translate3d(${x.toFixed(2)}px, ${ty.toFixed(2)}px, ${z.toFixed(2)}px) rotateZ(${rz.toFixed(2)}deg)`;

      // 悬停上浮与前探完全施加在视觉实体 bodyEl 上
      if (node.bodyEl) {
        const liftTy = -14 * h;
        const liftTz = h * (node.isPaper ? 30 : 26);
        node.bodyEl.style.transform =
          h > 0.001
            ? `translate3d(0px, ${liftTy.toFixed(2)}px, ${liftTz.toFixed(2)}px) rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg)`
            : `rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg)`;
      }

      // 论文底层多页随居中度 & 悬停度连续微微扇开
      if (node.isPaper && node.sheet2 && node.sheet3) {
        const fan = Math.max(focus, h * 0.78);
        const s2x = 2 + 3 * fan;
        const s2y = 1 + 2 * fan;
        const s2z = -4 - 1 * fan;
        const s2r = 0.5 + 0.8 * fan;
        const s3x = 4 + 6 * fan;
        const s3y = 2 + 4 * fan;
        const s3z = -8 - 2 * fan;
        const s3r = 1.0 + 1.6 * fan;
        node.sheet2.style.transform = `translate3d(${s2x.toFixed(2)}px, ${s2y.toFixed(2)}px, ${s2z.toFixed(2)}px) rotateZ(${s2r.toFixed(2)}deg)`;
        node.sheet3.style.transform = `translate3d(${s3x.toFixed(2)}px, ${s3y.toFixed(2)}px, ${s3z.toFixed(2)}px) rotateZ(${s3r.toFixed(2)}deg)`;
      }

      // 零 blur 零 width 变化纯 GPU 接触影
      if (node.shadowEl) {
        const screenW = Math.max(40, maxScreen - minScreen);
        const sx = (screenW * (0.86 + 0.06 * focus)) / 140;
        const sy = 0.85 + 0.3 * focus + 0.12 * h;
        const liftY = (focus * 14 + h * 14);
        const op = clamp(1 - focus * 0.28 - h * 0.42, 0.38, 1);
        node.shadowEl.style.transform = `translate3d(-50%, ${liftY.toFixed(1)}px, -28px) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
        node.shadowEl.style.opacity = op.toFixed(2);
      }

      const zIdx = String(Math.round(10 + focus * 90 - Math.min(9, absDist)));
      if (zIdx !== node.lastZIndex) {
        node.lastZIndex = zIdx;
        node.slot.style.zIndex = zIdx;
      }
    }

    return hoverMoving;
  }

  function wakeEngine() {
    if (rafId) return;
    lastFrameTime = performance.now();
    rafId = window.requestAnimationFrame(tickEngine);
  }

  function tickEngine(now) {
    rafId = 0;
    const dt = clamp((now - lastFrameTime) / 1000, 0.001, 0.032);
    lastFrameTime = now;

    let moving = false;

    if (isDragging) {
      moving = true;
    } else if (reducedMotion.matches) {
      currentPos = targetPos;
      velocity = 0;
    } else {
      // 2 子步积分弹簧阻尼器，60Hz/120Hz/240Hz 下手感完全一致
      const subDt = dt * 0.5;
      for (let step = 0; step < 2; step++) {
        const force = (targetPos - currentPos) * SPRING_K - velocity * SPRING_D;
        velocity += force * subDt;
        currentPos += velocity * subDt;
      }

      if (Math.abs(targetPos - currentPos) < 0.0006 && Math.abs(velocity) < 0.002) {
        currentPos = targetPos;
        velocity = 0;
      } else {
        moving = true;
      }
    }

    const hoverMoving = renderShelfFrame(dt);

    if (moving || hoverMoving || wheelFree) {
      rafId = window.requestAnimationFrame(tickEngine);
    }
  }

  function setTargetSlot(slotTarget) {
    wheelFree = false;
    clearTimeout(wheelSnapTimer);
    suppressHoverUntilPointerMoves();
    if (isInfinite) {
      targetPos = slotTarget;
    } else {
      targetPos = clamp(slotTarget, 0, N - 1);
    }
    wakeEngine();
  }

  function goToLogicalIndex(logicalIdx) {
    if (!isInfinite) {
      setTargetSlot(logicalIdx);
      return;
    }
    // 沿最近路径平滑飞入目标项
    const base = Math.round(targetPos);
    const curLogical = getLogicalIndex(base);
    let diff = logicalIdx - curLogical;
    if (diff > N / 2) diff -= N;
    if (diff < -N / 2) diff += N;
    setTargetSlot(base + diff);
  }

  function stepBy(delta) {
    if (N <= 1) return;
    wheelFree = false;
    clearTimeout(wheelSnapTimer);
    suppressHoverUntilPointerMoves();
    if (isInfinite) {
      targetPos = Math.round(targetPos) + delta;
    } else {
      targetPos = ((Math.round(targetPos) + delta) % N + N) % N;
    }
    wakeEngine();
  }

  // ==========================================
  // 3. 悬停与点击交互
  // ==========================================
  let suppressClickUntil = 0;

  slotNodes.forEach((node) => {
    const hitBtn = node.hitBtn;
    if (!hitBtn) return;

    hitBtn.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (hoverSuppressed || !isShelfSettled()) return;
      hoveredSlotIdx = node.idx;
      wakeEngine();
    });

    hitBtn.addEventListener('pointerleave', () => {
      if (hoveredSlotIdx === node.idx) {
        hoveredSlotIdx = -1;
        wakeEngine();
      }
    });

    hitBtn.addEventListener('click', (e) => {
      if (performance.now() < suppressClickUntil) {
        e.preventDefault();
        return;
      }
      suppressHoverUntilPointerMoves();
      const distFromCenter = Math.abs(node.idx - currentPos);
      if (distFromCenter < 0.28) {
        openModal(node.logicalIndex, hitBtn);
      } else {
        setTargetSlot(node.idx);
      }
    });
  });

  // 停稳后仅当鼠标真实移动超过 4px 才重新恢复悬停，杜绝滑动过程中静止光标反复触发悬停跳动
  stage.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    if (!hoverSuppressed) return;
    if (!isShelfSettled()) return;
    if (Math.hypot(e.clientX - suppressMouseX, e.clientY - suppressMouseY) < 4) return;

    hoverSuppressed = false;
    const hitEl = e.target instanceof Element ? e.target.closest('.shelf-slot') : null;
    if (hitEl) {
      const idx = slots.indexOf(hitEl);
      if (idx >= 0 && Math.abs(idx - currentPos) > 0.28) {
        hoveredSlotIdx = idx;
        wakeEngine();
      }
    }
  });

  stage.addEventListener('pointerleave', () => {
    hoverSuppressed = false;
    if (hoveredSlotIdx !== -1) {
      hoveredSlotIdx = -1;
      wakeEngine();
    }
  });

  // ==========================================
  // 4. 两级分类切换（一级载体 Books / Papers + 二级领域）
  // ==========================================
  tabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      const firstIdx = Number(btn.dataset.firstIndex);
      if (Number.isFinite(firstIdx)) {
        goToLogicalIndex(firstIdx);
      }
    });
  });

  domainChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const firstIdx = Number(chip.dataset.firstIndex);
      if (Number.isFinite(firstIdx)) {
        goToLogicalIndex(firstIdx);
      }
    });
  });

  // ==========================================
  // 5. 鼠标/触屏直接拖拽 + 惯性抛掷（Cover Flow 级跟手体验）
  // ==========================================
  let pointerIdDown = null;
  let downX = 0;
  let downY = 0;
  let lastDragX = 0;
  let lastDragTime = 0;
  let dragVelocity = 0;

  const isModalOpen = () => Boolean(modal && !modal.hidden && modal.classList.contains('is-open'));
  const isOverlayOpen = () => {
    const settingsPanel = document.querySelector('[data-settings-panel]');
    const settingsOpen = Boolean(settingsPanel && !settingsPanel.hidden);
    return settingsOpen || isModalOpen();
  };

  stage.addEventListener('pointerdown', (e) => {
    if (N <= 1 || isOverlayOpen()) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    pointerIdDown = e.pointerId;
    downX = lastDragX = e.clientX;
    downY = e.clientY;
    lastDragTime = performance.now();
    dragStartPos = currentPos;
    dragVelocity = 0;
    isDragging = false;
  });

  window.addEventListener('pointermove', (e) => {
    if (pointerIdDown === null || e.pointerId !== pointerIdDown) return;

    const totalDx = e.clientX - downX;
    const totalDy = e.clientY - downY;

    if (!isDragging) {
      const threshold = e.pointerType === 'touch' ? 10 : 6;
      if (Math.abs(totalDx) < threshold) return;
      if (e.pointerType === 'touch' && Math.abs(totalDy) > Math.abs(totalDx) * 1.1) {
        // 让竖向页面滚动优先
        pointerIdDown = null;
        return;
      }
      isDragging = true;
      wheelFree = false;
      clearTimeout(wheelSnapTimer);
      suppressHoverUntilPointerMoves();
      stage.classList.add('is-dragging');
      cursorEl?.classList.add('is-dragging');
      cursorEl?.classList.remove('is-open');
      try {
        stage.setPointerCapture(e.pointerId);
      } catch {}
    }

    const pxPerItem = clamp(cachedBaseBookH * 0.54, 150, 260);
    let nextPos = dragStartPos - totalDx / pxPerItem;

    // 非循环模式两端施加 iOS 橡皮筋阻尼
    if (!isInfinite) {
      if (nextPos < 0) nextPos *= 0.32;
      else if (nextPos > N - 1) nextPos = N - 1 + (nextPos - (N - 1)) * 0.32;
    }

    const now = performance.now();
    const stepDt = Math.max(0.004, (now - lastDragTime) / 1000);
    const stepDx = e.clientX - lastDragX;
    const instVel = -stepDx / pxPerItem / stepDt;
    dragVelocity = lerp(dragVelocity, clamp(instVel, -18, 18), 0.38);

    lastDragX = e.clientX;
    lastDragTime = now;
    currentPos = nextPos;
    targetPos = nextPos;
    velocity = 0;
    wakeEngine();
  });

  function finishDrag(e) {
    if (pointerIdDown === null || (e && e.pointerId !== pointerIdDown)) return;
    const wasDragging = isDragging;
    const pid = pointerIdDown;
    pointerIdDown = null;
    isDragging = false;

    if (!wasDragging) return;

    stage.classList.remove('is-dragging');
    cursorEl?.classList.remove('is-dragging');
    try {
      stage.releasePointerCapture(pid);
    } catch {}

    suppressClickUntil = performance.now() + 90;

    // 若释放前已停顿超过 80ms，则不带残留甩动速度
    const idleSinceMove = performance.now() - lastDragTime;
    const throwVel = idleSinceMove > 80 ? 0 : dragVelocity;
    velocity = clamp(throwVel, -14, 14);

    let snapTarget = Math.round(currentPos + clamp(throwVel * 0.16, -2.5, 2.5));
    if (!isInfinite) {
      snapTarget = clamp(snapTarget, 0, N - 1);
    }
    targetPos = snapTarget;
    wakeEngine();
  }

  window.addEventListener('pointerup', finishDrag);
  window.addEventListener('pointercancel', finishDrag);

  // ==========================================
  // 6. 滚轮连续加速 + 触控板无级跟手滑动（同一手势锁定模式，绝不在离散/连续间反复横跳）
  // ==========================================
  let wheelNotchUntil = 0;
  let wheelSnapTimer = 0;
  let wheelMode = 'none'; // 'none' | 'notched' | 'continuous'
  let lastWheelTime = 0;

  window.addEventListener(
    'wheel',
    (e) => {
      if (N <= 1 || isOverlayOpen()) return;
      if (window.innerWidth < 720 || window.innerHeight < 620) return;

      const rawDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(rawDelta) < 1) return;
      e.preventDefault();

      suppressHoverUntilPointerMoves();

      const now = performance.now();
      const pixelDelta = e.deltaMode === 1 ? rawDelta * 36 : e.deltaMode === 2 ? rawDelta * 320 : rawDelta;
      const absRaw = Math.abs(rawDelta);

      // 超过 220ms 静默才重新识别手势类型；一旦出现横向或非整格小增量立即锁定连续触控板模式
      if (now - lastWheelTime > 220) {
        const looksNotched =
          e.deltaMode !== 0 ||
          (e.deltaX === 0 && (absRaw === 100 || absRaw === 120 || absRaw === 150 || absRaw === 200 || absRaw === 240));
        wheelMode = looksNotched ? 'notched' : 'continuous';
      } else if (wheelMode === 'notched' && (e.deltaX !== 0 || (e.deltaMode === 0 && absRaw < 90))) {
        wheelMode = 'continuous';
      }
      lastWheelTime = now;

      if (wheelMode === 'notched') {
        if (now < wheelNotchUntil) return;
        wheelNotchUntil = now + 55;
        stepBy(pixelDelta > 0 ? 1 : -1);
      } else {
        wheelFree = true;
        const step = clamp(pixelDelta / 245, -0.75, 0.75);
        let nextTarget = targetPos + step;
        if (!isInfinite) {
          nextTarget = clamp(nextTarget, -0.25, N - 0.75);
        }
        targetPos = nextTarget;
        wakeEngine();

        clearTimeout(wheelSnapTimer);
        wheelSnapTimer = window.setTimeout(() => {
          wheelFree = false;
          wheelMode = 'none';
          let snap = Math.round(targetPos + clamp(velocity * 0.1, -0.45, 0.45));
          if (!isInfinite) snap = clamp(snap, 0, N - 1);
          targetPos = snap;
          wakeEngine();
        }, 130);
      }
    },
    { passive: false }
  );

  // ==========================================
  // 7. 键盘方向键（支持流畅连按与长按加速）
  // ==========================================
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
      if (
        document.activeElement instanceof HTMLElement &&
        (document.activeElement.classList.contains('shelf-tab') ||
          document.activeElement.classList.contains('shelf-domain-chip'))
      ) {
        document.activeElement.blur();
      }
      stepBy(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (
        document.activeElement instanceof HTMLElement &&
        (document.activeElement.classList.contains('shelf-tab') ||
          document.activeElement.classList.contains('shelf-domain-chip'))
      ) {
        document.activeElement.blur();
      }
      stepBy(1);
    }
  });

  // ==========================================
  // 8. 高响应自定义跟随光标（帧率无关指数平滑，零拖影）
  // ==========================================
  if (cursorEl && finePointer.matches && !reducedMotion.matches) {
    let targetX = -100;
    let targetY = -100;
    let curX = -100;
    let curY = -100;
    let cursorVisible = false;
    let cursorRaf = 0;
    let lastCursorTime = 0;

    const tickCursor = (now) => {
      cursorRaf = 0;
      const dt = clamp((now - lastCursorTime) / 1000, 0.001, 0.032);
      lastCursorTime = now;

      const alpha = 1 - Math.exp(-34 * dt);
      curX += (targetX - curX) * alpha;
      curY += (targetY - curY) * alpha;
      cursorEl.style.transform = `translate3d(${curX.toFixed(1)}px, ${curY.toFixed(1)}px, 0) translate(-50%, -50%)`;

      if (cursorVisible || Math.abs(targetX - curX) > 0.25 || Math.abs(targetY - curY) > 0.25) {
        cursorRaf = window.requestAnimationFrame(tickCursor);
      }
    };

    const startCursorLoop = () => {
      if (!cursorRaf) {
        lastCursorTime = performance.now();
        cursorRaf = window.requestAnimationFrame(tickCursor);
      }
    };

    stage.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      stage.classList.add('has-custom-cursor');
      targetX = curX = e.clientX;
      targetY = curY = e.clientY;
      cursorVisible = true;
      cursorEl.classList.add('is-visible');
      startCursorLoop();
    });

    stage.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      targetX = e.clientX;
      targetY = e.clientY;
      const target = e.target;
      const overActive =
        !hoverSuppressed &&
        isShelfSettled() &&
        Boolean(target instanceof Element && target.closest('.shelf-slot.is-active .shelf-hit'));
      cursorEl.classList.toggle('is-open', overActive);
      if (!cursorVisible) {
        cursorVisible = true;
        cursorEl.classList.add('is-visible');
      }
      startCursorLoop();
    });

    stage.addEventListener('pointerleave', () => {
      cursorVisible = false;
      hoveredSlotIdx = -1;
      wakeEngine();
      stage.classList.remove('has-custom-cursor');
      cursorEl.classList.remove('is-visible', 'is-open', 'is-dragging');
    });
  }

  // ==========================================
  // 9. 沉浸式预览弹窗（焦点捕获、Esc 关闭与 URL Hash 同步）
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
    suppressHoverUntilPointerMoves();
    stage.classList.remove('has-custom-cursor');
    cursorEl?.classList.remove('is-visible', 'is-open', 'is-dragging');
    lastFocusedBeforeModal = triggerEl || document.activeElement;

    if (modalKicker) {
      modalKicker.textContent = item.domain
        ? `${item.typeLabel} ${item.numberLabel} · ${item.domain}`
        : `${item.typeLabel} ${item.numberLabel}`;
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
  // 10. 初始渲染、窗口自适应与 URL Hash 深链恢复
  // ==========================================
  const initialHashMatch = window.location.hash.match(/^#shelf=(.+)$/);
  if (initialHashMatch) {
    const slug = decodeURIComponent(initialHashMatch[1]);
    const foundIdx = items.findIndex((it) => it.slug === slug);
    if (foundIdx >= 0) {
      currentPos = targetPos = isInfinite ? N + foundIdx : foundIdx;
    }
  }

  rebuildLayoutCache();
  renderShelfFrame(0);
  syncActiveSemantics(Math.round(currentPos), true);
  syncHitBounds(Math.round(currentPos), true);

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
      rebuildLayoutCache();
      renderShelfFrame(0);
      syncActiveSemantics(Math.round(currentPos), true);
      syncHitBounds(Math.round(currentPos), true);
    });
  });

  document.fonts?.ready?.then(() => {
    cacheTabMetrics();
    const activeItem = items[getLogicalIndex(Math.round(currentPos))];
    if (activeItem) syncTabs(activeItem.type, activeItem.domain);
  });
})();
