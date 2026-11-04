import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { resumeAudio, warmUpAudio } from '../utils/audioContext';

/**
 * 播放掀盖的水晶音。
 * AudioContext 由 `utils/audioContext` 全局共享并在空闲期预热好，
 * 这里不再自己 new —— 详见该文件的踩坑记录（首次构造会阻塞主线程 230ms）。
 */
const playClocheChime = () => {
  const ctx = resumeAudio();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;

    // 主音（明亮的水晶音）
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5
    osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.12);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1320, now); // E6

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.75);
    osc2.stop(now + 0.75);
  } catch {
    // 音频不可用或被策略拒绝 → 静默降级，不打断动画
  }
};

interface FoodCloche3DProps {
  isDrawing?: boolean;
  isOpen?: boolean;
  onTap?: () => void;
  drawRarity?: 'SSR' | 'SR' | 'R' | null;
  drawMode?: 'single' | 'ten' | null;
  className?: string;
}

export const FoodCloche3D: React.FC<FoodCloche3DProps> = ({
  isDrawing = false,
  isOpen = false,
  onTap,
  drawRarity = 'SSR',
  drawMode = 'single',
  className = 'w-full max-w-[380px] mx-auto'
}) => {
  const isLifted = isOpen || isDrawing;

  /* 餐盖完全盖合之后，才切到「待机呼吸」动画。
     为什么需要这个标志位：待机呼吸的 transition 带 repeat: Infinity，
     如果关盖时直接复用它，x: 32 → 0 的归位会被无限循环反复重放。
     实测（抽卡后采样 10s）餐盖 X 残留右偏最多 27px：
       抽卡前 domeX ∈ [130, 134.7]，抽卡后 domeX ∈ [133.5, 161.3]。
     所以关盖必须先用一次性弹簧归位，归位完成（onAnimationComplete）再开呼吸。 */
  const [domeSettled, setDomeSettled] = useState(false);
  useEffect(() => {
    if (isLifted) setDomeSettled(false);
  }, [isLifted]);

  // 掀盖时播一声水晶音。真正的 AudioContext 已在空闲期预热好，这里只做 resume + 排音符。
  useEffect(() => {
    if (isLifted) playClocheChime();
  }, [isLifted]);

  // 挂载后空闲预热共享音频上下文，把首次约 230ms 的构造成本挪出动画关键路径
  useEffect(() => {
    warmUpAudio();
  }, []);

  return (
    <div
      onClick={onTap}
      className={`relative aspect-[4/3] flex items-center justify-center select-none ${className}`}
      id="gacha-food-cloche-container"
    >
      {/* SVG 3D Model of Food Cloche, Plate, Delicacy & Magical Light Bursts */}
      <svg
        viewBox="0 0 400 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible relative z-10"
      >
        <defs>
          {/* Ground Soft Ambient Shadow */}
          <radialGradient id="clocheGroundShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="0.25" />
            <stop offset="60%" stopColor="#1e293b" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#1e293b" stopOpacity="0" />
          </radialGradient>

          {/* Lime Green Dome Shading (3D Sphere Illusion) */}
          <radialGradient id="domeBodyGrad" cx="42%" cy="28%" r="68%">
            <stop offset="0%" stopColor="#d9f99d" />
            <stop offset="25%" stopColor="#bef264" />
            <stop offset="65%" stopColor="#84cc16" />
            <stop offset="90%" stopColor="#65a30d" />
            <stop offset="100%" stopColor="#4d7c0f" />
          </radialGradient>

          {/* Dome Specular Curvature Highlight */}
          <linearGradient id="domeSpecularGrad" x1="20%" y1="15%" x2="80%" y2="85%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="80%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Dome Lower Rim Trim Gradient */}
          <linearGradient id="domeRimGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4d7c0f" />
            <stop offset="20%" stopColor="#84cc16" />
            <stop offset="50%" stopColor="#d9f99d" />
            <stop offset="80%" stopColor="#84cc16" />
            <stop offset="100%" stopColor="#4d7c0f" />
          </linearGradient>

          {/* Underside Hollow Cavity of Lifted Dome */}
          <radialGradient id="domeUndersideGrad" cx="50%" cy="38%" r="62%">
            <stop offset="0%" stopColor="#142605" />
            <stop offset="65%" stopColor="#28430b" />
            <stop offset="100%" stopColor="#4d7c0f" />
          </radialGradient>

          {/* White Porcelain Plate Gradients */}
          <linearGradient id="plateTopGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>

          <linearGradient id="plateRimBevel" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="30%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>

          {/* Bottom Lime Base Platter */}
          <linearGradient id="basePlatterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4d7c0f" />
            <stop offset="30%" stopColor="#84cc16" />
            <stop offset="50%" stopColor="#bef264" />
            <stop offset="70%" stopColor="#84cc16" />
            <stop offset="100%" stopColor="#4d7c0f" />
          </linearGradient>

          {/* Glossy Black Handle Knob Gradient */}
          <radialGradient id="handleGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="45%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#090d16" />
          </radialGradient>

          {/* Bright Neon Crown Icon Gradient */}
          <linearGradient id="crownNeonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#bef264" />
            <stop offset="100%" stopColor="#65a30d" />
          </linearGradient>

          {/* Glowing Dome Contour Rim Highlight Gradient
              2026-10-18：75% 那一档原为 #bef264（≈背景青柠），穹顶右下缘会直接糊进背景；
              提到 #ecfccb 之后轮廓才整圈都能「抠」出来。这一档不能提到纯白 ——
              右下方是背光侧，纯白会让穹顶看起来是「平贴的剪纸」而不是有体积的球。 */}
          <linearGradient id="domeContourRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="25%" stopColor="#f7fee7" stopOpacity="0.95" />
            <stop offset="75%" stopColor="#ecfccb" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
          </linearGradient>

          {/* Plate Glowing Contour Rim Highlight Gradient (Crisp high-contrast rim light) */}
          <linearGradient id="plateContourRimGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="15%" stopColor="#bef264" stopOpacity="1" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="85%" stopColor="#bef264" stopOpacity="1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
          </linearGradient>

          {/* Plate Bottom Arc Neon Glow Gradient */}
          <linearGradient id="plateBottomGlowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#84cc16" stopOpacity="0.8" />
            <stop offset="25%" stopColor="#bef264" stopOpacity="1" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="75%" stopColor="#bef264" stopOpacity="1" />
            <stop offset="100%" stopColor="#84cc16" stopOpacity="0.8" />
          </linearGradient>

          {/* Radiant Aura Disk Gradient when Cloche Opens */}
          <radialGradient id="dishRadiantGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="30%" stopColor="#fef08a" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#bef264" stopOpacity="0.65" />
            <stop offset="85%" stopColor="#84cc16" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#65a30d" stopOpacity="0" />
          </radialGradient>

          {/* Wide bloom halo — light spilling past the plate silhouette */}
          <radialGradient id="dishBloomHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="38%" stopColor="#ecfccb" stopOpacity="0.55" />
            <stop offset="68%" stopColor="#bef264" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#a3e635" stopOpacity="0" />
          </radialGradient>

          {/* Hot white core — the actual light source */}
          <radialGradient id="dishCoreHot" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.92" />
            <stop offset="75%" stopColor="#fef9c3" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
          </radialGradient>

          {/* Sunburst Beams Gradient */}
          <linearGradient id="sunburstGold" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="35%" stopColor="#fef08a" stopOpacity="0.6" />
            <stop offset="70%" stopColor="#bef264" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#84cc16" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 1. Ground Shadow (Stationary beneath the plate) */}
        <ellipse cx="200" cy="275" rx="160" ry="24" fill="url(#clocheGroundShadow)" />

        {/* 2, 3, 4. THE CLOCHE & SERVING PLATE
            常态下只留**贴轮廓的一圈光**（rim light），不做大面积 bloom：
            青柠穹顶压在青柠背景上，色相差本来就小，靠的是轮廓外沿一道亮边把形体「抠」出来。
            2026-10-18 用户澄清：「外轮廓加一点点光，好从背景分离开来」——
            所以半径压到 2~5px，只够包住描边，再大就变成背景上的一团雾（试过 14/30px，被打回）。
            ⚠️ 亮边必须**窄而亮**：模糊半径越大，边界越软，分离感反而越弱。 */}
        <g
          id="cloche-and-plate-group"
          style={{
            filter:
              'drop-shadow(0 0 2px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 5px rgba(247, 254, 231, 0.45)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.16))',
          }}
        >
          {/* SERVING PLATE ASSEMBLY (Subtle, elegant outer glow for the plate) */}
          <g
            id="plate-assembly-group"
            style={{
              filter:
                'drop-shadow(0 0 2px rgba(255, 255, 255, 0.45)) drop-shadow(0 0 7px rgba(190, 255, 30, 0.25))',
            }}
          >
            {/* 2. Lime Green Bottom Stand / Base Platter */}
            <g id="bottom-lime-base">
              <ellipse cx="200" cy="245" rx="135" ry="28" fill="#4d7c0f" />
              <ellipse
                cx="200"
                cy="242"
                rx="135"
                ry="28"
                fill="url(#basePlatterGrad)"
                stroke="#d9f99d"
                strokeWidth="2"
                strokeOpacity="0.9"
              />
              {/* Base bottom lip depth */}
              <path
                d="M 65 242 C 65 258 125 270 200 270 C 275 270 335 258 335 242 C 335 248 275 264 200 264 C 125 264 65 248 65 242 Z"
                fill="#365314"
              />
              {/* Base Platter Bottom Contour Rim Light Stroke */}
              <path
                d="M 65 242 C 65 260 125 272 200 272 C 275 272 335 260 335 242"
                fill="none"
                stroke="url(#plateBottomGlowGrad)"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <path
                d="M 72 243 C 75 258 128 270 200 270 C 272 270 325 258 328 243"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeOpacity="0.95"
                strokeLinecap="round"
              />
            </g>

            {/* 3. Pure White Ceramic Serving Plate (Saucer) */}
            <g id="white-serving-plate">
              {/* Plate Shadow underneath rim */}
              <ellipse cx="200" cy="235" rx="155" ry="30" fill="#64748b" fillOpacity="0.25" />

              {/* Plate Underside Bevel */}
              <path
                d="M 45 220 C 45 242 114 256 200 256 C 286 256 355 242 355 220 L 355 228 C 355 250 286 264 200 264 C 114 264 45 250 45 228 Z"
                fill="#cbd5e1"
              />

              {/* Plate Lower Underside Contour Rim Light */}
              <path
                d="M 45 222 C 45 245 114 266 200 266 C 286 266 355 245 355 222"
                fill="none"
                stroke="url(#plateContourRimGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <path
                d="M 50 223 C 54 243 118 263 200 263 C 282 263 346 243 350 223"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                strokeOpacity="0.95"
                strokeLinecap="round"
              />

              {/* Plate Main Top Oval Surface */}
              <ellipse
                cx="200"
                cy="220"
                rx="155"
                ry="30"
                fill="url(#plateTopGrad)"
                stroke="url(#plateContourRimGrad)"
                strokeWidth="3"
              />
              {/* Inner Plate Recess Rim (The groove where the cloche rests) */}
              <ellipse
                cx="200"
                cy="220"
                rx="142"
                ry="26"
                fill="#f8fafc"
                stroke="url(#plateRimBevel)"
                strokeWidth="2.5"
              />
              <ellipse cx="200" cy="220" rx="126" ry="22" fill="#e2e8f0" fillOpacity="0.6" />

              {/* High-fidelity Specular Rim Glints on Ceramic Edge */}
              <path
                d="M 46 220 C 50 205 90 196 150 192"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.8"
                strokeOpacity="0.95"
                strokeLinecap="round"
              />
              <path
                d="M 354 220 C 350 205 310 196 250 192"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.8"
                strokeOpacity="0.95"
                strokeLinecap="round"
              />
            </g>
          </g>

          {/* 3.5. PURE LIGHT CORE ON THE PLATE (no food art — the plate is the light source
              that the GachaBurstReveal overlay bursts out of. Revealed when the lid lifts.) */}
          <motion.g
            id="plate-revealed-delicacy"
            initial={false}
            animate={{
              opacity: isLifted ? 1 : 0,
              scale: isLifted ? 1 : 0.88,
              y: isLifted ? 0 : 10,
            }}
            transition={
              isLifted
                ? {
                    /* 光要「漏出来」，不是「弹出来」：
                       亮度 200ms 快速拉起 —— 餐盖还在起抬，光已经先亮，
                       盖子让开多少就露多少，真正的「揭示」由餐盖的运动本身完成；
                       缩放起点从 0.65 收到 0.88（0.65 的 pop 感太强，像贴纸贴上去），
                       并留一点过冲，读起来是「光涌出来」而不是「光被放大」。 */
                    opacity: { duration: 0.2, ease: 'easeOut', delay: 0.05 },
                    scale: { duration: 0.52, ease: [0.34, 1.4, 0.64, 1], delay: 0.05 },
                    y: { duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.05 },
                  }
                : { duration: 0.18, ease: 'easeIn' }
            }
            style={{
              transformOrigin: '200px 220px',
            }}
          >
            {/* Soft Sunburst Beams Rotating Gently */}
            <motion.g
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                repeat: Infinity,
                duration: 22,
                ease: 'linear',
              }}
              style={{ transformOrigin: '200px 210px' }}
            >
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                <path
                  key={deg}
                  d="M 200 210 L 191 100 L 209 100 Z"
                  fill="url(#sunburstGold)"
                  transform={`rotate(${deg} 200 210)`}
                  opacity="0.55"
                />
              ))}
            </motion.g>

            {/* Radiant Light Core on Plate Top — the plate IS the light source.
                三层叠出真正的发光：外层 bloom 溢出盘沿 → 中层光床 → 白热核心。
                单层白/黄渐变铺在白瓷盘上等于没有对比度，必须靠溢出盘沿的光晕才读得出来。 */}
            <motion.g
              animate={{ opacity: [0.82, 1, 0.82], scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
              style={{ transformOrigin: '200px 210px' }}
            >
              {/* 一次性爆发闪光：餐盖让开那一刻到达峰值，再回落到常态光晕。
                  这一记是「光炸出来」的冲击感来源 —— 缺了它，光就只是「渐渐亮起」。 */}
              <motion.ellipse
                cx="200"
                cy="210"
                rx="148"
                ry="44"
                fill="url(#dishBloomHalo)"
                initial={{ opacity: 0 }}
                animate={{ opacity: isLifted ? [0, 0.95, 0.3] : 0 }}
                transition={
                  isLifted
                    ? { duration: 0.8, times: [0, 0.32, 1], ease: 'easeOut' }
                    : { duration: 0.15 }
                }
              />
              {/* 光晕刻意做到比盘面大一圈（rx 172 > 盘 rx 155），
                  这样盖子只开一条缝时，光会**溢出盘沿**而不是全被盖在盘里 ——
                  「露出光」要成立，光必须有一部分落在盘外。 */}
              <ellipse cx="200" cy="208" rx="172" ry="56" fill="url(#dishBloomHalo)" />
              <ellipse cx="200" cy="212" rx="116" ry="30" fill="url(#dishRadiantGlow)" />
              <ellipse cx="200" cy="210" rx="48" ry="16" fill="url(#dishCoreHot)" />
              <ellipse cx="200" cy="210" rx="22" ry="8" fill="#ffffff" fillOpacity="0.95" />
            </motion.g>

            {/* Floating Sparkle Stars around the Light Core
                外层是「被气流推出去」的一次性爆发（handfeel §4 次级运动）：
                掀盖瞬间星点向外弹一下再收回常态呼吸 —— 缺了它，画面里就只有主角在动。 */}
            <motion.g
              initial={{ scale: 0.75 }}
              animate={isLifted ? { scale: [0.75, 1.3, 1] } : { scale: 0.75 }}
              transition={
                isLifted
                  ? { duration: 0.72, times: [0, 0.36, 1], ease: 'easeOut', delay: 0.12 }
                  : { duration: 0.15 }
              }
              style={{ transformOrigin: '200px 150px' }}
            >
              <motion.g
                animate={{
                  scale: [0.9, 1.2, 0.9],
                  rotate: [0, 45, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.8,
                  ease: 'easeInOut',
                }}
              >
                <g transform="translate(126, 155)">
                  <path d="M 6 0 L 7.5 4.5 L 12 6 L 7.5 7.5 L 6 12 L 4.5 7.5 L 0 6 L 4.5 4.5 Z" fill="#fef08a" />
                </g>
                <g transform="translate(258, 150)">
                  <path d="M 7 0 L 8.5 5.5 L 14 7 L 8.5 8.5 L 7 14 L 5.5 8.5 L 0 7 L 5.5 5.5 Z" fill="#bef264" />
                </g>
                <g transform="translate(196, 126)">
                  <path d="M 5 0 L 6 3.5 L 10 5 L 6 6.5 L 5 10 L 4 6.5 L 0 5 L 4 3.5 Z" fill="#ffffff" />
                </g>
              </motion.g>
            </motion.g>
          </motion.g>

          {/* 4. THE 3D LIME GREEN DOME CLOCHE (Smoothly tilts up and opens high upon summon!) */}
          <motion.g
            id="cloche-lifting-dome"
            animate={
              isLifted
                ? {
                    /* 单侧微开：**以餐盖最左端为支点**掀开一条缝，不是把盖子整体搬走。
                       支点 = 穹顶底缘 (rx=122 / cy=216) 的**左端点 (78, 216)**。
                       ⚠️ 支点在左端，所以必须用**负角**：绕左端逆时针转 = 右边缘上抬。
                       若哪天把支点换回右端 (322, 216)，这里的符号要一起翻，否则会变成往盘子里压。
                       因为绕支点旋转不产生水平位移，所以 x 恒为 0，y 只走几像素，
                       旋转才是主角：
                         0.00  静止
                         0.13  下压预备 —— 反向微旋 +3°，先把「要发力」说出来
                         0.42  开始掀 —— rotate 已到 -10°，而 y 才 -2（位移刻意滞后）
                         0.74  过冲 —— -23°，越过最终值
                         1.00  回稳 —— -20°
                       角度是量出来的：12° 几乎看不出开、27° 又偏大，
                       实测 18–21° 之间才既明确「单侧翘起」又留得住「盖子在盘上」的感觉。
                       位移滞后于旋转，与「盖子绕铰链转」的物理直觉一致。 */
                    /* 三段式：**扑腾蓄势 → 掀开 → 回稳**。刚体变换，无缩放/错切。

                       参考业界开箱动画的通用结构（「Shake & Open」）：
                       先用一段抖动循环把张力堆起来，再爆开。
                       两个关键点：
                         · **振幅递增** —— 3.5° → 7° → 11°，越抖越狠，张力才堆得起来；
                           等幅抖动会读成机械的往复，不像「盖子被顶得按不住」。
                         · 每次「砸下」回到 0 而不是停在半途 —— 盖子要拍回盘面，
                           才有「盖不住」的挣扎感。
                       扑腾段位移几乎为 0（盖子是在盘上拍，不是浮起来拍），
                       掀开段位移才起来（y 到 -34）造出读作「打开」的缝隙。

                       x 恒为 0：绕左端点的旋转不产生水平位移。 */
                    x: 0,
                    y: [0, -1.5, 0.5, -2.5, 0.5, -4, 0.5, -2, -34, -30],
                    rotate: [0, -3.5, 0, -7, 0, -11, 0, -3, -12, -8],
                  }
                : domeSettled
                ? {
                    /* 待机呼吸：纯位移，不旋转。
                       支点在左端，绕它旋转会让右边缘翘起来「像盖子松了」。 */
                    x: 0,
                    y: [0, 0, -5, -4, 0, 0],
                    rotate: 0,
                  }
                : { x: 0, y: 0, rotate: 0 }
            }
            transition={
              isLifted
                ? {
                    duration: 1.4,
                    times: [0, 0.05, 0.11, 0.18, 0.24, 0.31, 0.37, 0.45, 0.64, 1],
                    ease: [
                      [0.2, 0.9, 0.3, 1], // 扑腾：抬起 1（快出）
                      [0.55, 0, 0.85, 0.4], // 扑腾：砸下 1（加速砸向盘面，出冲击感）
                      [0.2, 0.9, 0.3, 1], // 扑腾：抬起 2
                      [0.55, 0, 0.85, 0.4], // 扑腾：砸下 2
                      [0.2, 0.9, 0.3, 1], // 扑腾：抬起 3（幅度最大）
                      [0.55, 0, 0.85, 0.4], // 扑腾：砸下 3
                      [0.25, 1, 0.4, 1], // 蓄势：最后一次抬到顶
                      [0.45, 0, 0.4, 1], // 转入掀开
                      [0.34, 1.35, 0.64, 1], // 掀开过冲
                      [0.34, 1, 0.64, 1], // 回稳
                    ],
                  }
                : domeSettled
                ? {
                    repeat: Infinity,
                    duration: 4.2,
                    times: [0, 0.45, 0.62, 0.76, 0.88, 1],
                    ease: 'easeInOut',
                  }
                : {
                    type: 'spring',
                    stiffness: 170,
                    damping: 19,
                    mass: 0.85,
                  }
            }
            onAnimationComplete={() => {
              if (!isLifted && !domeSettled) setDomeSettled(true);
            }}
            style={{
              /* ⚠️ 轴心必须用**用户坐标**显式指定，不能用 fill-box。
                 原写法是 `transformOrigin: '280px 222px'` + `transformBox: 'fill-box'`，
                 fill-box 让这两个长度变成「相对包围盒左上角」的偏移，
                 而穹顶包围盒左上角约在 (78, 52)，于是实际轴心落到 (358, 274)
                 —— 盘子右下方**外面**。结果盖子被整个甩出去，开合幅度大得离谱。
                 现在改成 view-box（SVG 默认值）+ 用户坐标 (78, 216)：
                 正好是穹顶底缘 rx=122 / cy=216 的**左端点**，也就是盖子压在盘沿上的位置。
                 支点在左 → 掀开角为**负**（见上方 animate 里的说明）。
                 注意当前是以**整体抬起**为主、旋转为辅；支点只决定旋转中心。 */
              transformOrigin: '78px 216px',
              transformBox: 'view-box',
            }}
          >
            {/* Lifted Interior Cavity (Visible when dome tilts open)
                改成 motion.g 淡入 —— 原来直接挂载是硬切，会看到一次突兀的跳变。
                仍然保留条件挂载（不引 AnimatePresence）：合盖时餐盖本来就把它遮住。 */}
            {isLifted && (
              <motion.g
                id="cloche-interior-cavity"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <ellipse
                  cx="200"
                  cy="214"
                  rx="121"
                  ry="21"
                  fill="url(#domeUndersideGrad)"
                  stroke="#4d7c0f"
                  strokeWidth="2.5"
                />
                <ellipse cx="200" cy="214" rx="114" ry="17" fill="#142605" fillOpacity="0.8" />
                <ellipse
                  cx="200"
                  cy="213"
                  rx="112"
                  ry="15"
                  fill="none"
                  stroke="#84cc16"
                  strokeWidth="1.5"
                  strokeOpacity="0.7"
                />
              </motion.g>
            )}

            {/* A. Bottom Rim Base Lip of the Dome */}
            <ellipse cx="200" cy="216" rx="122" ry="22" fill="#365314" />
            <ellipse cx="200" cy="212" rx="122" ry="22" fill="url(#domeRimGrad)" />
            {/* Rim Reflection Highlight */}
            <ellipse
              cx="200"
              cy="210"
              rx="120"
              ry="20"
              fill="none"
              stroke="#f7fee7"
              strokeWidth="2.8"
              strokeOpacity="0.9"
            />

            {/* B. Main Cloche Spherical Dome Body */}
            <path
              d="
                M 78 210 
                C 78 120 132 80 200 80 
                C 268 80 322 120 322 210 
                C 322 230 268 234 200 234 
                C 132 234 78 230 78 210 Z
              "
              fill="url(#domeBodyGrad)"
              stroke="url(#domeContourRimGrad)"
              strokeWidth="2.6"
            />

            {/* C. Glossy Specular Light Curve (Left-facing highlight) */}
            <path
              d="
                M 115 190 
                C 115 130 148 95 195 90 
                C 185 92 145 125 140 185 
                C 130 190 120 190 115 190 Z
              "
              fill="url(#domeSpecularGrad)"
            />
            {/* Top Bright Curved Light Glint */}
            <ellipse
              cx="170"
              cy="115"
              rx="35"
              ry="18"
              fill="#ffffff"
              fillOpacity="0.45"
              transform="rotate(-25 170 115)"
            />
            <ellipse
              cx="160"
              cy="108"
              rx="14"
              ry="7"
              fill="#ffffff"
              fillOpacity="0.75"
              transform="rotate(-25 160 108)"
            />

            {/* D. Right Ambient Soft Shadow on Dome */}
            <path
              d="
                M 270 120 
                C 305 150 320 185 320 210 
                C 310 220 280 226 250 228 
                C 290 220 300 180 270 120 Z
              "
              fill="#365314"
              fillOpacity="0.35"
            />

            {/* E. Glossy Black Handle Cushion Knob with Bright Neon Crown */}
            <g id="cloche-crown-knob" transform="translate(176, 52)">
              {/* Knob Base Shadow on Dome */}
              <ellipse cx="24" cy="30" rx="22" ry="7" fill="#14532d" fillOpacity="0.6" />

              {/* Glossy Black Rounded Square Cushion Knob */}
              <rect
                x="2"
                y="2"
                width="44"
                height="30"
                rx="12"
                fill="url(#handleGrad)"
                stroke="#0f172a"
                strokeWidth="2.5"
              />
              {/* Bevel highlight on handle edge */}
              <path
                d="M 12 5 Q 24 3 36 5"
                stroke="#94a3b8"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeOpacity="0.8"
              />
              <path
                d="M 6 12 Q 4 17 6 22"
                stroke="#64748b"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeOpacity="0.6"
              />

              {/* Neon Lime 3D Crown Icon */}
              <g transform="translate(10, 8)">
                {/* Crown Glow */}
                <path
                  d="M 2 15 L 6 3 L 14 10 L 22 3 L 26 15 Z"
                  fill="#bef264"
                  fillOpacity="0.4"
                  filter="blur(1px)"
                />
                {/* Crown Solid Graphic */}
                <path
                  d="M 3 14 L 6 4 L 14 10 L 22 4 L 25 14 C 25 15 23 16 14 16 C 5 16 3 15 3 14 Z"
                  fill="url(#crownNeonGrad)"
                  stroke="#1e293b"
                  strokeWidth="1"
                />
                {/* Crown Top Jewels / Highlight */}
                <circle cx="6" cy="4" r="1.5" fill="#fef08a" />
                <circle cx="14" cy="10" r="1.5" fill="#fef08a" />
                <circle cx="22" cy="4" r="1.5" fill="#fef08a" />
              </g>
            </g>
          </motion.g>
        </g>
      </svg>

      {/* Subtle Floating Sparkle Stars around Cloche */}
      <div className="absolute -top-1 -left-2 text-yellow-300 pointer-events-none">
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-yellow-400">
          <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
        </svg>
      </div>
      <div className="absolute top-8 -right-3 text-yellow-400 pointer-events-none">
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-lime-400">
          <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
        </svg>
      </div>
    </div>
  );
};
