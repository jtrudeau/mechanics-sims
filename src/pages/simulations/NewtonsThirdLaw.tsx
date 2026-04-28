import React, { useState, useRef, useEffect, useCallback } from 'react';
import { InlineMath } from 'react-katex';
import { usePhysicsEngine } from '../../hooks/usePhysicsEngine';
import { drawArrow, scaleCanvas } from '../../components/physics/drawUtils';

export default function NewtonsThirdLaw() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [params, setParams] = useState({
    m1: 5.0,
    m2: 3.0,
    F_app: 16.0
  });

  const [state, setState] = useState({
    x: 0,
    v: 0
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParams({ ...params, [e.target.name]: parseFloat(e.target.value) });
  };

  const physicsStep = useCallback((dt: number) => {
    setState(prev => {
      const a = params.F_app / (params.m1 + params.m2);
      let v_new = prev.v + a * dt;
      let x_new = prev.x + prev.v * dt + 0.5 * a * dt * dt;

      // Wrap around screen for continuous viewing
      if (x_new > 15) {
        x_new = -10;
        v_new = prev.v; // maintain velocity or reset? let's reset to keep it in frame longer
      }
      if (x_new < -15) {
        x_new = 10;
        v_new = prev.v;
      }

      return { x: x_new, v: v_new };
    });
  }, [params]);

  const { isRunning, toggle, reset } = usePhysicsEngine({
    onStep: physicsStep,
    onReset: () => setState({ x: -8, v: 0 })
  });

  // Re-calculate if paused
  useEffect(() => {
    if (!isRunning) physicsStep(0);
  }, [params, isRunning, physicsStep]);
  
  // Set initial position
  useEffect(() => {
    setState(prev => ({ ...prev, x: -8 }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = scaleCanvas(canvas, canvas.parentElement!.clientWidth, 400);
    const w = canvas.parentElement!.clientWidth;
    const h = 400;

    ctx.clearRect(0, 0, w, h);

    // Floor
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, h - 50, w, 50);
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath(); ctx.moveTo(0, h - 50); ctx.lineTo(w, h - 50); ctx.stroke();

    const scale = 20; // px per meter
    const cy = h - 50;

    const a = params.F_app / (params.m1 + params.m2);
    // Force of 1 on 2
    const F12 = params.m2 * a;
    // Force of 2 on 1
    const F21 = -F12;

    // Block sizes proportional to mass roughly
    const b1_w = 40 + params.m1 * 5;
    const b1_h = 40 + params.m1 * 5;
    const b2_w = 40 + params.m2 * 5;
    const b2_h = 40 + params.m2 * 5;

    // Left edge of block 1
    const x1_left = w / 2 + state.x * scale;
    const x1_right = x1_left + b1_w;
    
    // Block 2 touches Block 1
    const x2_left = x1_right;
    
    // Draw Block 1
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(x1_left, cy - b1_h, b1_w, b1_h);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.strokeRect(x1_left, cy - b1_h, b1_w, b1_h);
    ctx.fillStyle = '#0284c7';
    ctx.font = 'italic 18px "STIX Two Text", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`m₁`, x1_left + b1_w/2, cy - b1_h/2);

    // Draw Block 2
    ctx.fillStyle = '#fce7f3';
    ctx.fillRect(x2_left, cy - b2_h, b2_w, b2_h);
    ctx.strokeStyle = '#be185d';
    ctx.lineWidth = 2;
    ctx.strokeRect(x2_left, cy - b2_h, b2_w, b2_h);
    ctx.fillStyle = '#be185d';
    ctx.font = 'italic 18px "STIX Two Text", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`m₂`, x2_left + b2_w/2, cy - b2_h/2);

    // Vectors
    const vecScale = 4;
    
    // Applied force on Block 1
    if (Math.abs(params.F_app) > 0.1) {
      drawArrow(ctx, x1_left, cy - b1_h/2, params.F_app * vecScale, params.F_app > 0 ? 0 : Math.PI, 'var(--color-force-app)', 4);
      // Label
      ctx.fillStyle = 'var(--color-force-app)';
      ctx.fillText(`F_app`, x1_left - 30, cy - b1_h/2 - 15);
    }

    // Interaction forces at the boundary
    const boundary_x = x1_right;
    const force_y = cy - Math.min(b1_h, b2_h) / 2;

    // F12 (Force of 1 on 2, pushing to the right if F_app is positive)
    if (Math.abs(F12) > 0.1) {
      drawArrow(ctx, boundary_x, force_y - 10, Math.abs(F12) * vecScale, F12 > 0 ? 0 : Math.PI, '#be185d', 3);
      ctx.fillStyle = '#be185d';
      ctx.fillText(`F₁₂`, boundary_x + 20, force_y - 20);
    }

    // F21 (Force of 2 on 1, pushing to the left if F_app is positive)
    if (Math.abs(F21) > 0.1) {
      drawArrow(ctx, boundary_x, force_y + 10, Math.abs(F21) * vecScale, F21 > 0 ? 0 : Math.PI, '#0284c7', 3);
      ctx.fillStyle = '#0284c7';
      ctx.fillText(`F₂₁`, boundary_x - 20, force_y + 25);
    }
    
    // Total System Acceleration
    if (Math.abs(a) > 0.1) {
      drawArrow(ctx, x1_left + (b1_w + b2_w)/2, cy - Math.max(b1_h, b2_h) - 30, Math.abs(a) * 10, a > 0 ? 0 : Math.PI, 'var(--color-accel)', 3);
      ctx.fillStyle = 'var(--color-accel)';
      ctx.fillText(`a = ${a.toFixed(2)} m/s²`, x1_left + (b1_w + b2_w)/2, cy - Math.max(b1_h, b2_h) - 45);
    }

  }, [state, params]);

  const ControlRow = ({ label, name, min, max, step }: any) => (
    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 70px', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
      <label style={{ fontSize: '13px', fontWeight: 500 }}>{label}</label>
      <input type="range" name={name} min={min} max={max} step={step} value={params[name as keyof typeof params]} onChange={handleChange} />
      <input type="number" name={name} value={params[name as keyof typeof params]} onChange={handleChange} style={{ fontSize: '13px', padding: '6px' }} />
    </div>
  );

  const a = params.F_app / (params.m1 + params.m2);
  const F12 = params.m2 * a;
  const F21 = -F12;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1>Newton's 3rd Law</h1>
          <p className="text-muted textbook-font">Interacting Objects - Every action has an equal and opposite reaction.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={toggle}>{isRunning ? 'Pause' : 'Play'}</button>
          <button className="secondary" onClick={reset}>Reset</button>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', fontSize: '14px', background: '#f8fafc', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--color-force-app)', fontWeight: 600 }}>→ Applied Force <InlineMath math="F_{\text{app}}" /></span>
            <span style={{ color: '#be185d', fontWeight: 600 }}>→ Force 1 on 2 <InlineMath math="F_{12}" /></span>
            <span style={{ color: '#0284c7', fontWeight: 600 }}>→ Force 2 on 1 <InlineMath math="F_{21}" /></span>
            <span style={{ color: 'var(--color-accel)', fontWeight: 600 }}>→ Acceleration <InlineMath math="a" /></span>
          </div>
          <div style={{ width: '100%', height: '400px' }}>
            <canvas ref={canvasRef} style={{ display: 'block' }}></canvas>
          </div>
        </div>

        <div>
          <div className="glass-panel" style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>Parameters</h2>
            <ControlRow label={<>Mass <InlineMath math="m_1" /> (kg)</>} name="m1" min="1" max="20" step="0.5" />
            <ControlRow label={<>Mass <InlineMath math="m_2" /> (kg)</>} name="m2" min="1" max="20" step="0.5" />
            <ControlRow label={<>App Force <InlineMath math="F_{\text{app}}" /> (N)</>} name="F_app" min="-50" max="50" step="1" />
          </div>

          <div className="glass-panel">
            <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>System Dynamics</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
              <span className="text-muted">Total Mass <InlineMath math="M" /></span>
              <span style={{ fontWeight: 600 }}>{(params.m1 + params.m2).toFixed(1)} kg</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
              <span className="text-muted">System Accel <InlineMath math="a" /></span>
              <span style={{ fontWeight: 600, color: 'var(--color-accel)' }}>{a.toFixed(2)} m/s²</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
              <span className="text-muted"><InlineMath math="F_{12}" /> (1 on 2)</span>
              <span style={{ fontWeight: 600, color: '#be185d' }}>{F12.toFixed(2)} N</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted"><InlineMath math="F_{21}" /> (2 on 1)</span>
              <span style={{ fontWeight: 600, color: '#0284c7' }}>{F21.toFixed(2)} N</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
