import React, { useState, useRef, useEffect, useCallback } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import { usePhysicsEngine } from '../../hooks/usePhysicsEngine';
import { drawArrow, scaleCanvas, drawMixedText, drawCoordinateGrid, resolveColor } from '../../components/physics/drawUtils';
import { SimulationLayout } from '../../components/layout/SimulationLayout';

const VEL_HISTORY = 200;

export default function NewtonsThirdLaw() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const velChartRef = useRef<HTMLCanvasElement>(null);
  const velHistRef  = useRef<number[]>([]);
  const timeRef     = useRef<number>(0);

  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => setFontsReady(true));
    }
  }, []);

  const [params, setParams] = useState({ m1: 5.0, m2: 3.0, F_app: 16.0 });
  const [state,  setState]  = useState({ x: -8, v: 0 });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParams({ ...params, [e.target.name]: parseFloat(e.target.value) });
  };

  const physicsStep = useCallback((dt: number) => {
    setState(prev => {
      const a   = params.F_app / (params.m1 + params.m2);
      let v_new = prev.v + a * dt;
      let x_new = prev.x + prev.v * dt + 0.5 * a * dt * dt;
      if (x_new >  15) { x_new = -10; v_new = 0; }
      if (x_new < -15) { x_new =  10; v_new = 0; }
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

  useEffect(() => { if (!isRunning) physicsStep(0); }, [params, isRunning, physicsStep]);
  useEffect(() => { setState(prev => ({ ...prev, x: -8 })); }, []);

  // ── Main scene ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = scaleCanvas(canvas, canvas.parentElement!.clientWidth, 300);
    const w   = canvas.parentElement!.clientWidth;
    const h   = 300;

    // Draw coordinate grid background
    drawCoordinateGrid(ctx, w, h, {
      backgroundColor: '#fcfdfd',
      gridColor: '#e2e8f0',
      subdivisionColor: '#f8fafc'
    });

    const floorY = h - 55;

    // Floor
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, floorY, w, 55);
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, floorY); ctx.lineTo(w, floorY); ctx.stroke();
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
    for (let hx = -50; hx < w + 50; hx += 20) {
      ctx.beginPath(); ctx.moveTo(hx, floorY); ctx.lineTo(hx + 15, floorY + 15); ctx.stroke();
    }

    const scale = 16;
    const cy    = floorY;
    const a     = params.F_app / (params.m1 + params.m2);
    const F12   = params.m2 * a;
    const F21   = -F12;

    const b1_w = 44 + params.m1 * 4;
    const b1_h = 44 + params.m1 * 4;
    const b2_w = 44 + params.m2 * 4;
    const b2_h = 44 + params.m2 * 4;

    const x1_left  = w / 2 + state.x * scale;
    const x1_right = x1_left + b1_w;
    const x2_left  = x1_right;

    // Block 1
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(x1_left + 4, cy - b1_h + 4, b1_w, b1_h);
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(x1_left, cy - b1_h, b1_w, b1_h);
    ctx.strokeStyle = '#0284c7'; ctx.lineWidth = 2;
    ctx.strokeRect(x1_left, cy - b1_h, b1_w, b1_h);
    // Center the italicized mass parameter label 'm1' inside the block
    drawMixedText(ctx, x1_left + b1_w / 2, cy - b1_h / 2,
      [{ text: 'm', italic: true }, { text: '1', subscript: true }],
      { fontSize: 18, color: '#0284c7', align: 'center', baseline: 'middle' });

    // Block 2
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(x2_left + 4, cy - b2_h + 4, b2_w, b2_h);
    ctx.fillStyle = '#fce7f3';
    ctx.fillRect(x2_left, cy - b2_h, b2_w, b2_h);
    ctx.strokeStyle = '#be185d'; ctx.lineWidth = 2;
    ctx.strokeRect(x2_left, cy - b2_h, b2_w, b2_h);
    // Center the italicized mass parameter label 'm2' inside the block
    drawMixedText(ctx, x2_left + b2_w / 2, cy - b2_h / 2,
      [{ text: 'm', italic: true }, { text: '2', subscript: true }],
      { fontSize: 18, color: '#be185d', align: 'center', baseline: 'middle' });

    const vecScale = 3.5;
    const topY     = cy - Math.max(b1_h, b2_h) - 18;

    // Applied force
    if (Math.abs(params.F_app) > 0.1) {
      if (params.F_app >= 0) {
        // Starts on left pointing right, pushing Block 1
        drawArrow(ctx, x1_left - params.F_app * vecScale, cy - b1_h / 2,
          params.F_app * vecScale, 0, 'var(--color-force-app)', 4.5);
      } else {
        // Starts on right pointing left, pushing Block 1 from the other side
        drawArrow(ctx, x1_right + Math.abs(params.F_app) * vecScale, cy - b1_h / 2,
          Math.abs(params.F_app) * vecScale, Math.PI, 'var(--color-force-app)', 4.5);
      }

      // Center the label perfectly above the arrow shaft
      const shaftMidX = params.F_app >= 0
        ? x1_left - (params.F_app * vecScale) / 2
        : x1_right + (Math.abs(params.F_app) * vecScale) / 2;
      drawMixedText(ctx, shaftMidX, cy - b1_h / 2 - 12,
        [{ text: 'F', italic: true, vector: true }, { text: 'app', italic: false, subscript: true }, { text: ' = ' + Math.abs(params.F_app).toFixed(0) + ' N' }],
        { fontSize: 16, color: 'var(--color-force-app)', align: 'center', baseline: 'bottom' });
    }

    // F₁₂ — force of 1 on 2
    if (Math.abs(F12) > 0.1) {
      const tip = drawArrow(ctx, x1_right, topY - 8,
        Math.abs(F12) * vecScale,
        F12 > 0 ? 0 : Math.PI,
        '#be185d', 4.5);
      drawMixedText(ctx, tip.hx + (F12 > 0 ? 8 : -8), topY - 8,
        [{ text: 'F', italic: true, vector: true }, { text: '12', italic: false, subscript: true }, { text: ' = ' + F12.toFixed(1) + ' N' }],
        { fontSize: 16, color: '#be185d', align: F12 > 0 ? 'left' : 'right', baseline: 'middle' });
    }

    // F₂₁ — force of 2 on 1
    if (Math.abs(F21) > 0.1) {
      const tip = drawArrow(ctx, x1_right, topY + 14,
        Math.abs(F21) * vecScale,
        F21 > 0 ? 0 : Math.PI,
        '#0284c7', 4.5);
      drawMixedText(ctx, tip.hx + (F21 > 0 ? 8 : -8), topY + 14,
        [{ text: 'F', italic: true, vector: true }, { text: '21', italic: false, subscript: true }, { text: ' = ' + Math.abs(F21).toFixed(1) + ' N' }],
        { fontSize: 16, color: '#0284c7', align: F21 > 0 ? 'left' : 'right', baseline: 'middle' });
    }

    // System acceleration
    if (Math.abs(a) > 0.01) {
      const midBlock = x1_left + (b1_w + b2_w) / 2;
      drawArrow(ctx, midBlock, topY - 34,
        Math.abs(a) * 14,
        a > 0 ? 0 : Math.PI,
        'var(--color-accel)', 4.5);
      drawMixedText(ctx, midBlock, topY - 50,
        [{ text: 'a', italic: true, vector: true }, { text: ' = ' + a.toFixed(2) + ' m/s²' }],
        { fontSize: 16, color: 'var(--color-accel)', align: 'center', baseline: 'bottom' });
    }

  }, [state, params, fontsReady]);

  // ── Velocity vs time chart ───────────────────────────────────────────────
  useEffect(() => {
    const canvas = velChartRef.current;
    if (!canvas) return;
    const ctx = scaleCanvas(canvas, canvas.parentElement!.clientWidth, 160);
    const w   = canvas.parentElement!.clientWidth;
    const h   = 160;

    // Coordinate Grid background for chart
    drawCoordinateGrid(ctx, w, h, {
      backgroundColor: '#fcfdfd',
      gridColor: '#e2e8f0',
      subdivisionColor: '#f8fafc'
    });

    const padL = 52, padR = 14, padT = 16, padB = 36;
    const chartW = w - padL - padR;
    const chartH = h - padT - padB;

    const hist = velHistRef.current;
    const maxV = Math.max(10, ...hist.map(Math.abs)) * 1.2;

    const mapI = (i: number) => padL + (i / (VEL_HISTORY - 1)) * chartW;
    const mapV = (v: number) => padT + chartH / 2 - (v / maxV) * (chartH / 2);

    // Zero line
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, mapV(0)); ctx.lineTo(padL + chartW, mapV(0)); ctx.stroke();

    // Border
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5;
    ctx.strokeRect(padL, padT, chartW, chartH);

    // Tick labels
    const vTicks = [maxV, 0, -maxV];
    for (const vt of vTicks) {
      drawMixedText(ctx, padL - 6, mapV(vt),
        [{ text: vt.toFixed(0) }],
        { fontSize: 11, color: '#64748b', align: 'right' });
    }

    // Y-axis title:  v  (m/s)
    ctx.save();
    ctx.translate(12, padT + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    drawMixedText(ctx, 0, 0,
      [{ text: 'v', italic: true }, { text: ' (m/s)' }],
      { fontSize: 12, color: '#334155', align: 'center' });
    ctx.restore();

    // X-axis title
    drawMixedText(ctx, padL + chartW / 2, h - 4,
      [{ text: 'time →' }],
      { fontSize: 11, color: '#94a3b8', align: 'center', baseline: 'bottom' });

    // Velocity curve
    if (hist.length > 1) {
      ctx.strokeStyle = resolveColor('var(--color-vel)');
      ctx.lineWidth   = 2;
      ctx.beginPath();
      hist.forEach((v, i) => {
        const px = mapI(i + VEL_HISTORY - hist.length);
        const py = mapV(v);
        if (i === 0) ctx.moveTo(px, py);
        else         ctx.lineTo(px, py);
      });
      ctx.stroke();

      const lastV = hist[hist.length - 1];
      ctx.fillStyle = resolveColor('var(--color-vel)');
      ctx.beginPath();
      ctx.arc(mapI(VEL_HISTORY - 1), mapV(lastV), 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, [state, fontsReady]);



  const a   = params.F_app / (params.m1 + params.m2);
  const F12 = params.m2 * a;
  const F21 = -F12;

  return (
    <SimulationLayout
      title="Newton's 3rd Law"
      description="Interacting Objects — Every action has an equal and opposite reaction."

      actionsContent={
        <>
          <button onClick={toggle}>{isRunning ? 'Pause' : 'Play'}</button>
          <button className="secondary" onClick={reset}>Reset</button>
        </>
      }

      canvasContent={
        <>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px', fontSize: '13px', background: '#f8fafc', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: 'var(--color-force-app)', fontWeight: 600 }}>→ <InlineMath math="\vec{F}_{\text{app}}" /></span>
            <span style={{ color: '#be185d',                fontWeight: 600 }}>→ <InlineMath math="\vec{F}_{12}" /></span>
            <span style={{ color: '#0284c7',                fontWeight: 600 }}>→ <InlineMath math="\vec{F}_{21}" /></span>
            <span style={{ color: 'var(--color-accel)',     fontWeight: 600 }}>→ <InlineMath math="\vec{a}" /></span>
          </div>
          <div style={{ width: '100%', height: '300px' }}>
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', background: '#fff' }}>
            <div style={{ padding: '6px 16px 0', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
              Velocity <InlineMath math="v" /> vs time
            </div>
            <div style={{ width: '100%', height: '160px' }}>
              <canvas ref={velChartRef} style={{ display: 'block', width: '100%', height: '100%' }} />
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
            Because the two blocks move together, they share the same system acceleration:
          </p>
          <BlockMath math="a = \frac{F_{\text{app}}}{m_1 + m_2}" />
          <p>
            The contact force that block 1 exerts on block 2 must accelerate <InlineMath math="m_2" /> alone:
          </p>
          <BlockMath math="F_{12} = m_2 \cdot a" />
          <p>
            <strong>Interactive:</strong> Even when <InlineMath math="m_1 \gg m_2" />, the pair <InlineMath math="F_{12}" /> and <InlineMath math="F_{21}" /> remain perfectly equal and opposite. Watch velocity build linearly on the chart.
          </p>
        </div>
      }

      controlsContent={
        <>
          <ControlRow label={<>Mass <InlineMath math="m_1" /> (kg)</>}              name="m1"    min="1"   max="20" step="0.5" value={params.m1} onChange={handleChange} />
          <ControlRow label={<>Mass <InlineMath math="m_2" /> (kg)</>}              name="m2"    min="1"   max="20" step="0.5" value={params.m2} onChange={handleChange} />
          <ControlRow label={<><InlineMath math="F_{\text{app}}" /> (N)</>}         name="F_app" min="-50" max="50" step="1"   value={params.F_app} onChange={handleChange} />
        </>
      }

      metricsContent={
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            <span className="text-muted">Total mass <InlineMath math="M" /></span>
            <span style={{ fontWeight: 600 }}>{(params.m1 + params.m2).toFixed(1)} kg</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            <span className="text-muted">System accel <InlineMath math="a" /></span>
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
