import React, { useState, useRef, useEffect, useCallback } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import { usePhysicsEngine } from '../../hooks/usePhysicsEngine';
import { drawArrow, scaleCanvas, drawMixedText } from '../../components/physics/drawUtils';
import { SimulationLayout } from '../../components/layout/SimulationLayout';

const g = 9.8;

export default function FrictionAppliedForce() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const plotRef   = useRef<HTMLCanvasElement>(null);

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
      if (x_new > 10) x_new = -10;
      if (x_new < -10) x_new = 10;
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
    const ctx = scaleCanvas(canvas, canvas.parentElement!.clientWidth, 300);
    const w = canvas.parentElement!.clientWidth;
    const h = 300;

    ctx.clearRect(0, 0, w, h);
    const floorY = h - 50;

    // Floor with hatch marks
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, floorY, w, 50);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, floorY); ctx.lineTo(w, floorY); ctx.stroke();
    ctx.strokeStyle = '#b8c4d0';
    ctx.lineWidth = 1;
    for (let hx = -50; hx < w + 50; hx += 20) {
      ctx.beginPath(); ctx.moveTo(hx, floorY); ctx.lineTo(hx + 30, floorY + 30); ctx.stroke();
    }

    const scale = 20;
    const cx = w / 2 + state.x * scale;
    const cy = floorY;
    const bw = 80, bh = 60;

    // Block shadow + body
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(cx - bw / 2 + 4, cy - bh + 4, bw, bh);
    ctx.fillStyle = '#f0f9ff';
    ctx.fillRect(cx - bw / 2, cy - bh, bw, bh);
    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2;
    ctx.strokeRect(cx - bw / 2, cy - bh, bw, bh);

    // Mass label
    drawMixedText(ctx, cx, cy - bh / 2,
      [{ text: params.mass.toFixed(1) }, { text: ' kg' }],
      { fontSize: 13, color: '#334155', align: 'center' });

    const vecScale = 4;

    // Applied force
    if (Math.abs(params.F_app) > 0.1) {
      const tip = drawArrow(ctx, cx, cy - bh / 2,
        params.F_app * vecScale,
        params.F_app > 0 ? Math.PI : 0,
        'var(--color-force-app)', 4);
      drawMixedText(ctx, tip.hx + (params.F_app > 0 ? -6 : 6), cy - bh / 2,
        [{ text: 'F', italic: true }, { text: 'app', italic: false }],
        { fontSize: 12, color: 'var(--color-force-app)',
          align: params.F_app > 0 ? 'right' : 'left' });
    }

    // Friction
    if (Math.abs(state.f_friction) > 0.1) {
      const ftip = drawArrow(ctx, cx, cy - 10,
        state.f_friction * vecScale,
        state.f_friction > 0 ? 0 : Math.PI,
        'var(--color-friction)', 4);
      drawMixedText(ctx, ftip.hx + (state.f_friction > 0 ? 6 : -6), cy - 10,
        [{ text: 'f', italic: true }],
        { fontSize: 12, color: 'var(--color-friction)',
          align: state.f_friction > 0 ? 'left' : 'right' });
    }

    // Velocity
    if (Math.abs(state.v) > 0.1) {
      const vtip = drawArrow(ctx, cx, cy - bh - 18,
        state.v * 10,
        state.v > 0 ? 0 : Math.PI,
        'var(--color-vel)', 3);
      drawMixedText(ctx, vtip.hx + (state.v > 0 ? 6 : -6), cy - bh - 18,
        [{ text: 'v', italic: true }],
        { fontSize: 12, color: 'var(--color-vel)',
          align: state.v > 0 ? 'left' : 'right' });
    }
  }, [state, params]);

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
    const mapFx = (f: number) => padL + (f + fMax) / (2 * fMax) * chartW;
    const mapFy = (f: number) => padT + chartH / 2 - (f / fMax) * (chartH / 2);

    const fk     = params.mu_k * F_N;

    // Background regions
    ctx.fillStyle = '#f0fdf4';
    ctx.fillRect(mapFx(-fs_max), padT, mapFx(fs_max) - mapFx(-fs_max), chartH);
    ctx.fillStyle = '#fff7ed';
    ctx.fillRect(padL, padT, mapFx(-fs_max) - padL, chartH);
    ctx.fillRect(mapFx(fs_max), padT, padL + chartW - mapFx(fs_max), chartH);

    // Region labels
    ctx.font = 'bold 10px "Inter", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#16a34a';
    ctx.fillText('STATIC', mapFx(0), padT + 5);
    ctx.fillStyle = '#ea580c';
    ctx.fillText('KINETIC', mapFx(-fMax * 0.6), padT + 5);
    ctx.fillText('KINETIC', mapFx(fMax * 0.6), padT + 5);

    // Centre grid lines
    ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(mapFx(0), padT); ctx.lineTo(mapFx(0), padT + chartH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(padL, mapFy(0)); ctx.lineTo(padL + chartW, mapFy(0)); ctx.stroke();

    // Border
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5;
    ctx.strokeRect(padL, padT, chartW, chartH);

    // Tick labels
    const ticks = [-40, -20, 0, 20, 40];
    for (const v of ticks) {
      drawMixedText(ctx, mapFx(v), padT + chartH + 12,
        [{ text: v.toString() }], { fontSize: 11, color: '#64748b', align: 'center' });
      drawMixedText(ctx, padL - 6, mapFy(v),
        [{ text: v.toString() }], { fontSize: 11, color: '#64748b', align: 'right' });
    }

    // X-axis title:  F_app (N)
    drawMixedText(
      ctx, padL + chartW / 2, h - 6,
      [{ text: 'F', italic: true }, { text: 'app' }, { text: '  (N)' }],
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

    // Theoretical curve
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mapFx(-fMax),    mapFy(fk));
    ctx.lineTo(mapFx(-fs_max),  mapFy(fk));
    ctx.lineTo(mapFx(-fs_max),  mapFy(-fs_max));
    ctx.lineTo(mapFx( fs_max),  mapFy( fs_max));
    ctx.lineTo(mapFx( fs_max),  mapFy(-fk));
    ctx.lineTo(mapFx( fMax),    mapFy(-fk));
    ctx.stroke();

    // Current point
    ctx.fillStyle = 'var(--color-friction)';
    ctx.beginPath();
    ctx.arc(mapFx(params.F_app), mapFy(-state.f_friction), 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();

  }, [state.f_friction, params]);

  const ControlRow = ({ label, name, min, max, step }: any) => (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 70px', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
      <label style={{ fontSize: '13px', fontWeight: 500 }}>{label}</label>
      <input type="range" name={name} min={min} max={max} step={step}
        value={params[name as keyof typeof params]} onChange={handleChange} />
      <input type="number" name={name} value={params[name as keyof typeof params]}
        onChange={handleChange} style={{ fontSize: '13px', padding: '4px 6px' }} />
    </div>
  );

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
            <span style={{ color: 'var(--color-force-app)', fontWeight: 600 }}>→ Applied <InlineMath math="F_{\text{app}}" /></span>
            <span style={{ color: 'var(--color-friction)',  fontWeight: 600 }}>→ Friction <InlineMath math="f" /></span>
            <span style={{ color: 'var(--color-vel)',       fontWeight: 600 }}>→ Velocity <InlineMath math="v" /></span>
            <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: '12px', padding: '3px 12px', borderRadius: 99,
              background: isStatic ? '#dcfce7' : '#fef3c7',
              color:      isStatic ? '#166534' : '#92400e' }}>
              {isStatic ? 'STATIC' : 'KINETIC'}
            </span>
          </div>
          <div style={{ width: '100%', height: '300px' }}>
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
          <ControlRow label={<><InlineMath math="m" /> (kg)</>}                     name="mass"  min="1"  max="20" step="0.1"  />
          <ControlRow label={<>Static <InlineMath math="\mu_s" /></>}               name="mu_s"  min="0"  max="1"  step="0.01" />
          <ControlRow label={<>Kinetic <InlineMath math="\mu_k" /></>}              name="mu_k"  min="0"  max="1"  step="0.01" />
          <ControlRow label={<><InlineMath math="F_{\text{app}}" /> (N)</>}         name="F_app" min="-50" max="50" step="0.5" />
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
