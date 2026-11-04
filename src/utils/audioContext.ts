/* ──────────────────────────────────────────────────────────────────────────
   全局共享的 Web Audio 上下文单例。

   为什么必须共享（踩坑记录，改这里之前先读）：
   1. 原来项目里有**两套各自独立**的音效，都在按下/掀盖那一刻 `new AudioContext()`：
        · GachaPage.playPressSound()  —— 抽卡按钮的按压音
        · FoodCloche3D 的掀盖水晶音
      实测**首次**构造 AudioContext 会阻塞主线程 **230.3ms**，之后只要 0.1ms。
      也就是说页面上第一次抽卡时会先僵住 230ms 才开始掀盖 —— 这就是「掀盖动画很卡」的主因，
      PerformanceObserver 抓到的那条 210ms longtask 就是它。
   2. 两个调用点都只 new 不 close()。抽 3 次就攒下 6 个实例，
      而 Chrome 每页 AudioContext 上限约 6 个，超了 new 会抛异常 → 音效彻底失效。

   现在的做法：全应用共用一个上下文；创建成本用 requestIdleCallback 提前在空闲期付掉；
   真正播放时只剩 resume() + 排振荡器，都是微秒级，不进动画关键路径。
   ────────────────────────────────────────────────────────────────────────── */

let ctx: AudioContext | null = null;
let warmUpScheduled = false;

type AudioCtor = typeof AudioContext;

const resolveCtor = (): AudioCtor | null => {
  const w = window as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor };
  return w.AudioContext || w.webkitAudioContext || null;
};

/**
 * 取全局唯一的 AudioContext（惰性创建）。
 * 注意：创建可能耗时（首次约 230ms），所以**不要**在动画起跑那一帧调用它 ——
 * 先靠 `warmUpAudio()` 预热。
 */
export const getAudioContext = (): AudioContext | null => {
  if (ctx) return ctx;
  const Ctor = resolveCtor();
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
  } catch {
    return null;
  }
  return ctx;
};

/** 空闲预热：把首次构造的开销挪出动画关键路径。重复调用无副作用。 */
export const warmUpAudio = (): void => {
  if (ctx || warmUpScheduled) return;
  warmUpScheduled = true;
  const run = () => {
    warmUpScheduled = false;
    getAudioContext();
  };
  const ric = (
    window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }
  ).requestIdleCallback;
  if (typeof ric === 'function') ric(run, { timeout: 1500 });
  else window.setTimeout(run, 400);
};

/**
 * 确保上下文可用并处于 running 状态。
 * 必须在用户手势（点击/触摸）的调用栈里执行，否则浏览器的自动播放策略会拒绝 resume()。
 */
export const resumeAudio = (): AudioContext | null => {
  const c = getAudioContext();
  if (!c) return null;
  if (c.state === 'suspended') void c.resume();
  return c;
};
