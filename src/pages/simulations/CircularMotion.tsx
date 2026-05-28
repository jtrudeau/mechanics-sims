import React, { useState, useRef, useEffect, useCallback } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import { usePhysicsEngine } from '../../hooks/usePhysicsEngine';
import { drawArrow, scaleCanvas, drawMixedText, drawCoordinateGrid, resolveColor } from '../../components/physics/drawUtils';
import { SimulationLayout } from '../../components/layout/SimulationLayout';

const MAX_OMEGA = 12;

export default function CircularMotion() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const trailRef   = useRef<{ x: number; y: number }[]>([]);

  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => setFontsReady(true));
    }
  }, []);

  const [params, setParams] = useState({ R: 5.0, w0: 1.0, alpha: 0.5 });
  const [state,  setState]  = useState({ theta: 0, w: 1.0 });

  useEffect(() => {
    setState(prev => ({ ...prev, w: params.w0 }));
    trailRef.current = [];
  }, [params.w0]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParams({ ...params, [e.target.name]: parseFloat(e.target.value) });
    trailRef.current = [];
  };

  const physicsStep = useCallback((dt: number) => {
    setState(prev => {
      let w_new     = Math.max(-MAX_OMEGA, Math.min(MAX_OMEGA, prev.w + params.alpha * dt));
      let theta_new = prev.theta + prev.w * dt;
      if (theta_new >  Math.PI * 2) theta_new -= Math.PI * 2;
      if (theta_new <  0)           theta_new += Math.PI * 2;
      return { theta: theta_new, w: w_new };
    });
  }, [params.alpha]);

  const { isRunning, toggle, reset } = usePhysicsEngine({
    onStep: physicsStep,
    onReset: () => { setState({ theta: 0, w: params.w0 }); trailRef.current = []; }
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx   = scaleCanvas(canvas, canvas.parentElement!.clientWidth, 420);
    const width = canvas.parentElement!.clientWidth;
    const height = 420;

    // Draw textbook grid paper background first
    drawCoordinateGrid(ctx, width, height, {
      backgroundColor: '#fcfdfd',
      gridColor: '#e2e8f0',
      subdivisionColor: '#f8fafc'
    });

    const cx    = width / 2;
    const cy    = height / 2;
    const scale = Math.min(18, (Math.min(width, height) / 2 - 44) / params.R);

    const objX = cx + params.R * scale * Math.cos(state.theta);
    const objY = cy - params.R * scale * Math.sin(state.theta);

    // Trail
    const TRAIL_LEN = 90;
    trailRef.current.push({ x: objX, y: objY });
    if (trailRef.current.length > TRAIL_LEN) trailRef.current.shift();
    const trail = trailRef.current;
    for (let i = 1; i < trail.length; i++) {
      const a = i / trail.length;
      ctx.strokeStyle = `rgba(148,163,184,${a * 0.4})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
      ctx.lineTo(trail[i].x,     trail[i].y);
      ctx.stroke();
    }

    // Orbit path
    ctx.strokeStyle = '#cbd5e1';
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, params.R * scale, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);

    // Radius line
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(objX, objY);
    ctx.stroke();

    // R label — midpoint, offset perpendicular to radius
    const midX  = (cx + objX) / 2;
    const midY  = (cy + objY) / 2;
    const perpX = -(objY - cy) / (params.R * scale + 1e-9);
    const perpY =  (objX - cx) / (params.R * scale + 1e-9);
    drawMixedText(ctx, midX + perpX * 22, midY + perpY * 22,
      [{ text: 'R', italic: true }],
      { fontSize: 16, color: '#64748b', align: 'center' });

    // θ arc from +x axis to current position
    if (Math.abs(state.theta) > 0.08) {
      const arcR = params.R * scale * 0.28;
      ctx.strokeStyle = resolveColor('var(--color-gravity)');
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, arcR, 0, -state.theta, state.w < 0);
      ctx.stroke();
      // θ label
      const midAngle = -state.theta / 2;
      drawMixedText(
        ctx,
        cx + (arcR + 18) * Math.cos(midAngle),
        cy + (arcR + 18) * Math.sin(midAngle),
        [{ text: 'θ', italic: true }],
        { fontSize: 16, color: 'var(--color-gravity)', align: 'center' }
      );
    }

    // Centre dot
    ctx.fillStyle = '#64748b';
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 2 * Math.PI); ctx.fill();

    // Object
    ctx.fillStyle = '#334155';
    ctx.beginPath(); ctx.arc(objX, objY, 10, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

    // Vectors
    const v_mag  = params.R * state.w;
    const ar_mag = params.R * state.w * state.w;
    const at_mag = params.R * params.alpha;
    
    // Standardized scientific vector scaling
    const velScale   = 2.2;
    const accelScale = 0.85; // Standardized scale for ALL acceleration components!
    
    const screenTheta = -state.theta;
    const radialPerpX = Math.sin(screenTheta);
    const radialPerpY = -Math.cos(screenTheta);

    // 1. Velocity Vector
    if (Math.abs(v_mag) > 0.1) {
      const dir = screenTheta - Math.sign(state.w) * Math.PI / 2;
      const tip = drawArrow(ctx, objX, objY, Math.abs(v_mag) * velScale, dir, 'var(--color-vel)', 4.5);
      // Offset radially outward from the vector's tip to completely prevent collisions
      drawMixedText(ctx, tip.hx + 16 * Math.cos(screenTheta), tip.hy + 16 * Math.sin(screenTheta),
        [{ text: 'v', italic: true, vector: true }],
        { fontSize: 16, color: 'var(--color-vel)', align: 'center', baseline: 'middle' });
    }

    // Directions
    const dir_ar = screenTheta + Math.PI; // towards center
    const at_dir = screenTheta - Math.sign(params.alpha) * Math.PI / 2; // tangent

    // 2. Radial (Centripetal) Acceleration Vector
    if (ar_mag > 0.1) {
      const tip = drawArrow(ctx, objX, objY, ar_mag * accelScale, dir_ar, 'var(--color-accel-radial)', 4.5);
      // Offset inward toward center, shifted slightly perpendicular to the radial axis to avoid overlapping lines
      drawMixedText(ctx, tip.hx + 12 * Math.cos(dir_ar) + 14 * radialPerpX, tip.hy + 12 * Math.sin(dir_ar) + 14 * radialPerpY,
        [{ text: 'a', italic: true, vector: true }, { text: 'r', italic: true, subscript: true }],
        { fontSize: 15, color: 'var(--color-accel-radial)', align: 'center', baseline: 'middle' });
    }

    // 3. Tangential Acceleration Vector
    if (Math.abs(at_mag) > 0.1) {
      const tip = drawArrow(ctx, objX, objY, Math.abs(at_mag) * accelScale, at_dir, 'var(--color-accel-tangential)', 4.5);
      // Offset radially outward and slightly tangent-forward to completely avoid v vector overlap
      drawMixedText(ctx, tip.hx + 16 * Math.cos(screenTheta) + 10 * Math.cos(at_dir), tip.hy + 16 * Math.sin(screenTheta) + 10 * Math.sin(at_dir),
        [{ text: 'a', italic: true, vector: true }, { text: 't', italic: true, subscript: true }],
        { fontSize: 15, color: 'var(--color-accel-tangential)', align: 'center', baseline: 'middle' });
    }

    // Total acceleration components math & drawing
    const ar_x = ar_mag * Math.cos(dir_ar);
    const ar_y = ar_mag * Math.sin(dir_ar);
    const at_x  = Math.abs(at_mag) * Math.cos(at_dir);
    const at_y  = Math.abs(at_mag) * Math.sin(at_dir);
    const a_tot_x   = ar_x + at_x;
    const a_tot_y   = ar_y + at_y;
    const a_tot_mag = Math.sqrt(a_tot_x * a_tot_x + a_tot_y * a_tot_y);
    const a_tot_dir = Math.atan2(a_tot_y, a_tot_x);

    // 4. Dashed component guidelines (Forms the classic vector addition rectangle)
    if (ar_mag > 0.1 && Math.abs(at_mag) > 0.1) {
      const tipAr = {
        x: objX + ar_mag * accelScale * Math.cos(dir_ar),
        y: objY + ar_mag * accelScale * Math.sin(dir_ar)
      };
      const tipAt = {
        x: objX + Math.abs(at_mag) * accelScale * Math.cos(at_dir),
        y: objY + Math.abs(at_mag) * accelScale * Math.sin(at_dir)
      };
      const tipTotal = {
        x: objX + a_tot_mag * accelScale * Math.cos(a_tot_dir),
        y: objY + a_tot_mag * accelScale * Math.sin(a_tot_dir)
      };

      ctx.save();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(tipAr.x, tipAr.y);
      ctx.lineTo(tipTotal.x, tipTotal.y);
      ctx.lineTo(tipAt.x, tipAt.y);
      ctx.stroke();
      ctx.restore();
    }

    // 5. Total Acceleration Vector (draw only if it deviates from pure radial or has components)
    if (a_tot_mag > 0.1 && Math.abs(at_mag) > 0.1) {
      const tip = drawArrow(ctx, objX, objY, a_tot_mag * accelScale, a_tot_dir, 'var(--color-accel)', 4.5);
      drawMixedText(ctx, tip.hx + 16 * Math.cos(a_tot_dir), tip.hy + 16 * Math.sin(a_tot_dir),
        [{ text: 'a', italic: true, vector: true }],
        { fontSize: 16, color: 'var(--color-accel)', align: 'center', baseline: 'middle' });
    }

    // ω cap warning
    if (Math.abs(state.w) >= MAX_OMEGA - 0.05) {
      ctx.fillStyle   = 'rgba(220,38,38,0.9)';
      ctx.font        = 'bold 12px "Inter", system-ui, sans-serif';
      ctx.textAlign   = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('ω capped at ±12 rad/s', cx, 12);
    }

  }, [state, params, fontsReady]);



  const at     = params.R * params.alpha;
  const ar     = params.R * state.w * state.w;
  const a_tot  = Math.sqrt(at * at + ar * ar);
  const v      = params.R * state.w;
  const period = Math.abs(state.w) > 0.01 ? 2 * Math.PI / Math.abs(state.w) : Infinity;

  return (
    <SimulationLayout
      title="Uniform vs Non-Uniform Circular Motion"
      description="2D Dynamics — Radial and tangential acceleration components."

      actionsContent={
        <>
          <button onClick={toggle}>{isRunning ? 'Pause' : 'Play'}</button>
          <button className="secondary" onClick={reset}>Reset</button>
        </>
      }

      canvasContent={
        <>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px', fontSize: '13px', background: '#f8fafc', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: 'var(--color-vel)',              fontWeight: 600 }}>→ <InlineMath math="\vec{v}" /></span>
            <span style={{ color: 'var(--color-accel-radial)',    fontWeight: 600 }}>→ <InlineMath math="\vec{a}_r" /></span>
            <span style={{ color: 'var(--color-accel-tangential)', fontWeight: 600 }}>→ <InlineMath math="\vec{a}_t" /></span>
            <span style={{ color: 'var(--color-accel)',           fontWeight: 600 }}>→ <InlineMath math="\vec{a}" /></span>
            <span style={{ color: '#64748b',                      fontWeight: 600 }}>— trail</span>
          </div>
          <div style={{ width: '100%', height: '420px' }}>
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
          </div>
        </>
      }

      theoryContent={
        <div style={{ padding: '16px', fontSize: '15px', lineHeight: '1.6' }}>
          <p>
            An object moving in a circle always has <strong>radial (centripetal) acceleration</strong> <InlineMath math="\vec{a}_r" /> pointing toward the center, which changes the <em>direction</em> of the velocity vector:
          </p>
          <BlockMath math="a_r = \frac{v^2}{R} = \omega^2 R" />
          <p>
            If the object is also speeding up or slowing down, it has <strong>tangential acceleration</strong> <InlineMath math="\vec{a}_t" />, which changes the <em>magnitude</em> of the velocity vector:
          </p>
          <BlockMath math="a_t = \alpha R" />
          <p>
            <strong>Interactive:</strong> Set <InlineMath math="\alpha = 0" /> for uniform circular motion (pure centripetal). Set <InlineMath math="\alpha \neq 0" /> and watch the total <InlineMath math="\vec{a}" /> rotate away from the center. The fading trail shows the object's recent path.
          </p>
        </div>
      }

      controlsContent={
        <>
          <ControlRow label={<>Radius <InlineMath math="R" /> (m)</>}            name="R"     min="1"  max="10" step="0.5" value={params.R} onChange={handleChange} />
          <ControlRow label={<>Initial <InlineMath math="\omega_0" /> (rad/s)</>} name="w0"    min="-8" max="8"  step="0.1" value={params.w0} onChange={handleChange} />
          <ControlRow label={<>Ang accel <InlineMath math="\alpha" /> (rad/s²)</>} name="alpha" min="-2" max="2"  step="0.1" value={params.alpha} onChange={handleChange} />
        </>
      }

      metricsContent={
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            <span className="text-muted">Angular vel <InlineMath math="\omega" /></span>
            <span style={{ fontWeight: 600 }}>{state.w.toFixed(2)} rad/s</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            <span className="text-muted">Tangential vel <InlineMath math="v" /></span>
            <span style={{ fontWeight: 600, color: 'var(--color-vel)' }}>{Math.abs(v).toFixed(2)} m/s</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            <span className="text-muted">Period <InlineMath math="T" /></span>
            <span style={{ fontWeight: 600 }}>{isFinite(period) ? period.toFixed(2) + ' s' : '∞'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            <span className="text-muted">Radial accel <InlineMath math="a_r" /></span>
            <span style={{ fontWeight: 600, color: 'var(--color-accel-radial)' }}>{ar.toFixed(2)} m/s²</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            <span className="text-muted">Tangential accel <InlineMath math="a_t" /></span>
            <span style={{ fontWeight: 600, color: 'var(--color-accel-tangential)' }}>{Math.abs(at).toFixed(2)} m/s²</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="text-muted">Total accel <InlineMath math="|\vec{a}|" /></span>
            <span style={{ fontWeight: 600, color: 'var(--color-accel)' }}>{a_tot.toFixed(2)} m/s²</span>
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
  <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 70px', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
    <label style={{ fontSize: '13px', fontWeight: 500 }}>{label}</label>
    <input type="range" name={name} min={min} max={max} step={step}
      value={value} onChange={onChange} />
    <input type="number" name={name} value={value}
      onChange={onChange} style={{ fontSize: '13px', padding: '4px 6px' }} />
  </div>
);
