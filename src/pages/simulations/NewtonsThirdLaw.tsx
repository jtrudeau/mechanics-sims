import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { InlineMath, BlockMath } from 'react-katex';
import { usePhysicsEngine } from '../../hooks/usePhysicsEngine';
import { drawArrow, drawMixedText, drawCoordinateGrid, fitStage, placeLabelBeside } from '../../components/physics/drawUtils';
import { SimulationLayout } from '../../components/layout/SimulationLayout';
import { useCanvasStage } from '../../hooks/useCanvasStage';
import { parseUrlParams } from '../../hooks/useUrlSync';
import { PredictionGate } from '../../components/pedagogy/PredictionGate';
import { predictionChallenges } from '../../content/predictionChallenges';

export default function NewtonsThirdLaw() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef<number>(0);
  const stageGen = useCanvasStage(canvasRef);

  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => setFontsReady(true));
    }
  }, []);

  const DEFAULT_PARAMS = { m1: 5.0, m2: 3.0, F_app: 16.0 };
  const [searchParams] = useSearchParams();
  const [params, setParams] = useState(() => parseUrlParams(searchParams, DEFAULT_PARAMS));

  useEffect(() => {
    setParams((prev) => parseUrlParams(searchParams, prev));
  }, [searchParams]);

  const [state, setState] = useState({ x: -8, v: 0 });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParams({ ...params, [e.target.name]: parseFloat(e.target.value) });
  };

  const physicsStep = useCallback((dt: number) => {
    setState((prev) => {
      const a = params.F_app / (params.m1 + params.m2);
      let v_new = prev.v + a * dt;
      let x_new = prev.x + prev.v * dt + 0.5 * a * dt * dt;
      if (x_new > 15) {
        x_new = -10;
        v_new = 0;
      }
      if (x_new < -15) {
        x_new = 10;
        v_new = 0;
      }
      timeRef.current += dt;
      return { x: x_new, v: v_new };
    });
  }, [params]);

  const { isRunning, toggle, reset, stepForward, start } = usePhysicsEngine({
    onStep: physicsStep,
    onReset: () => {
      setState({ x: -8, v: 0 });
      timeRef.current = 0;
    },
    fixedDt: 0.01,
  });

  const handleApplyChallenge = useCallback((setup: Record<string, unknown>) => {
    setState({ x: -8, v: 0 });
    timeRef.current = 0;
    setParams((prev) => ({
      ...prev,
      ...(setup as Partial<typeof DEFAULT_PARAMS>),
    }));
  }, []);

  const challengeContent = (
    <PredictionGate
      challenges={predictionChallenges['newtons-third-law']}
      onApplySetup={handleApplyChallenge}
      onRunSim={start}
    />
  );

  useEffect(() => {
    if (!isRunning) physicsStep(0);
  }, [params, isRunning, physicsStep]);
  useEffect(() => {
    setState((prev) => ({ ...prev, x: -8 }));
  }, []);

  // ── Main scene ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { ctx, w, h, s } = fitStage(canvas, 300);
    const lw = 4.5 * s;
    const fs = Math.round(18 * s);
    const fsMass = Math.round(20 * s);

    drawCoordinateGrid(ctx, w, h, {
      backgroundColor: '#fcfdfd',
      gridColor: '#e2e8f0',
      subdivisionColor: '#f8fafc',
    });

    const floorY = h - Math.round(55 * s);

    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, floorY, w, h - floorY);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(w, floorY);
    ctx.stroke();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let hx = -50; hx < w + 50; hx += 20) {
      ctx.beginPath();
      ctx.moveTo(hx, floorY);
      ctx.lineTo(hx + 15, floorY + 15);
      ctx.stroke();
    }

    const scale = 16 * s;
    const cy = floorY;
    const a = params.F_app / (params.m1 + params.m2);
    const F12 = params.m2 * a;
    const F21 = -F12;

    const b1_w = (65 + params.m1 * 6) * s;
    const b1_h = (65 + params.m1 * 6) * s;
    const b2_w = (65 + params.m2 * 6) * s;
    const b2_h = (65 + params.m2 * 6) * s;

    const x1_left = w / 2 + state.x * scale;
    const x1_right = x1_left + b1_w;
    const x2_left = x1_right;

    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(x1_left + 5, cy - b1_h + 5, b1_w, b1_h);
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(x1_left, cy - b1_h, b1_w, b1_h);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.2;
    ctx.strokeRect(x1_left, cy - b1_h, b1_w, b1_h);

    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(x1_left + b1_w / 2, cy - b1_h / 2, 3.5 * s, 0, Math.PI * 2);
    ctx.fill();

    drawMixedText(ctx, x1_left + b1_w / 2, cy - b1_h + 22 * s,
      [{ text: 'm', italic: true }, { text: '1', subscript: true }],
      { fontSize: fsMass, color: '#0284c7', align: 'center', baseline: 'middle', halo: true });

    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(x2_left + 5, cy - b2_h + 5, b2_w, b2_h);
    ctx.fillStyle = '#fce7f3';
    ctx.fillRect(x2_left, cy - b2_h, b2_w, b2_h);
    ctx.strokeStyle = '#be185d';
    ctx.lineWidth = 2.2;
    ctx.strokeRect(x2_left, cy - b2_h, b2_w, b2_h);

    ctx.fillStyle = '#be185d';
    ctx.beginPath();
    ctx.arc(x2_left + b2_w / 2, cy - b2_h / 2, 3.5 * s, 0, Math.PI * 2);
    ctx.fill();

    drawMixedText(ctx, x2_left + b2_w / 2, cy - b2_h + 22 * s,
      [{ text: 'm', italic: true }, { text: '2', subscript: true }],
      { fontSize: fsMass, color: '#be185d', align: 'center', baseline: 'middle', halo: true });

    const vecScale = 3.5 * s;
    const blockTop = cy - Math.max(b1_h, b2_h);
    const contact = x1_right;
    const above = (angle: number, gap: number) => (Math.cos(angle) >= 0 ? -gap : gap);

    if (Math.abs(params.F_app) > 0.1) {
      const appLen = Math.abs(params.F_app) * vecScale;
      const appAngle = params.F_app >= 0 ? 0 : Math.PI;
      const appStartX = params.F_app >= 0 ? x1_left - appLen : x1_right + appLen;
      const appY = cy - b1_h / 2;
      drawArrow(ctx, appStartX, appY, appLen, appAngle, 'var(--color-force-app)', lw, true);
      const appLabelX = params.F_app >= 0 ? x1_left - 10 * s : x1_right + 10 * s;
      drawMixedText(ctx, appLabelX, appY - 14 * s,
        [{ text: 'F', italic: true, vector: true }, { text: 'app', italic: false, subscript: true }, { text: ' = ' + Math.abs(params.F_app).toFixed(0) + ' N' }],
        { fontSize: fs, color: 'var(--color-force-app)', align: params.F_app >= 0 ? 'right' : 'left', baseline: 'bottom', halo: true });
    }

    if (Math.abs(F21) > 0.1) {
      const f21Angle = F21 > 0 ? 0 : Math.PI;
      const f21Y = blockTop - 36 * s;
      const tip = drawArrow(ctx, contact, f21Y, Math.abs(F21) * vecScale, f21Angle, '#0284c7', lw, true);
      const label = placeLabelBeside(contact, f21Y, tip.hx, tip.hy, f21Angle, 12 * s, above(f21Angle, 22 * s));
      drawMixedText(ctx, label.x, label.y,
        [{ text: 'F', italic: true, vector: true }, { text: '21', italic: false, subscript: true }, { text: ' = ' + Math.abs(F21).toFixed(1) + ' N' }],
        { fontSize: fs, color: '#0284c7', align: label.align, baseline: label.baseline, halo: true });
    }

    if (Math.abs(F12) > 0.1) {
      const f12Angle = F12 > 0 ? 0 : Math.PI;
      const f12Y = blockTop - 92 * s;
      const tip = drawArrow(ctx, contact, f12Y, Math.abs(F12) * vecScale, f12Angle, '#be185d', lw, true);
      const label = placeLabelBeside(contact, f12Y, tip.hx, tip.hy, f12Angle, 12 * s, above(f12Angle, 22 * s));
      drawMixedText(ctx, label.x, label.y,
        [{ text: 'F', italic: true, vector: true }, { text: '12', italic: false, subscript: true }, { text: ' = ' + F12.toFixed(1) + ' N' }],
        { fontSize: fs, color: '#be185d', align: label.align, baseline: label.baseline, halo: true });
    }

    if (Math.abs(a) > 0.01) {
      const midBlock = x1_left + (b1_w + b2_w) / 2;
      const aAngle = a > 0 ? 0 : Math.PI;
      const aY = blockTop - 172 * s;
      const aTip = drawArrow(ctx, midBlock, aY, Math.max(36 * s, Math.abs(a) * 14 * s), aAngle, 'var(--color-accel)', lw, true);
      const aLabel = placeLabelBeside(midBlock, aY, aTip.hx, aTip.hy, aAngle, 14 * s, above(aAngle, 20 * s));
      drawMixedText(ctx, aLabel.x, aLabel.y,
        [{ text: 'a', italic: true, vector: true }, { text: ' = ' + a.toFixed(2) + ' m/s²' }],
        { fontSize: fs, color: 'var(--color-accel)', align: aLabel.align, baseline: aLabel.baseline, halo: true });
    }
  }, [state, params, fontsReady, stageGen]);

  const a = params.F_app / (params.m1 + params.m2);
  const F12 = params.m2 * a;
  const F21 = -F12;

  return (
    <SimulationLayout
      title="Newton's 3rd Law"
      description="Interacting Objects — Every action has an equal and opposite reaction."
      slug="newtons-third-law"
      shareParams={params as unknown as Record<string, unknown>}
      challengeContent={challengeContent}

      actionsContent={
        <>
          <button onClick={toggle}>{isRunning ? 'Pause' : 'Play'}</button>
          <button className="secondary" onClick={() => stepForward(0.05)} title="Advance 1 frame (+0.05s)">Step</button>
          <button className="secondary" onClick={reset}>Reset</button>
        </>
      }

      running={isRunning}

      canvasContent={
        <>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px', fontSize: '13px', background: '#f8fafc', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: 'var(--color-force-app)', fontWeight: 600 }}>→ <InlineMath math="\vec{F}_{\text{app}}" /></span>
            <span style={{ color: '#be185d', fontWeight: 600 }}>→ <InlineMath math="\vec{F}_{12}" /></span>
            <span style={{ color: '#0284c7', fontWeight: 600 }}>→ <InlineMath math="\vec{F}_{21}" /></span>
            <span style={{ color: 'var(--color-accel)', fontWeight: 600 }}>→ <InlineMath math="\vec{a}" /></span>
          </div>
          <div className="sim-stage" style={{ ['--sim-stage-h' as string]: '500px' }}>
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
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
            <strong>Interactive:</strong> Even when <InlineMath math="m_1 \gg m_2" />, the pair <InlineMath math="F_{12}" /> and <InlineMath math="F_{21}" /> remain perfectly equal and opposite. Watch the force arrows on the canvas and the Live Dynamics readouts.
          </p>
        </div>
      }

      controlsContent={
        <>
          <ControlRow label={<>Mass <InlineMath math="m_1" /> (kg)</>} name="m1" min="1" max="20" step="0.5" value={params.m1} onChange={handleChange} onReset={() => setParams((p) => ({ ...p, m1: DEFAULT_PARAMS.m1 }))} />
          <ControlRow label={<>Mass <InlineMath math="m_2" /> (kg)</>} name="m2" min="1" max="20" step="0.5" value={params.m2} onChange={handleChange} onReset={() => setParams((p) => ({ ...p, m2: DEFAULT_PARAMS.m2 }))} />
          <ControlRow label={<><InlineMath math="F_{\text{app}}" /> (N)</>} name="F_app" min="-50" max="50" step="1" value={params.F_app} onChange={handleChange} onReset={() => setParams((p) => ({ ...p, F_app: DEFAULT_PARAMS.F_app }))} />
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

const ControlRow = ({ label, name, min, max, step, value, onChange, onReset }: {
  label: React.ReactNode;
  name: string;
  min: string;
  max: string;
  step: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset?: () => void;
}) => (
  <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 68px auto', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
    <label style={{ fontSize: '13px', fontWeight: 500 }}>{label}</label>
    <input type="range" name={name} min={min} max={max} step={step}
      value={value} onChange={onChange} />
    <input type="number" name={name} value={value}
      onChange={onChange} style={{ fontSize: '13px', padding: '4px 6px' }} />
    {onReset && (
      <button
        type="button"
        onClick={onReset}
        title="Reset parameter to default"
        style={{
          padding: '2px 6px',
          fontSize: '11px',
          lineHeight: 1,
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          background: 'transparent',
          cursor: 'pointer',
          color: 'var(--text-muted)',
        }}
      >
        ↺
      </button>
    )}
  </div>
);
