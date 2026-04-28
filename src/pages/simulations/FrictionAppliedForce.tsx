import React, { useState, useRef, useEffect, useCallback } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import { usePhysicsEngine } from '../../hooks/usePhysicsEngine';
import { drawArrow, scaleCanvas } from '../../components/physics/drawUtils';
import { SimulationLayout } from '../../components/layout/SimulationLayout';

const g = 9.8; // m/s^2

export default function FrictionAppliedForce() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const plotRef = useRef<HTMLCanvasElement>(null);
  
  const [params, setParams] = useState({
    mass: 5.0,
    mu_s: 0.6,
    mu_k: 0.4,
    F_app: 10.0
  });

  const [state, setState] = useState({
    x: 0,
    v: 0,
    a: 0,
    f_friction: 0
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseFloat(e.target.value);
    
    // Constraints
    if (e.target.name === 'mu_k' && value > params.mu_s) {
      value = params.mu_s; // kinetic cannot exceed static
    }
    if (e.target.name === 'mu_s' && value < params.mu_k) {
      value = params.mu_k; // static cannot be less than kinetic
    }

    setParams(prev => ({ ...prev, [e.target.name]: value }));
  };

  const physicsStep = useCallback((dt: number) => {
    setState(prev => {
      const F_N = params.mass * g;
      const fs_max = params.mu_s * F_N;
      const fk = params.mu_k * F_N;
      
      let a = 0;
      let f_friction = 0;

      // At rest (or effectively at rest)
      if (Math.abs(prev.v) < 0.05) {
        if (Math.abs(params.F_app) <= fs_max) {
          // Static regime
          f_friction = -params.F_app;
          a = 0;
        } else {
          // Breakaway
          f_friction = -Math.sign(params.F_app) * fk;
          a = (params.F_app + f_friction) / params.mass;
        }
      } else {
        // Kinetic regime
        f_friction = -Math.sign(prev.v) * fk;
        a = (params.F_app + f_friction) / params.mass;
      }

      let v_new = prev.v + a * dt;
      let x_new = prev.x + prev.v * dt + 0.5 * a * dt * dt;

      // Snapping to rest if we cross v=0 while F_app is within static bounds
      if (prev.v * v_new < 0 && Math.abs(params.F_app) <= fs_max) {
        v_new = 0;
        a = 0;
        f_friction = -params.F_app;
      }

      // Bound world
      if (x_new > 10) x_new = -10;
      if (x_new < -10) x_new = 10;

      return { x: x_new, v: v_new, a, f_friction };
    });
  }, [params]);

  const { isRunning, toggle, reset } = usePhysicsEngine({
    onStep: physicsStep,
    onReset: () => setState({ x: 0, v: 0, a: 0, f_friction: 0 })
  });

  // Re-calculate static friction if params change while paused
  useEffect(() => {
    if (!isRunning) {
      physicsStep(0);
    }
  }, [params, isRunning, physicsStep]);

  // Main Scene Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = scaleCanvas(canvas, canvas.parentElement!.clientWidth, 300);
    const w = canvas.parentElement!.clientWidth;
    const h = 300;

    ctx.clearRect(0, 0, w, h);

    // Floor
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, h - 50, w, 50);
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath(); ctx.moveTo(0, h - 50); ctx.lineTo(w, h - 50); ctx.stroke();

    const scale = 20; // px per meter
    const cx = w / 2 + state.x * scale;
    const cy = h - 50; // floor level

    // Draw Block
    const bw = 80;
    const bh = 60;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(cx - bw/2, cy - bh, bw, bh);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - bw/2, cy - bh, bw, bh);

    // Vectors
    const vecScale = 4;
    // F_app
    if (Math.abs(params.F_app) > 0.1) {
      drawArrow(ctx, cx, cy - bh/2, params.F_app * vecScale, params.F_app > 0 ? 0 : Math.PI, 'var(--color-force-app)', 4);
    }
    // Friction
    if (Math.abs(state.f_friction) > 0.1) {
      drawArrow(ctx, cx, cy, state.f_friction * vecScale, state.f_friction > 0 ? 0 : Math.PI, 'var(--color-friction)', 4);
    }
    
    // Velocity vector above block
    if (Math.abs(state.v) > 0.1) {
      drawArrow(ctx, cx, cy - bh - 20, state.v * 10, state.v > 0 ? 0 : Math.PI, 'var(--color-vel)', 3);
    }

  }, [state, params]);

  // Mini Plot Render
  useEffect(() => {
    const canvas = plotRef.current;
    if (!canvas) return;
    const ctx = scaleCanvas(canvas, canvas.parentElement!.clientWidth, 200);
    const w = canvas.parentElement!.clientWidth;
    const h = 200;

    ctx.clearRect(0, 0, w, h);

    const pad = 20;
    const fMaxScale = 50; // max force domain
    
    const mapX = (f: number) => pad + (f + fMaxScale) / (2 * fMaxScale) * (w - 2 * pad);
    const mapY = (f: number) => h / 2 - (f / fMaxScale) * (h / 2 - pad);

    // Axes
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(mapX(0), 0); ctx.lineTo(mapX(0), h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke();

    const F_N = params.mass * g;
    const fs_max = params.mu_s * F_N;
    const fk = params.mu_k * F_N;

    // Plot Theoretical curve
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mapX(-fMaxScale), mapY(fk));
    ctx.lineTo(mapX(-fs_max), mapY(fk));
    ctx.lineTo(mapX(-fs_max), mapY(-fs_max));
    ctx.lineTo(mapX(fs_max), mapY(fs_max));
    ctx.lineTo(mapX(fs_max), mapY(-fk));
    ctx.lineTo(mapX(fMaxScale), mapY(-fk));
    ctx.stroke();

    // Plot Current Point
    ctx.fillStyle = 'var(--color-friction)';
    ctx.beginPath();
    ctx.arc(mapX(params.F_app), mapY(-state.f_friction), 5, 0, Math.PI*2);
    ctx.fill();

  }, [state.f_friction, params]);

  const ControlRow = ({ label, name, min, max, step }: any) => (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 70px', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
      <label style={{ fontSize: '13px', fontWeight: 500 }}>{label}</label>
      <input type="range" name={name} min={min} max={max} step={step} value={params[name as keyof typeof params]} onChange={handleChange} />
      <input type="number" name={name} value={params[name as keyof typeof params]} onChange={handleChange} style={{ fontSize: '13px', padding: '6px' }} />
    </div>
  );

  return (
    <SimulationLayout
      title="Friction vs Applied Force"
      description="1D Dynamics - Static and Kinetic friction regimes."
      
      actionsContent={
        <>
          <button onClick={toggle}>{isRunning ? 'Pause' : 'Play'}</button>
          <button className="secondary" onClick={reset}>Reset</button>
        </>
      }

      canvasContent={
        <>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', fontSize: '14px', background: '#f8fafc' }}>
            <span style={{ color: 'var(--color-force-app)', fontWeight: 600 }}>→ Applied Force <InlineMath math="F_{\text{app}}" /></span>
            <span style={{ color: 'var(--color-friction)', fontWeight: 600 }}>→ Friction <InlineMath math="f" /></span>
            <span style={{ color: 'var(--color-vel)', fontWeight: 600 }}>→ Velocity <InlineMath math="v" /></span>
          </div>
          <div style={{ width: '100%', height: '300px', flex: 1 }}>
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }}></canvas>
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', backgroundColor: '#fff' }}>
            <h2 style={{ fontSize: '14px', margin: '8px 16px' }}>Friction (<InlineMath math="f" />) vs Applied Force (<InlineMath math="F_{\text{app}}" />)</h2>
            <div style={{ width: '100%', height: '200px' }}>
              <canvas ref={plotRef} style={{ display: 'block', width: '100%', height: '100%' }}></canvas>
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
            <strong>Interactive:</strong> Gradually increase the Applied Force slider. Watch the static friction vector grow to match it, until you "break away" and slip into the kinetic friction regime. Notice the drop in friction force on the graph.
          </p>
        </div>
      }

      controlsContent={
        <>
          <ControlRow label={<><InlineMath math="m" /> (kg)</>} name="mass" min="1" max="20" step="0.1" />
          <ControlRow label={<>Static <InlineMath math="\mu_s" /></>} name="mu_s" min="0" max="1" step="0.01" />
          <ControlRow label={<>Kinetic <InlineMath math="\mu_k" /></>} name="mu_k" min="0" max="1" step="0.01" />
          <ControlRow label={<>App Force <InlineMath math="F_{\text{app}}" /> (N)</>} name="F_app" min="-50" max="50" step="0.5" />
        </>
      }

      metricsContent={
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            <span className="text-muted">Net Force <InlineMath math="F_{\text{net}}" /></span>
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
