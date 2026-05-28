import React, { useState, useRef, useEffect, useCallback } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import { usePhysicsEngine } from '../../hooks/usePhysicsEngine';
import { drawArrow, scaleCanvas, drawMixedText, drawCoordinateGrid, resolveColor } from '../../components/physics/drawUtils';
import { SimulationLayout } from '../../components/layout/SimulationLayout';

const g = 9.8;

export default function FrictionAppliedForce() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const plotRef   = useRef<HTMLCanvasElement>(null);
  const sceneWidthRef = useRef<number>(800);

  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => setFontsReady(true));
    }
  }, []);

  const [params, setParams] = useState({
    mass: 5.0,
    mu_s: 0.6,
    mu_k: 0.4,
    F_app: 10.0
  });

  const [state, setState] = useState({ x: 0, v: 0, a: 0, f_friction: 0 });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseFloat(e.target.value);
    if (e.target.name === 'mu_k' && value > params.mu_s) value = params.mu_s;
    if (e.target.name === 'mu_s' && value < params.mu_k) value = params.mu_k;
    setParams(prev => ({ ...prev, [e.target.name]: value }));
  };

  const physicsStep = useCallback((dt: number) => {
    setState(prev => {
      const F_N    = params.mass * g;
      const fs_max = params.mu_s * F_N;
      const fk     = params.mu_k * F_N;
      let a = 0, f_friction = 0;

      if (Math.abs(prev.v) < 0.05) {
        if (Math.abs(params.F_app) <= fs_max) {
          f_friction = -params.F_app; a = 0;
        } else {
          f_friction = -Math.sign(params.F_app) * fk;
          a = (params.F_app + f_friction) / params.mass;
        }
      } else {
        f_friction = -Math.sign(prev.v) * fk;
        a = (params.F_app + f_friction) / params.mass;
      }

      let v_new = prev.v + a * dt;
      let x_new = prev.x + prev.v * dt + 0.5 * a * dt * dt;

      if (prev.v * v_new < 0 && Math.abs(params.F_app) <= fs_max) {
        v_new = 0; a = 0; f_friction = -params.F_app;
      }
      const w = sceneWidthRef.current;
      const bw = 80;
      const scale = 20;
      const limitX = Math.max(2.0, (w / 2 - bw / 2 - 20) / scale);
      if (x_new > limitX) {
        x_new = limitX;
        v_new = 0;
        a = 0;
      }
      if (x_new < -limitX) {
        x_new = -limitX;
        v_new = 0;
        a = 0;
      }
      return { x: x_new, v: v_new, a, f_friction };
    });
  }, [params]);

  const { isRunning, toggle, reset } = usePhysicsEngine({
    onStep: physicsStep,
    onReset: () => setState({ x: 0, v: 0, a: 0, f_friction: 0 })
  });

  useEffect(() => { if (!isRunning) physicsStep(0); }, [params, isRunning, physicsStep]);

  const F_N    = params.mass * g;
  const fs_max = params.mu_s * F_N;
  const isStatic = Math.abs(state.v) < 0.05 && Math.abs(params.F_app) <= fs_max;

  // ── Main scene ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.parentElement!.clientWidth;
    sceneWidthRef.current = w;
    const ctx = scaleCanvas(canvas, w, 390);
    const h = 390;

    // Draw textbook grid paper background first
    drawCoordinateGrid(ctx, w, h, {
      backgroundColor: '#fcfdfd',
      gridColor: '#e2e8f0',
      subdivisionColor: '#f8fafc'
    });

    const floorY = h - 130;

    // Floor with textbook hatch marks
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, floorY, w, 100);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, floorY); ctx.lineTo(w, floorY); ctx.stroke();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    for (let hx = -50; hx < w + 50; hx += 20) {
      ctx.beginPath(); ctx.moveTo(hx, floorY); ctx.lineTo(hx + 40, floorY + 40); ctx.stroke();
    }

    const scale = 20;
    const cx = w / 2 + state.x * scale;
    const cy = floorY;
    const bw = 80, bh = 60;

    // Block shadow + body
    ctx.fillStyle = 'rgba(15, 23, 42, 0.04)';
    ctx.fillRect(cx - bw / 2 + 4, cy - bh + 4, bw, bh);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(cx - bw / 2, cy - bh, bw, bh);
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 2.5;
    ctx.strokeRect(cx - bw / 2, cy - bh, bw, bh);

    // Center the italicized mass parameter label 'm' inside the block
    drawMixedText(ctx, cx, cy - bh / 2,
      [{ text: 'm', italic: true }],
      { fontSize: 16, color: '#334155', align: 'center', baseline: 'middle' });

    // Adaptive Force Vector Scale Factor
    // Standardizes the normal force vector to be exactly 90px on screen.
    const F_N = params.mass * g;
    const forceScale = 90 / F_N;

    // 1. Gravity Vector (points straight down from center of mass)
    const gMag = F_N;
    const gTip = drawArrow(ctx, cx, cy - bh / 2, gMag * forceScale, Math.PI / 2, 'var(--color-gravity)', 4.5);
    drawMixedText(ctx, gTip.hx, gTip.hy + 12,
      [{ text: 'F', italic: true, vector: true }, { text: 'g', italic: false, subscript: true }],
      { fontSize: 16, color: 'var(--color-gravity)', align: 'center', baseline: 'top' });

    // 2. Normal Force Vector (points straight up from center of mass, avoiding shaft overlaps)
    const nTip = drawArrow(ctx, cx, cy - bh / 2, F_N * forceScale, -Math.PI / 2, 'var(--color-normal)', 4.5);
    drawMixedText(ctx, nTip.hx, nTip.hy - 12,
      [{ text: 'F', italic: true, vector: true }, { text: 'N', italic: false, subscript: true }],
      { fontSize: 16, color: 'var(--color-normal)', align: 'center', baseline: 'bottom' });

    // 3. Applied Force Vector (points left/right from center of mass)
    if (Math.abs(params.F_app) > 0.1) {
      const dir = params.F_app >= 0 ? 0 : Math.PI;
      const tip = drawArrow(ctx, cx, cy - bh / 2,
        Math.abs(params.F_app) * forceScale, dir,
        'var(--color-force-app)', 4.5);
      drawMixedText(ctx, tip.hx + (params.F_app >= 0 ? 12 : -12), cy - bh / 2,
        [{ text: 'F', italic: true, vector: true }, { text: 'app', italic: false, subscript: true }],
        { fontSize: 16, color: 'var(--color-force-app)',
          align: params.F_app >= 0 ? 'left' : 'right', baseline: 'middle' });
    }

    // 4. Friction Force Vector (points left/right from contact floor surface)
    if (Math.abs(state.f_friction) > 0.1) {
      const dir = state.f_friction >= 0 ? 0 : Math.PI;
      const ftip = drawArrow(ctx, cx, cy - 2,
        Math.abs(state.f_friction) * forceScale, dir,
        'var(--color-friction)', 4.5);
      drawMixedText(ctx, ftip.hx + (state.f_friction >= 0 ? 12 : -12), cy - 14,
        [{ text: 'f', italic: true, vector: true }],
        { fontSize: 16, color: 'var(--color-friction)',
          align: state.f_friction >= 0 ? 'left' : 'right', baseline: 'middle' });
    }

    // 5. Velocity Vector (kinematic quantity, independent scale)
    if (Math.abs(state.v) > 0.1) {
      const dir = state.v >= 0 ? 0 : Math.PI;
      const vtip = drawArrow(ctx, cx, cy - bh - 20,
        Math.abs(state.v) * 15, dir,
        'var(--color-vel)', 4.5);
      drawMixedText(ctx, vtip.hx + (state.v >= 0 ? 12 : -12), cy - bh - 20,
        [{ text: 'v', italic: true, vector: true }],
        { fontSize: 16, color: 'var(--color-vel)',
          align: state.v >= 0 ? 'left' : 'right', baseline: 'middle' });
    }
  }, [state, params, fontsReady]);

  // ── f vs F_app mini plot ──────────────────────────────────────────────────
  useEffect(() => {
    const canvas = plotRef.current;
    if (!canvas) return;
    const ctx = scaleCanvas(canvas, canvas.parentElement!.clientWidth, 220);
    const w = canvas.parentElement!.clientWidth;
    const h = 220;

    ctx.clearRect(0, 0, w, h);

    const padL = 58, padR = 14, padT = 14, padB = 42;
    const chartW = w - padL - padR;
    const chartH = h - padT - padB;

    const fMax = 50;
    const mapFx = (f: number) => padL + (f / fMax) * chartW;
    const mapFy = (f: number) => h - padB - (f / fMax) * chartH;

    const fk     = params.mu_k * F_N;

    // Background regions: STATIC from 0 to fs_max, KINETIC from fs_max to fMax
    ctx.fillStyle = '#f0fdf4';
    ctx.fillRect(mapFx(0), padT, mapFx(fs_max) - mapFx(0), chartH);
    ctx.fillStyle = '#fff7ed';
    ctx.fillRect(mapFx(fs_max), padT, padL + chartW - mapFx(fs_max), chartH);

    // Region labels
    ctx.font = 'bold 10px "Inter", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#16a34a';
    ctx.fillText('STATIC', mapFx(fs_max / 2), padT + 5);
    ctx.fillStyle = '#ea580c';
    ctx.fillText('KINETIC', mapFx((fs_max + fMax) / 2), padT + 5);

    // Border
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5;
    ctx.strokeRect(padL, padT, chartW, chartH);

    // Tick labels
    const ticks = [0, 10, 20, 30, 40, 50];
    for (const v of ticks) {
      drawMixedText(ctx, mapFx(v), padT + chartH + 12,
        [{ text: v.toString() }], { fontSize: 11, color: '#64748b', align: 'center' });
      drawMixedText(ctx, padL - 6, mapFy(v),
        [{ text: v.toString() }], { fontSize: 11, color: '#64748b', align: 'right' });
    }

    // X-axis title:  F_app (N)
    drawMixedText(
      ctx, padL + chartW / 2, h - 6,
      [{ text: 'F', italic: true }, { text: 'app', subscript: true }, { text: '  (N)' }],
      { fontSize: 12, color: '#334155', align: 'center', baseline: 'bottom' }
    );

    // Y-axis title:  f  (N)  — rotated
    ctx.save();
    ctx.translate(12, padT + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    drawMixedText(ctx, 0, 0,
      [{ text: 'f', italic: true }, { text: '  (N)' }],
      { fontSize: 12, color: '#334155', align: 'center' });
    ctx.restore();

    // Theoretical curve (positive magnitudes only!)
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mapFx(0), mapFy(0));
    ctx.lineTo(mapFx(fs_max), mapFy(fs_max));
    ctx.lineTo(mapFx(fs_max), mapFy(fk));
    ctx.lineTo(mapFx(fMax), mapFy(fk));
    ctx.stroke();

    // Current point
    ctx.fillStyle = resolveColor('var(--color-friction)');
    ctx.beginPath();
    ctx.arc(mapFx(params.F_app), mapFy(-state.f_friction), 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();

  }, [state.f_friction, params, fontsReady]);

  return (
    <SimulationLayout
      title="Friction vs Applied Force"
      description="1D Dynamics — Static and kinetic friction regimes."

      actionsContent={
        <>
          <button onClick={toggle}>{isRunning ? 'Pause' : 'Play'}</button>
          <button className="secondary" onClick={reset}>Reset</button>
        </>
      }

      canvasContent={
        <>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '14px', fontSize: '13px', background: '#f8fafc', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: 'var(--color-force-app)', fontWeight: 600 }}>→ <InlineMath math="\vec{F}_{\text{app}}" /></span>
            <span style={{ color: 'var(--color-friction)',  fontWeight: 600 }}>→ <InlineMath math="\vec{f}" /></span>
            <span style={{ color: 'var(--color-normal)',    fontWeight: 600 }}>→ <InlineMath math="\vec{F}_N" /></span>
            <span style={{ color: 'var(--color-gravity)',   fontWeight: 600 }}>→ <InlineMath math="\vec{F}_g" /></span>
            <span style={{ color: 'var(--color-vel)',       fontWeight: 600 }}>→ <InlineMath math="\vec{v}" /></span>
            <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: '12px', padding: '3px 12px', borderRadius: 99,
              background: isStatic ? '#dcfce7' : '#fef3c7',
              color:      isStatic ? '#166534' : '#92400e' }}>
              {isStatic ? 'STATIC' : 'KINETIC'}
            </span>
          </div>
          <div style={{ width: '100%', height: '390px' }}>
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', background: '#fff' }}>
            <div style={{ padding: '6px 16px 0', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
              Friction <InlineMath math="f" /> vs Applied Force <InlineMath math="F_{\text{app}}" />
            </div>
            <div style={{ width: '100%', height: '220px' }}>
              <canvas ref={plotRef} style={{ display: 'block', width: '100%', height: '100%' }} />
            </div>
          </div>
        </>
      }

      theoryContent={
        <div style={{ padding: '16px', fontSize: '15px', lineHeight: '1.6' }}>
          <p>
            When a pushing force <InlineMath math="F_{\text{app}}" /> is applied to a stationary object, <strong>static friction</strong> (<InlineMath math="f_s" />) pushes back with an equal and opposite force to keep the object at rest.
          </p>
          <BlockMath math="f_s \le \mu_s F_N" />
          <p>
            The object only accelerates once the applied force exceeds the maximum static friction threshold. Once moving, the opposing force drops to a constant <strong>kinetic friction</strong> (<InlineMath math="f_k" />).
          </p>
          <BlockMath math="f_k = \mu_k F_N" />
          <p>
            <strong>Interactive:</strong> Gradually increase the Applied Force slider. Watch static friction grow to match it until "break-away" — notice the drop on the graph and the badge switch above.
          </p>
        </div>
      }

      controlsContent={
        <>
          <ControlRow label={<><InlineMath math="m" /> (kg)</>}                     name="mass"  min="1"  max="20" step="0.1"  value={params.mass} onChange={handleChange} />
          <ControlRow label={<>Static <InlineMath math="\mu_s" /></>}               name="mu_s"  min="0"  max="1"  step="0.01" value={params.mu_s} onChange={handleChange} />
          <ControlRow label={<>Kinetic <InlineMath math="\mu_k" /></>}              name="mu_k"  min="0"  max="1"  step="0.01" value={params.mu_k} onChange={handleChange} />
          <ControlRow label={<><InlineMath math="F_{\text{app}}" /> (N)</>}         name="F_app" min="0" max="50" step="0.5" value={params.F_app} onChange={handleChange} />
        </>
      }

      metricsContent={
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            <span className="text-muted">Normal force <InlineMath math="F_N" /></span>
            <span style={{ fontWeight: 600 }}>{F_N.toFixed(1)} N</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            <span className="text-muted">Max static <InlineMath math="\mu_s F_N" /></span>
            <span style={{ fontWeight: 600 }}>{fs_max.toFixed(1)} N</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            <span className="text-muted">Net force <InlineMath math="F_{\text{net}}" /></span>
            <span style={{ fontWeight: 600 }}>{(params.F_app + state.f_friction).toFixed(2)} N</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            <span className="text-muted">Acceleration <InlineMath math="a" /></span>
            <span style={{ fontWeight: 600, color: 'var(--color-accel)' }}>{state.a.toFixed(2)} m/s²</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            <span className="text-muted">Velocity <InlineMath math="v" /></span>
            <span style={{ fontWeight: 600, color: 'var(--color-vel)' }}>{state.v.toFixed(2)} m/s</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="text-muted">Friction <InlineMath math="f" /></span>
            <span style={{ fontWeight: 600, color: 'var(--color-friction)' }}>{Math.abs(state.f_friction).toFixed(2)} N</span>
          </div>
        </>
      }
    />
  );
}

const ControlRow = ({ label, name, min, max, step, value, onChange }: {
  label: React.ReactNode;
  name: string;
  min: string;
  max: string;
  step: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 70px', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
    <label style={{ fontSize: '13px', fontWeight: 500 }}>{label}</label>
    <input type="range" name={name} min={min} max={max} step={step}
      value={value} onChange={onChange} />
    <input type="number" name={name} value={value}
      onChange={onChange} style={{ fontSize: '13px', padding: '4px 6px' }} />
  </div>
);
