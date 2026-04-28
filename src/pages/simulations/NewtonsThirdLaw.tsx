import React, { useState, useRef, useEffect, useCallback } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import { usePhysicsEngine } from '../../hooks/usePhysicsEngine';
import { drawArrow, scaleCanvas } from '../../components/physics/drawUtils';
import { SimulationLayout } from '../../components/layout/SimulationLayout';

const VEL_HISTORY = 200;

export default function NewtonsThirdLaw() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const velChartRef = useRef<HTMLCanvasElement>(null);
  const velHistRef = useRef<number[]>([]);
  const timeRef = useRef<number>(0);

  const [params, setParams] = useState({
    m1: 5.0,
    m2: 3.0,
    F_app: 16.0
  });

  const [state, setState] = useState({
    x: -8,
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

      if (x_new > 15) { x_new = -10; v_new = 0; }
      if (x_new < -15) { x_new = 10; v_new = 0; }

      // Track velocity history
      velHistRef.current.push(v_new);
      if (velHistRef.current.length > VEL_HISTORY) velHistRef.current.shift();
      timeRef.current += dt;

      return { x: x_new, v: v_new };
    });
  }, [params]);

  const { isRunning, toggle, reset } = usePhysicsEngine({
    onStep: physicsStep,
    onReset: () => {
      setState({ x: -8, v: 0 });
      velHistRef.current = [];
      timeRef.current = 0;
    }
  });

  useEffect(() => {
    if (!isRunning) physicsStep(0);
  }, [params, isRunning, physicsStep]);

  useEffect(() => {
    setState(prev => ({ ...prev, x: -8 }));
  }, []);

  // Main Scene
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = scaleCanvas(canvas, canvas.parentElement!.clientWidth, 320);
    const w = canvas.parentElement!.clientWidth;
    const h = 320;

    ctx.clearRect(0, 0, w, h);

    const floorY = h - 60;

    // Floor with hatch marks
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, floorY, w, 60);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, floorY); ctx.lineTo(w, floorY); ctx.stroke();
    ctx.strokeStyle = '#b8c4d0';
    ctx.lineWidth = 1;
    for (let hx = -50; hx < w + 50; hx += 20) {
      ctx.beginPath(); ctx.moveTo(hx, floorY); ctx.lineTo(hx + 30, floorY + 30); ctx.stroke();
    }

    const scale = 16;
    const cy = floorY;
    const a = params.F_app / (params.m1 + params.m2);
    const F12 = params.m2 * a;
    const F21 = -F12;

    const b1_w = 44 + params.m1 * 4;
    const b1_h = 44 + params.m1 * 4;
    const b2_w = 44 + params.m2 * 4;
    const b2_h = 44 + params.m2 * 4;

    const x1_left = w / 2 + state.x * scale;
    const x1_right = x1_left + b1_w;
    const x2_left = x1_right;

    // Block 1 shadow
    ctx.fillStyle = 'rgba(0,0,0,0.07)';
    ctx.fillRect(x1_left + 4, cy - b1_h + 4, b1_w, b1_h);

    // Block 1
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(x1_left, cy - b1_h, b1_w, b1_h);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.strokeRect(x1_left, cy - b1_h, b1_w, b1_h);
    ctx.fillStyle = '#0284c7';
    ctx.font = `bold 14px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`m₁`, x1_left + b1_w / 2, cy - b1_h + 6);
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(`${params.m1.toFixed(1)} kg`, x1_left + b1_w / 2, cy - b1_h + 22);

    // Block 2 shadow
    ctx.fillStyle = 'rgba(0,0,0,0.07)';
    ctx.fillRect(x2_left + 4, cy - b2_h + 4, b2_w, b2_h);

    // Block 2
    ctx.fillStyle = '#fce7f3';
    ctx.fillRect(x2_left, cy - b2_h, b2_w, b2_h);
    ctx.strokeStyle = '#be185d';
    ctx.lineWidth = 2;
    ctx.strokeRect(x2_left, cy - b2_h, b2_w, b2_h);
    ctx.fillStyle = '#be185d';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`m₂`, x2_left + b2_w / 2, cy - b2_h + 6);
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(`${params.m2.toFixed(1)} kg`, x2_left + b2_w / 2, cy - b2_h + 22);

    const vecScale = 3.5;
    const topY = cy - Math.max(b1_h, b2_h) - 20;

    // Applied force on Block 1
    if (Math.abs(params.F_app) > 0.1) {
      const tip = drawArrow(ctx, x1_left, cy - b1_h / 2, params.F_app * vecScale, params.F_app > 0 ? Math.PI : 0, 'var(--color-force-app)', 4);
      ctx.fillStyle = 'var(--color-force-app)';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = params.F_app > 0 ? 'right' : 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`F = ${params.F_app.toFixed(0)} N`, tip.hx + (params.F_app > 0 ? -6 : 6), cy - b1_h / 2);
    }

    // Interaction forces at boundary (stacked vertically to avoid overlap)
    const boundary_x = x1_right;

    if (Math.abs(F12) > 0.1) {
      const f12Tip = drawArrow(ctx, boundary_x, topY - 10, Math.abs(F12) * vecScale, F12 > 0 ? 0 : Math.PI, '#be185d', 3);
      ctx.fillStyle = '#be185d';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = F12 > 0 ? 'left' : 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(`F₁₂ = ${F12.toFixed(1)} N`, f12Tip.hx + (F12 > 0 ? 5 : -5), topY - 10);
    }

    if (Math.abs(F21) > 0.1) {
      const f21Tip = drawArrow(ctx, boundary_x, topY + 14, Math.abs(F21) * vecScale, F21 > 0 ? 0 : Math.PI, '#0284c7', 3);
      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = F21 > 0 ? 'left' : 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(`F₂₁ = ${Math.abs(F21).toFixed(1)} N`, f21Tip.hx + (F21 > 0 ? 5 : -5), topY + 14);
    }

    // System acceleration arrow above blocks
    if (Math.abs(a) > 0.01) {
      const midBlock = x1_left + (b1_w + b2_w) / 2;
      drawArrow(ctx, midBlock, topY - 38, Math.abs(a) * 14, a > 0 ? 0 : Math.PI, 'var(--color-accel)', 3);
      ctx.fillStyle = 'var(--color-accel)';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`a = ${a.toFixed(2)} m/s²`, midBlock, topY - 44);
    }

    // Velocity display
    if (Math.abs(state.v) > 0.05) {
      ctx.fillStyle = 'var(--color-vel)';
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`v = ${state.v.toFixed(2)} m/s`, x1_left + (b1_w + b2_w) / 2, h - 8);
    }

  }, [state, params]);

  // Velocity vs Time chart
  useEffect(() => {
    const canvas = velChartRef.current;
    if (!canvas) return;
    const ctx = scaleCanvas(canvas, canvas.parentElement!.clientWidth, 160);
    const w = canvas.parentElement!.clientWidth;
    const h = 160;

    ctx.clearRect(0, 0, w, h);

    const padL = 50;
    const padR = 14;
    const padT = 16;
    const padB = 36;
    const chartW = w - padL - padR;
    const chartH = h - padT - padB;

    const hist = velHistRef.current;
    const maxV = Math.max(10, ...hist.map(Math.abs)) * 1.15;

    const mapI = (i: number) => padL + (i / (VEL_HISTORY - 1)) * chartW;
    const mapV = (v: number) => padT + chartH / 2 - (v / maxV) * (chartH / 2);

    // Grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, mapV(0)); ctx.lineTo(padL + chartW, mapV(0)); ctx.stroke();

    // Axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(padL, padT, chartW, chartH);

    // Axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`+${maxV.toFixed(0)}`, padL - 4, padT);
    ctx.fillText('0', padL - 4, mapV(0));
    ctx.fillText(`−${maxV.toFixed(0)}`, padL - 4, padT + chartH);

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('v  (m/s)  over time', padL + chartW / 2, h - 2);

    // Velocity curve
    if (hist.length > 1) {
      ctx.strokeStyle = 'var(--color-vel)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      hist.forEach((v, i) => {
        const px = mapI(i + VEL_HISTORY - hist.length);
        const py = mapV(v);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      // Latest value dot
      const lastV = hist[hist.length - 1];
      ctx.fillStyle = 'var(--color-vel)';
      ctx.beginPath();
      ctx.arc(mapI(VEL_HISTORY - 1), mapV(lastV), 4, 0, 2 * Math.PI);
      ctx.fill();
    }

  }, [state]);

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
    <SimulationLayout
      title="Newton's 3rd Law"
      description="Interacting Objects - Every action has an equal and opposite reaction."
      
      actionsContent={
        <>
          <button onClick={toggle}>{isRunning ? 'Pause' : 'Play'}</button>
          <button className="secondary" onClick={reset}>Reset</button>
        </>
      }

      canvasContent={
        <>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px', fontSize: '13px', background: '#f8fafc', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: 'var(--color-force-app)', fontWeight: 600 }}>→ <InlineMath math="F_{\text{app}}" /></span>
            <span style={{ color: '#be185d', fontWeight: 600 }}>→ <InlineMath math="F_{12}" /> (1 on 2)</span>
            <span style={{ color: '#0284c7', fontWeight: 600 }}>→ <InlineMath math="F_{21}" /> (2 on 1)</span>
            <span style={{ color: 'var(--color-accel)', fontWeight: 600 }}>→ <InlineMath math="a" /></span>
          </div>
          <div style={{ width: '100%', height: '320px' }}>
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }}></canvas>
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', backgroundColor: '#fff' }}>
            <h2 style={{ fontSize: '13px', margin: '6px 16px', color: '#64748b', fontWeight: 600 }}>
              Velocity <InlineMath math="v" /> vs Time
            </h2>
            <div style={{ width: '100%', height: '160px' }}>
              <canvas ref={velChartRef} style={{ display: 'block', width: '100%', height: '100%' }}></canvas>
            </div>
          </div>
        </>
      }

      theoryContent={
        <div style={{ padding: '16px', fontSize: '15px', lineHeight: '1.6' }}>
          <p>
            When two objects interact, the forces they exert on each other are always equal in magnitude and opposite in direction:
          </p>
          <BlockMath math="\vec{F}_{12} = -\vec{F}_{21}" />
          <p>
            Because the two blocks move together as a system, they share the same acceleration:
          </p>
          <BlockMath math="a = \frac{F_{\text{app}}}{m_1 + m_2}" />
          <p>
            The contact force that block 1 exerts on block 2 must accelerate <InlineMath math="m_2" /> alone:
          </p>
          <BlockMath math="F_{12} = m_2 \cdot a" />
          <p>
            <strong>Interactive:</strong> Notice that even if you make <InlineMath math="m_1 \gg m_2" />, the pair of interaction forces remain perfectly equal and opposite. The velocity chart scrolls in real time to show how velocity builds linearly.
          </p>
        </div>
      }

      controlsContent={
        <>
          <ControlRow label={<>Mass <InlineMath math="m_1" /> (kg)</>} name="m1" min="1" max="20" step="0.5" />
          <ControlRow label={<>Mass <InlineMath math="m_2" /> (kg)</>} name="m2" min="1" max="20" step="0.5" />
          <ControlRow label={<>App Force <InlineMath math="F_{\text{app}}" /> (N)</>} name="F_app" min="-50" max="50" step="1" />
        </>
      }

      metricsContent={
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            <span className="text-muted">Total Mass <InlineMath math="M" /></span>
            <span style={{ fontWeight: 600 }}>{(params.m1 + params.m2).toFixed(1)} kg</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            <span className="text-muted">System Accel <InlineMath math="a" /></span>
            <span style={{ fontWeight: 600, color: 'var(--color-accel)' }}>{a.toFixed(2)} m/s²</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            <span className="text-muted">Velocity <InlineMath math="v" /></span>
            <span style={{ fontWeight: 600, color: 'var(--color-vel)' }}>{state.v.toFixed(2)} m/s</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            <span className="text-muted"><InlineMath math="F_{12}" /> (1 on 2)</span>
            <span style={{ fontWeight: 600, color: '#be185d' }}>{F12.toFixed(2)} N</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="text-muted"><InlineMath math="F_{21}" /> (2 on 1)</span>
            <span style={{ fontWeight: 600, color: '#0284c7' }}>{F21.toFixed(2)} N</span>
          </div>
        </>
      }
    />
  );
}
