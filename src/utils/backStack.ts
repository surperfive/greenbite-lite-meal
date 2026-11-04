import { useEffect, useRef } from 'react';

/**
 * 小程序级全局返回栈（LIFO）+ 单哨兵 History 同步器
 * ============================================================================
 * 对应 `docs/ui-spec.md §9.1` 的「返回键 / 历史栈」规范落地：
 *
 * 1. 为什么不用「每开一层就无脑 pushState、点 × 时不管」？
 *    - 用户点界面上的 `×` 或「返回」按钮关闭弹窗时，并不会触发浏览器的 `popstate`；
 *      如果每次打开都累加一条 history 记录，关掉弹窗后历史栈里会残留孤儿记录，
 *      导致之后按手机物理返回键出现「要按两三下才有反应」的假死感。
 *
 * 2. 单哨兵（Single-Sentinel）方案：
 *    - 维护内存中的 LIFO 拦截栈 `layers`（弹窗 > 商品详情页 > 二级页 Cart/Fav > Tab 历史）。
 *    - 只要栈非空（`layers.length > 0`），保证 `window.history.state` 顶层有一枚
 *      `{ __gbBackGuard: true }` 哨兵记录。
 *    - 当用户按手机物理返回键 / 左滑手势触发 `popstate` 时：
 *      取出栈顶层的 `onBack()` 执行（关闭最上层弹窗或退回上一页）；
 *      若执行后栈里仍有下层（例如关掉弹窗后底下还开着商品详情页），立即补回单枚哨兵，
 *      确保下一次物理返回继续由小程序接管；若已退到栈底，则不再补哨兵，下次返回正常退出。
 *    - 同时统一监听键盘 `Escape`，按相同 LIFO 栈顶顺序关闭最上层。
 */

interface BackLayerEntry {
  id: symbol;
  onBack: () => void;
}

const layers: BackLayerEntry[] = [];
let initialized = false;
let sentinelArmed = false;

function ensureSentinel() {
  if (typeof window === 'undefined') return;
  if (layers.length > 0 && !sentinelArmed) {
    try {
      const current = window.history.state || {};
      if (!current.__gbBackGuard) {
        window.history.pushState({ ...current, __gbBackGuard: true }, '');
      }
      sentinelArmed = true;
    } catch {
      // Ignore history security errors in restricted sandboxes
    }
  }
}

function initListeners() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  window.addEventListener('popstate', () => {
    sentinelArmed = false;
    if (layers.length === 0) return;

    const top = layers[layers.length - 1];
    top.onBack();

    // 若关闭最上层后仍有下层待拦截，下一帧重新挂上单枚哨兵
    queueMicrotask(() => {
      if (layers.length > 0) {
        ensureSentinel();
      }
    });
  });

  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || layers.length === 0) return;
    const top = layers[layers.length - 1];
    top.onBack();
  });
}

/**
 * 注册一层可被「物理返回键 / 左滑返回 / Esc」关闭的视图或弹窗。
 * 后挂载（或后变为 active）的层处于栈顶，优先响应返回。
 */
export function useBackLayer(active: boolean, onBack: () => void) {
  const cbRef = useRef(onBack);
  cbRef.current = onBack;

  useEffect(() => {
    if (!active) return;
    initListeners();

    const id = Symbol('gb-back-layer');
    const entry: BackLayerEntry = {
      id,
      onBack: () => cbRef.current(),
    };
    layers.push(entry);
    ensureSentinel();

    return () => {
      const idx = layers.findIndex((item) => item.id === id);
      if (idx !== -1) {
        layers.splice(idx, 1);
      }
    };
  }, [active]);
}
