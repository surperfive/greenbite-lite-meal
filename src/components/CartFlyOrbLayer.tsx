import React, { useEffect, useRef, useState } from 'react';

export type ToteMascotStage = 'idle' | 'anticipating' | 'catching' | 'happy';

export interface FlyingOrbItem {
  id: string;
  dishName: string;
  dishImage: string;
  startX: number;
  startY: number;
  createdAt: number;
  duration: number;
}

interface ImpactBurst {
  id: string;
  x: number;
  y: number;
  createdAt: number;
}

interface TrailSparkle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

interface CartFlyOrbLayerProps {
  orbs: FlyingOrbItem[];
  onOrbComplete: (id: string) => void;
  onMascotStageChange: (stage: ToteMascotStage) => void;
}

/**
 * Cubic Parabolic Bezier helper
 * Computes a high-arcing parabolic curve from (x0, y0) to (x2, y2)
 * so the light orb rises gracefully before diving into the open tote bag mouth.
 */
function getParabolicPoint(
  t: number,
  x0: number,
  y0: number,
  x2: number,
  y2: number
): { x: number; y: number; angle: number } {
  const dx = x2 - x0;
  const dy = y2 - y0;
  const dist = Math.hypot(dx, dy);
  const arcLift = Math.min(155, Math.max(75, dist * 0.42));

  const cx1 = x0 + dx * 0.28;
  const cy1 = Math.min(y0, y2) - arcLift;
  const cx2 = x2 - dx * 0.08;
  const cy2 = Math.min(y0, y2) - arcLift * 0.55;

  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  const x = uuu * x0 + 3 * uu * t * cx1 + 3 * u * tt * cx2 + ttt * x2;
  const y = uuu * y0 + 3 * uu * t * cy1 + 3 * u * tt * cy2 + ttt * y2;

  const dxdt =
    3 * uu * (cx1 - x0) + 6 * u * t * (cx2 - cx1) + 3 * tt * (x2 - cx2);
  const dydt =
    3 * uu * (cy1 - y0) + 6 * u * t * (cy2 - cy1) + 3 * tt * (y2 - cy2);
  const angle = Math.atan2(dydt, dxdt) * (180 / Math.PI);

  return { x, y, angle };
}

/**
 * Custom easing: smooth condensation during dish->light morph, then gravitational acceleration into the bag
 */
function easeMorphAndDive(rawT: number): number {
  if (rawT < 0.18) {
    const local = rawT / 0.18;
    return 0.08 * (local * local);
  }
  const flightT = (rawT - 0.18) / 0.82;
  return 0.08 + 0.92 * (0.35 * flightT + 0.65 * flightT * flightT);
}

export const CartFlyOrbLayer: React.FC<CartFlyOrbLayerProps> = ({
  orbs,
  onOrbComplete,
  onMascotStageChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, setRenderTick] = useState(0);
  const [bursts, setBursts] = useState<ImpactBurst[]>([]);

  const orbsRef = useRef<FlyingOrbItem[]>(orbs);
  orbsRef.current = orbs;

  const completedSetRef = useRef<Set<string>>(new Set());
  const sparklesRef = useRef<TrailSparkle[]>([]);
  const sparkleIdRef = useRef(0);
  const stageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const happyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const liveOrbStatesRef = useRef<
    Map<
      string,
      {
        x: number;
        y: number;
        rawT: number;
        easedT: number;
        angle: number;
        targetX: number;
        targetY: number;
      }
    >
  >(new Map());

  useEffect(() => {
    if (orbs.length > 0) {
      if (stageTimeoutRef.current) clearTimeout(stageTimeoutRef.current);
      if (happyTimeoutRef.current) clearTimeout(happyTimeoutRef.current);
      onMascotStageChange('anticipating');
    }
  }, [orbs.length, onMascotStageChange]);

  useEffect(() => {
    let rafId: number;

    const updateFrame = (now: number) => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) {
        rafId = requestAnimationFrame(updateFrame);
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (
        canvas.width !== Math.round(containerRect.width * dpr) ||
        canvas.height !== Math.round(containerRect.height * dpr)
      ) {
        canvas.width = Math.round(containerRect.width * dpr);
        canvas.height = Math.round(containerRect.height * dpr);
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, containerRect.width, containerRect.height);
      }

      // Measure current tote bag mouth position in container coordinates
      const mouthEl = document.getElementById('floating-cart-tote-mouth');
      let targetX = 48;
      let targetY = containerRect.height - 132;
      if (mouthEl) {
        const mouthRect = mouthEl.getBoundingClientRect();
        targetX = mouthRect.left - containerRect.left + mouthRect.width * 0.52;
        targetY = mouthRect.top - containerRect.top + mouthRect.height * 0.5;
      }

      const activeOrbs = orbsRef.current;
      let needsReactRender = false;

      for (const orb of activeOrbs) {
        const elapsed = now - orb.createdAt;
        const rawT = Math.min(1, Math.max(0, elapsed / orb.duration));
        const easedT = easeMorphAndDive(rawT);

        const pt = getParabolicPoint(
          easedT,
          orb.startX,
          orb.startY,
          targetX,
          targetY
        );

        liveOrbStatesRef.current.set(orb.id, {
          x: pt.x,
          y: pt.y,
          rawT,
          easedT,
          angle: pt.angle,
          targetX,
          targetY
        });
        needsReactRender = true;

        // Draw silky, borderless tapered light trail on Canvas
        if (ctx && rawT > 0.04 && rawT < 0.99) {
          const tailSegments = 18;
          const tailSpan = Math.min(easedT, 0.26);

          for (let i = 0; i < tailSegments; i++) {
            const frac0 = i / tailSegments;
            const frac1 = (i + 1) / tailSegments;
            const t0 = Math.max(0, easedT - tailSpan * frac0);
            const t1 = Math.max(0, easedT - tailSpan * frac1);
            const p0 = getParabolicPoint(t0, orb.startX, orb.startY, targetX, targetY);
            const p1 = getParabolicPoint(t1, orb.startX, orb.startY, targetX, targetY);

            const falloff = Math.pow(1 - frac0, 1.6);

            // Soft outer neon-lime light aura along trail
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.strokeStyle = `rgba(199, 246, 101, ${0.42 * falloff})`;
            ctx.lineWidth = 16 * falloff * (1 - rawT * 0.25);
            ctx.lineCap = 'round';
            ctx.stroke();

            // Inner warm white-gold light filament
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.strokeStyle = `rgba(255, 255, 235, ${0.82 * falloff})`;
            ctx.lineWidth = 6 * falloff * (1 - rawT * 0.25);
            ctx.lineCap = 'round';
            ctx.stroke();
          }

          // Spawn soft glowing bokeh light motes along trajectory (no hard borders)
          if (Math.random() < 0.72) {
            const colors = ['255, 255, 255', '255, 248, 130', '199, 246, 101'];
            sparklesRef.current.push({
              id: ++sparkleIdRef.current,
              x: pt.x + (Math.random() - 0.5) * 12,
              y: pt.y + (Math.random() - 0.5) * 12,
              vx: (Math.random() - 0.5) * 1.1,
              vy: (Math.random() - 0.5) * 1.1 - 0.35,
              size: 4 + Math.random() * 6,
              color: colors[Math.floor(Math.random() * colors.length)],
              alpha: 0.9,
              decay: 0.036 + Math.random() * 0.024
            });
          }
        }

        // Check completion
        if (rawT >= 1 && !completedSetRef.current.has(orb.id)) {
          completedSetRef.current.add(orb.id);
          liveOrbStatesRef.current.delete(orb.id);

          // Spawn soft radial light motes on arrival
          for (let i = 0; i < 14; i++) {
            const angle = (Math.PI * 2 * i) / 14 + (Math.random() - 0.5) * 0.3;
            const speed = 1.6 + Math.random() * 3.0;
            const colors = ['255, 255, 255', '255, 248, 130', '199, 246, 101'];
            sparklesRef.current.push({
              id: ++sparkleIdRef.current,
              x: targetX,
              y: targetY,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed - 1.1,
              size: 5 + Math.random() * 6,
              color: colors[i % colors.length],
              alpha: 0.95,
              decay: 0.032 + Math.random() * 0.02
            });
          }

          setBursts((prev) => [
            ...prev.slice(-4),
            { id: orb.id, x: targetX, y: targetY, createdAt: now }
          ]);

          onMascotStageChange('catching');
          if (stageTimeoutRef.current) clearTimeout(stageTimeoutRef.current);
          if (happyTimeoutRef.current) clearTimeout(happyTimeoutRef.current);

          stageTimeoutRef.current = setTimeout(() => {
            onMascotStageChange('happy');
            happyTimeoutRef.current = setTimeout(() => {
              onMascotStageChange('idle');
            }, 820);
          }, 190);

          onOrbComplete(orb.id);
        }
      }

      // Render soft radial-gradient light motes on canvas
      if (ctx && sparklesRef.current.length > 0) {
        const remaining: TrailSparkle[] = [];
        for (const sp of sparklesRef.current) {
          sp.x += sp.vx;
          sp.y += sp.vy;
          sp.vy += 0.04;
          sp.alpha -= sp.decay;

          if (sp.alpha > 0.02) {
            remaining.push(sp);
            const a = Math.max(0, sp.alpha);
            const radGrad = ctx.createRadialGradient(
              sp.x,
              sp.y,
              0,
              sp.x,
              sp.y,
              sp.size
            );
            radGrad.addColorStop(0, `rgba(255, 255, 255, ${a})`);
            radGrad.addColorStop(0.4, `rgba(${sp.color}, ${a * 0.8})`);
            radGrad.addColorStop(1, `rgba(${sp.color}, 0)`);

            ctx.fillStyle = radGrad;
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        sparklesRef.current = remaining;
      }

      if (ctx) {
        ctx.restore();
      }

      setBursts((prev) => prev.filter((b) => now - b.createdAt < 520));

      if (
        needsReactRender ||
        activeOrbs.length > 0 ||
        sparklesRef.current.length > 0
      ) {
        setRenderTick((t) => (t + 1) % 100000);
      }

      rafId = requestAnimationFrame(updateFrame);
    };

    rafId = requestAnimationFrame(updateFrame);
    return () => cancelAnimationFrame(rafId);
  }, [onOrbComplete, onMascotStageChange]);

  return (
    <div
      ref={containerRef}
      id="cart-fly-orb-stage"
      className="absolute inset-0 z-50 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* High-FPS Soft Light Trail & Bokeh Mote Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Ethereal Borderless Glowing Light Orbs */}
      {orbs.map((orb) => {
        const state = liveOrbStatesRef.current.get(orb.id);
        if (!state) return null;

        const { x, y, rawT } = state;

        // Phase 1 (0 -> 0.28): Dish thumbnail smoothly dissolves into pure light energy
        const photoOpacity = Math.max(0, 1 - rawT / 0.28);
        const orbOpacity = Math.min(1, rawT / 0.14);

        let scale = 1;
        if (rawT < 0.2) {
          scale = 1.05 - (rawT / 0.2) * 0.18;
        } else if (rawT < 0.82) {
          scale = 0.87 - ((rawT - 0.2) / 0.62) * 0.12;
        } else {
          const diveT = (rawT - 0.82) / 0.18;
          scale = 0.75 * (1 - diveT * 0.65);
        }

        return (
          <div
            key={orb.id}
            style={{
              transform: `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`,
              willChange: 'transform'
            }}
            className="absolute top-0 left-0 w-16 h-16 flex items-center justify-center pointer-events-none"
          >
            {/* Layer 1: Wide Soft Atmospheric Lime-Gold Halo (No border, pure feathered light) */}
            <div
              style={{ opacity: orbOpacity }}
              className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,252,140,0.9)_0%,rgba(199,246,101,0.72)_38%,rgba(130,232,40,0.28)_62%,rgba(130,232,40,0)_78%)] blur-[6px]"
            />

            {/* Layer 2: Intense Radiant Inner Aura */}
            <div
              style={{ opacity: orbOpacity }}
              className="absolute w-9 h-9 rounded-full bg-[radial-gradient(circle,#FFFFFF_0%,#FFF996_42%,#C7F665_74%,rgba(199,246,101,0)_100%)] blur-[1.5px]"
            />

            {/* Layer 3: Pure White-Hot Luminous Core */}
            <div
              style={{ opacity: orbOpacity }}
              className="relative w-5 h-5 rounded-full bg-[radial-gradient(circle,#FFFFFF_0%,#FFFFFF_55%,rgba(255,252,170,0)_100%)] shadow-[0_0_16px_4px_rgba(255,255,255,0.95),0_0_28px_10px_rgba(199,246,101,0.85)]"
            />

            {/* Morphing Dish Miniature (Soft circular feathering, no hard border) */}
            {photoOpacity > 0.02 && (
              <div
                style={{
                  opacity: photoOpacity,
                  transform: `scale(${0.55 + photoOpacity * 0.5})`
                }}
                className="absolute w-12 h-12 rounded-full overflow-hidden shadow-[0_0_24px_8px_rgba(255,252,150,0.9)]"
              >
                <img
                  src={orb.dishImage}
                  alt=""
                  className="w-full h-full object-cover"
                 loading="lazy" decoding="async" />
                <div
                  style={{ opacity: 1 - photoOpacity * 0.7 }}
                  className="absolute inset-0 bg-[radial-gradient(circle,#FFFFFF_0%,#FFF870_60%,#C7F665_100%)] mix-blend-screen"
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Soft Ethereal Light Bloom Flash at Bag Mouth on Arrival */}
      {bursts.map((burst) => (
        <div
          key={burst.id}
          style={{
            left: burst.x,
            top: burst.y
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        >
          <div className="w-16 h-16 rounded-full bg-[radial-gradient(circle,#FFFFFF_0%,rgba(255,249,130,0.85)_35%,rgba(199,246,101,0.45)_62%,rgba(199,246,101,0)_100%)] blur-[3px] animate-[ping_0.44s_cubic-bezier(0,0,0.2,1)_forwards]" />
        </div>
      ))}
    </div>
  );
};
