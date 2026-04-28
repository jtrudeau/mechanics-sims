import React, { useState, useRef, useEffect, useCallback } from 'react';
import { InlineMath } from 'react-katex';
import { usePhysicsEngine } from '../../hooks/usePhysicsEngine';
import { drawArrow, scaleCanvas } from '../../components/physics/drawUtils';

export default function CircularMotion() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [params, setParams] = useState({
    R: 5.0,     // m
    w0: 1.0,    // rad/s
    alpha: 0.5  // rad/s^2
  });

  const [state, setState] = useState({
    theta: 0,
    w: 1.0
  });

  // Keep track of w for resetting
  useEffect(() => {
    setState(prev => ({ ...prev, w: params.w0 }));
  }, [params.w0]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParams({ ...params, [e.target.name]: parseFloat(e.target.value) });
  };

  const physicsStep = useCallback((dt: number) => {
    setState(prev => {
      let w_new = prev.w + params.alpha * dt;
      let theta_new = prev.theta + prev.w * dt;
      // Keep theta in 0 to 2PI for sanity, though not strictly needed for sin/cos
      if (theta_new > Math.PI * 2) theta_new -= Math.PI * 2;
      if (theta_new < 0) theta_new += Math.PI * 2;
      return { theta: theta_new, w: w_new };
    });
  }, [params.alpha]);

  const { isRunning, toggle, reset } = usePhysicsEngine({
    onStep: physicsStep,
    onReset: () => setState({ theta: 0, w: params.w0 })
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = scaleCanvas(canvas, canvas.parentElement!.clientWidth, 400);
    const width = canvas.parentElement!.clientWidth;
    const height = 400;

    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const scale = 20; // pixels per meter

    // Draw path
    ctx.strokeStyle = '#cbd5e1';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, params.R * scale, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw center point
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, 2*Math.PI);
    ctx.fill();

    // Object position
    const x = cx + params.R * scale * Math.cos(state.theta);
    const y = cy - params.R * scale * Math.sin(state.theta); // -y is up in screen space

    // Draw object
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fill();

    // Kinematics calculations
    const v_mag = params.R * state.w;
    const ar_mag = params.R * state.w * state.w;
    const at_mag = params.R * params.alpha;

    // The angle in screen space is flipped vertically because y is down.
    // Standard polar: counter-clockwise. Screen polar: clockwise.
    // x = cos(theta), y = -sin(theta)
    // Tangent angle: theta + pi/2
    const screenTheta = -state.theta;
    const tangentAngle = screenTheta - Math.PI / 2; // -pi/2 to rotate counter-clockwise in screen space (-y up)
    // Wait, if theta increases, it spins CCW in standard math, meaning x = cos, y = -sin
    // So velocity vector direction is tangent.
    // Velocity vector components in standard math: vx = -v * sin(theta), vy = v * cos(theta).
    // In screen math: dx = -v * sin(theta), dy = -vy = -v * cos(theta).
    const dir_v = screenTheta - Math.sign(state.w) * Math.PI/2; 
    
    // Draw Velocity
    const vecScale = 2; // px per unit
    if (Math.abs(v_mag) > 0.1) {
      // Draw tangential velocity
      drawArrow(ctx, x, y, Math.abs(v_mag) * vecScale, screenTheta - Math.sign(state.w) * Math.PI/2, 'var(--color-vel)', 3);
    }

    // Radial acceleration (centripetal) is always towards center
    const dir_ar = screenTheta + Math.PI; // Towards center
    const arScale = 0.5; // Scale it down as w^2 gets huge
    if (ar_mag > 0.1) {
      drawArrow(ctx, x, y, ar_mag * arScale, dir_ar, 'var(--color-accel-radial)', 3);
    }

    // Tangential acceleration
    if (Math.abs(at_mag) > 0.1) {
      drawArrow(ctx, x, y, Math.abs(at_mag) * vecScale, screenTheta - Math.sign(params.alpha) * Math.PI/2, 'var(--color-accel-tangential)', 3);
    }

    // Total acceleration
    // a_x = ar_x + at_x, a_y = ar_y + at_y
    const ar_x = ar_mag * Math.cos(dir_ar);
    const ar_y = ar_mag * Math.sin(dir_ar);
    const at_x = Math.abs(at_mag) * Math.cos(screenTheta - Math.sign(params.alpha) * Math.PI/2);
    const at_y = Math.abs(at_mag) * Math.sin(screenTheta - Math.sign(params.alpha) * Math.PI/2);
    const a_tot_x = ar_x + at_x;
    const a_tot_y = ar_y + at_y;
    const a_tot_mag = Math.sqrt(a_tot_x * a_tot_x + a_tot_y * a_tot_y);
    const a_tot_dir = Math.atan2(a_tot_y, a_tot_x);

    if (a_tot_mag > 0.1 && Math.abs(at_mag) > 0.1) {
       drawArrow(ctx, x, y, a_tot_mag * arScale, a_tot_dir, 'var(--color-accel)', 2);
    }

  }, [state, params]);

  const ControlRow = ({ label, name, min, max, step }: any) => (
    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 70px', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
      <label style={{ fontSize: '13px', fontWeight: 500 }}>{label}</label>
      <input type="range" name={name} min={min} max={max} step={step} value={params[name as keyof typeof params]} onChange={handleChange} />
      <input type="number" name={name} value={params[name as keyof typeof params]} onChange={handleChange} style={{ fontSize: '13px', padding: '6px' }} />
    </div>
  );

  const at = params.R * params.alpha;
  const ar = params.R * state.w * state.w;
  const a_tot = Math.sqrt(at*at + ar*ar);
  const v = params.R * state.w;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1>Uniform vs Non-Uniform Circular Motion</h1>
          <p className="text-muted textbook-font">2D Dynamics - Observe radial and tangential acceleration components.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={toggle}>{isRunning ? 'Pause' : 'Play'}</button>
          <button className="secondary" onClick={reset}>Reset</button>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', fontSize: '14px', background: '#f8fafc', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--color-vel)', fontWeight: 600 }}>→ Velocity <InlineMath math="\vec{v}" /></span>
            <span style={{ color: 'var(--color-accel-radial)', fontWeight: 600 }}>→ Radial Accel <InlineMath math="\vec{a}_r" /></span>
            <span style={{ color: 'var(--color-accel-tangential)', fontWeight: 600 }}>→ Tangential Accel <InlineMath math="\vec{a}_t" /></span>
            <span style={{ color: 'var(--color-accel)', fontWeight: 600 }}>→ Total Accel <InlineMath math="\vec{a}" /></span>
          </div>
          <div style={{ width: '100%', height: '400px' }}>
            <canvas ref={canvasRef} style={{ display: 'block' }}></canvas>
          </div>
        </div>

        <div>
          <div className="glass-panel" style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>Parameters</h2>
            <ControlRow label={<>Radius <InlineMath math="R" /> (m)</>} name="R" min="1" max="10" step="0.5" />
            <ControlRow label={<>Initial <InlineMath math="\omega_0" /> (rad/s)</>} name="w0" min="-5" max="5" step="0.1" />
            <ControlRow label={<>Ang Accel <InlineMath math="\alpha" /> (rad/s²)</>} name="alpha" min="-2" max="2" step="0.1" />
          </div>

          <div className="glass-panel">
            <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>Dynamics</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
              <span className="text-muted">Angular Vel <InlineMath math="\omega" /></span>
              <span style={{ fontWeight: 600 }}>{state.w.toFixed(2)} rad/s</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
              <span className="text-muted">Tangential Vel <InlineMath math="v" /></span>
              <span style={{ fontWeight: 600, color: 'var(--color-vel)' }}>{Math.abs(v).toFixed(2)} m/s</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
              <span className="text-muted">Radial Accel <InlineMath math="a_r" /></span>
              <span style={{ fontWeight: 600, color: 'var(--color-accel-radial)' }}>{ar.toFixed(2)} m/s²</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
              <span className="text-muted">Tangential Accel <InlineMath math="a_t" /></span>
              <span style={{ fontWeight: 600, color: 'var(--color-accel-tangential)' }}>{Math.abs(at).toFixed(2)} m/s²</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Total Accel <InlineMath math="|\vec{a}|" /></span>
              <span style={{ fontWeight: 600, color: 'var(--color-accel)' }}>{a_tot.toFixed(2)} m/s²</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
