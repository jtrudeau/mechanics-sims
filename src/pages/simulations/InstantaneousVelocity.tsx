import React, { useState, useRef, useEffect } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import { scaleCanvas } from '../../components/physics/drawUtils';
import { SimulationLayout } from '../../components/layout/SimulationLayout';

export default function InstantaneousVelocity() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [params, setParams] = useState({
    x0: 0,
    v0: 2,
    a: 1,
    t1: 2,
    dt: 1,
    tMax: 8
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParams({ ...params, [e.target.name]: parseFloat(e.target.value) });
  };

  const x_of_t = (t: number) => params.x0 + params.v0 * t + 0.5 * params.a * t * t;
  const v_of_t = (t: number) => params.v0 + params.a * t;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;
    
    const W = rect.width;
    const H = 420;
    const ctx = scaleCanvas(canvas, W, H);
    ctx.clearRect(0, 0, W, H);
    
    const padL = 60;
    const padR = 20;
    const padT = 20;
    const padB = 50;
    const tMin = 0;
    const tMax = params.tMax;

    let xMin = x_of_t(tMin);
    let xMax = x_of_t(tMin);
    for (let t = 0; t <= tMax; t += 0.1) {
      const x = x_of_t(t);
      if (x < xMin) xMin = x;
      if (x > xMax) xMax = x;
    }
    const xRange = Math.max(1, xMax - xMin);
    xMin -= xRange * 0.12;
    xMax += xRange * 0.12;

    const mapT = (t: number) => padL + (t - tMin) / (tMax - tMin) * (W - padL - padR);
    const mapX = (x: number) => H - padB - (x - xMin) / (xMax - xMin) * (H - padT - padB);

    // --- Grid ---
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    const numTTicks = Math.min(8, Math.floor(tMax));
    for (let i = 0; i <= numTTicks; i++) {
      const tVal = tMin + (i / numTTicks) * (tMax - tMin);
      const px = mapT(tVal);
      ctx.beginPath(); ctx.moveTo(px, padT); ctx.lineTo(px, H - padB); ctx.stroke();
    }
    const numXTicks = 5;
    for (let i = 0; i <= numXTicks; i++) {
      const xVal = xMin + (i / numXTicks) * (xMax - xMin);
      const py = mapX(xVal);
      ctx.beginPath(); ctx.moveTo(padL, py); ctx.lineTo(W - padR, py); ctx.stroke();
    }

    // --- Axes ---
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, H - padB); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(padL, H - padB); ctx.lineTo(W - padR, H - padB); ctx.stroke();

    // Axis tick labels
    ctx.fillStyle = '#64748b';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i <= numTTicks; i++) {
      const tVal = tMin + (i / numTTicks) * (tMax - tMin);
      const px = mapT(tVal);
      ctx.fillText(tVal.toFixed(1), px, H - padB + 6);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= numXTicks; i++) {
      const xVal = xMin + (i / numXTicks) * (xMax - xMin);
      const py = mapX(xVal);
      ctx.fillText(xVal.toFixed(1), padL - 6, py);
    }

    // Axis titles
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('t  (s)', W / 2, H - 4);
    ctx.save();
    ctx.translate(14, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textBaseline = 'top';
    ctx.fillText('x  (m)', 0, 0);
    ctx.restore();

    // --- Position curve ---
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let t = 0; t <= tMax; t += 0.02) {
      const px = mapT(t);
      const py = mapX(x_of_t(t));
      if (t === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // --- Secant line ---
    const t2 = params.t1 + params.dt;
    const x1 = x_of_t(params.t1);
    const x2 = x_of_t(t2);
    const secantSlope = params.dt !== 0 ? (x2 - x1) / params.dt : 0;
    const drawSecant = (t: number) => x1 + secantSlope * (t - params.t1);

    ctx.strokeStyle = '#0891b2';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(mapT(tMin), mapX(drawSecant(tMin)));
    ctx.lineTo(mapT(tMax), mapX(drawSecant(tMax)));
    ctx.stroke();
    ctx.setLineDash([]);

    // --- Tangent line ---
    const tangentSlope = v_of_t(params.t1);
    const drawTangent = (t: number) => x1 + tangentSlope * (t - params.t1);

    ctx.strokeStyle = '#db2777';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(mapT(tMin), mapX(drawTangent(tMin)));
    ctx.lineTo(mapT(tMax), mapX(drawTangent(tMax)));
    ctx.stroke();

    // --- Δt / Δx triangle on the secant ---
    const triT1 = params.t1;
    const triT2 = t2;
    const triX1 = x1;
    const triX2 = x2;
    const ptA = { x: mapT(triT1), y: mapX(triX1) };
    const ptB = { x: mapT(triT2), y: mapX(triX1) }; // same y as A (Δt leg)
    const ptC = { x: mapT(triT2), y: mapX(triX2) }; // same x as B (Δx leg)

    ctx.strokeStyle = '#0891b2';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(ptA.x, ptA.y);
    ctx.lineTo(ptB.x, ptB.y);
    ctx.lineTo(ptC.x, ptC.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Right-angle box
    const box = 8;
    ctx.strokeStyle = '#0891b2';
    ctx.lineWidth = 1;
    ctx.strokeRect(ptB.x - box, ptB.y - box * Math.sign(triX2 - triX1), box, box * Math.sign(triX2 - triX1));

    // Triangle labels
    ctx.font = 'italic 12px "STIX Two Text", serif';
    ctx.fillStyle = '#0891b2';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Δt', (ptA.x + ptB.x) / 2, ptA.y + 4);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Δx', ptB.x + 4, (ptB.y + ptC.y) / 2);

    // --- Drop lines from t1 and t2 to curve ---
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(mapT(params.t1), H - padB); ctx.lineTo(mapT(params.t1), mapX(x1)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mapT(t2), H - padB); ctx.lineTo(mapT(t2), mapX(x2)); ctx.stroke();
    ctx.setLineDash([]);

    // --- Points ---
    const pts = [
      { t: params.t1, x: x1, label: 't₁' },
      { t: t2, x: x2, label: 't₂' },
    ];
    pts.forEach(({ t, x, label }) => {
      const px = mapT(t);
      const py = mapX(x);
      ctx.fillStyle = '#059669';
      ctx.beginPath(); ctx.arc(px, py, 6, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, px + 8, py - 4);
    });

  }, [params]);

  const secantSlope = params.dt !== 0
    ? (x_of_t(params.t1 + params.dt) - x_of_t(params.t1)) / params.dt
    : 0;
  const tangentSlope = v_of_t(params.t1);
  const convergencePct = tangentSlope !== 0
    ? (1 - Math.abs(secantSlope - tangentSlope) / Math.abs(tangentSlope)) * 100
    : 100;

  const ControlRow = ({ label, name, min, max, step }: any) => (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 70px', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
      <label style={{ fontSize: '13px', fontWeight: 500 }}>{label}</label>
      <input type="range" name={name} min={min} max={max} step={step} value={params[name as keyof typeof params]} onChange={handleChange} />
      <input type="number" name={name} value={params[name as keyof typeof params]} onChange={handleChange} style={{ fontSize: '13px', padding: '6px' }} />
    </div>
  );

  return (
    <SimulationLayout
      title="Instantaneous Velocity via Tangent"
      description="1D Kinematics - The geometric relationship between secant lines, tangent lines, and limits."
      
      canvasContent={
        <>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', fontSize: '13px', background: '#f8fafc', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: '#7c3aed', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="28" height="10"><path d="M0 5 Q7 0 14 5 Q21 10 28 5" stroke="#7c3aed" strokeWidth="2.5" fill="none"/></svg>
              Position <InlineMath math="x(t)" />
            </span>
            <span style={{ color: '#0891b2', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="28" height="10"><line x1="0" y1="5" x2="28" y2="5" stroke="#0891b2" strokeWidth="2" strokeDasharray="5,4"/></svg>
              Secant (avg velocity)
            </span>
            <span style={{ color: '#db2777', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="28" height="10"><line x1="0" y1="5" x2="28" y2="5" stroke="#db2777" strokeWidth="2.5"/></svg>
              Tangent at <InlineMath math="t_1" />
            </span>
            <span style={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12"><circle cx="6" cy="6" r="5" fill="#059669"/></svg>
              Points
            </span>
          </div>
          <div style={{ width: '100%', height: '420px' }}>
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }}></canvas>
          </div>
        </>
      }

      theoryContent={
        <div style={{ padding: '16px', fontSize: '15px', lineHeight: '1.6' }}>
          <p>
            Average velocity over a time interval <InlineMath math="\Delta t" /> is given by the slope of the <strong>secant line</strong> between two points on the position-time graph:
          </p>
          <BlockMath math="v_{\text{avg}} = \frac{\Delta x}{\Delta t} = \frac{x(t_1 + \Delta t) - x(t_1)}{\Delta t}" />
          <p>
            As the time interval shrinks to zero, this secant line approaches the <strong>tangent line</strong> at <InlineMath math="t_1" />. 
            The slope of this tangent line is the instantaneous velocity:
          </p>
          <BlockMath math="v = \lim_{\Delta t \to 0} \frac{\Delta x}{\Delta t} = \frac{dx}{dt}" />
          <p>
            <strong>Interactive:</strong> Gradually decrease <InlineMath math="\Delta t" /> below and watch the blue secant line converge onto the pink tangent line. The <strong>Δt–Δx triangle</strong> on the graph shows the rise-over-run of the secant.
          </p>
        </div>
      }

      controlsContent={
        <>
          <ControlRow label={<><InlineMath math="x_0" /> (m)</>} name="x0" min="-20" max="20" step="0.1" />
          <ControlRow label={<><InlineMath math="v_0" /> (m/s)</>} name="v0" min="-10" max="10" step="0.1" />
          <ControlRow label={<><InlineMath math="a" /> (m/s²)</>} name="a" min="-5" max="5" step="0.1" />
          <ControlRow label={<><InlineMath math="t_1" /> (s)</>} name="t1" min="0" max="20" step="0.01" />
          <ControlRow label={<><InlineMath math="\Delta t" /> (s)</>} name="dt" min="0.001" max="10" step="0.001" />
          <ControlRow label={<><InlineMath math="t_{\text{max}}" /> (s)</>} name="tMax" min="1" max="30" step="0.5" />
        </>
      }

      metricsContent={
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            <span className="text-muted">Secant Slope <InlineMath math="\frac{\Delta x}{\Delta t}" /></span>
            <span style={{ fontWeight: 600, color: '#0891b2' }}>{secantSlope.toFixed(3)} m/s</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            <span className="text-muted">Instant Velocity <InlineMath math="v(t_1)" /></span>
            <span style={{ fontWeight: 600, color: '#db2777' }}>{tangentSlope.toFixed(3)} m/s</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            <span className="text-muted"><InlineMath math="x(t_1)" /></span>
            <span style={{ fontWeight: 600 }}>{x_of_t(params.t1).toFixed(3)} m</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-muted">Convergence</span>
            <span style={{
              fontWeight: 700,
              fontSize: '13px',
              padding: '2px 10px',
              borderRadius: 99,
              background: convergencePct > 99 ? '#dcfce7' : convergencePct > 90 ? '#fef9c3' : '#fee2e2',
              color: convergencePct > 99 ? '#166534' : convergencePct > 90 ? '#854d0e' : '#991b1b'
            }}>
              {Math.max(0, convergencePct).toFixed(1)}%
            </span>
          </div>
        </>
      }
    />
  );
}
