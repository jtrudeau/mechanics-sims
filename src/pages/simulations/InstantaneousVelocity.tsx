import React, { useState, useRef, useEffect } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import { scaleCanvas, drawMixedText } from '../../components/physics/drawUtils';
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

    // Padding: extra left room for y-axis label, extra bottom for x-axis label
    const padL = 72;
    const padR = 22;
    const padT = 24;
    const padB = 52;

    const ctx = scaleCanvas(canvas, W, H);
    ctx.clearRect(0, 0, W, H);

    const tMin = 0;
    const tMax = params.tMax;

    // Auto-range y
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

    const chartH = H - padT - padB;

    // ── Grid ──────────────────────────────────────────────────────
    ctx.strokeStyle = '#e8edf3';
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

    // ── Axes ──────────────────────────────────────────────────────
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, H - padB); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(padL, H - padB); ctx.lineTo(W - padR, H - padB); ctx.stroke();

    // ── Tick labels ───────────────────────────────────────────────
    ctx.fillStyle = '#64748b';

    // T-axis (horizontal) ticks
    for (let i = 0; i <= numTTicks; i++) {
      const tVal = tMin + (i / numTTicks) * (tMax - tMin);
      const px = mapT(tVal);
      drawMixedText(ctx, px, H - padB + 14, [{ text: tVal.toFixed(1) }], { fontSize: 11, color: '#64748b', align: 'center' });
    }

    // X-axis (vertical) ticks
    for (let i = 0; i <= numXTicks; i++) {
      const xVal = xMin + (i / numXTicks) * (xMax - xMin);
      const py = mapX(xVal);
      drawMixedText(ctx, padL - 7, py, [{ text: xVal.toFixed(1) }], { fontSize: 11, color: '#64748b', align: 'right' });
    }

    // ── Axis titles ───────────────────────────────────────────────
    // X-axis title:  t  (s)
    drawMixedText(
      ctx,
      padL + (W - padL - padR) / 2,
      H - 10,
      [{ text: 't', italic: true }, { text: ' (s)' }],
      { fontSize: 13, color: '#334155', align: 'center' }
    );

    // Y-axis title:  x  (m)  — rotated
    ctx.save();
    ctx.translate(14, padT + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    drawMixedText(
      ctx,
      0, 0,
      [{ text: 'x', italic: true }, { text: ' (m)' }],
      { fontSize: 13, color: '#334155', align: 'center' }
    );
    ctx.restore();

    // ── Position curve ────────────────────────────────────────────
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

    // ── Secant ────────────────────────────────────────────────────
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

    // ── Tangent ───────────────────────────────────────────────────
    const tangentSlope = v_of_t(params.t1);
    const drawTangent = (t: number) => x1 + tangentSlope * (t - params.t1);

    ctx.strokeStyle = '#db2777';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(mapT(tMin), mapX(drawTangent(tMin)));
    ctx.lineTo(mapT(tMax), mapX(drawTangent(tMax)));
    ctx.stroke();

    // ── Δt / Δx triangle on the secant ───────────────────────────
    const ptA = { x: mapT(params.t1), y: mapX(x1) };
    const ptB = { x: mapT(t2),        y: mapX(x1) };
    const ptC = { x: mapT(t2),        y: mapX(x2) };

    // Make sure A is to the left of B
    const triDir = t2 > params.t1 ? 1 : -1;
    const xGoesUp = x2 > x1;

    ctx.strokeStyle = '#0891b2';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(ptA.x, ptA.y);
    ctx.lineTo(ptB.x, ptB.y);
    ctx.lineTo(ptC.x, ptC.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Right-angle marker at ptB
    const box = 8;
    const bxDir = triDir > 0 ? -1 : 1;
    const byDir = xGoesUp ? 1 : -1;
    ctx.strokeStyle = '#0891b2';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ptB.x + bxDir * box, ptB.y);
    ctx.lineTo(ptB.x + bxDir * box, ptB.y + byDir * box);
    ctx.lineTo(ptB.x, ptB.y + byDir * box);
    ctx.stroke();

    // Δt label — centred on the horizontal leg, offset below (or above based on direction)
    const dtLabelY = ptA.y + (xGoesUp ? 18 : -10);
    drawMixedText(
      ctx,
      (ptA.x + ptB.x) / 2, dtLabelY,
      [{ text: 'Δ' }, { text: 't', italic: true }],
      { fontSize: 12, color: '#0891b2', align: 'center' }
    );

    // Δx label — centred on the vertical leg, offset to the right (or left)
    const dxLabelX = ptB.x + (triDir > 0 ? 20 : -20);
    drawMixedText(
      ctx,
      dxLabelX, (ptB.y + ptC.y) / 2,
      [{ text: 'Δ' }, { text: 'x', italic: true }],
      { fontSize: 12, color: '#0891b2', align: triDir > 0 ? 'left' : 'right' }
    );

    // ── Drop lines from t₁ and t₂ ─────────────────────────────────
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(mapT(params.t1), H - padB); ctx.lineTo(mapT(params.t1), mapX(x1)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mapT(t2), H - padB); ctx.lineTo(mapT(t2), mapX(x2)); ctx.stroke();
    ctx.setLineDash([]);

    // ── Points ────────────────────────────────────────────────────
    const pointPairs = [
      { t: params.t1, x: x1, sub: '₁' },
      { t: t2,        x: x2, sub: '₂' },
    ];
    for (const { t, x, sub } of pointPairs) {
      const px = mapT(t);
      const py = mapX(x);
      ctx.fillStyle = '#059669';
      ctx.beginPath(); ctx.arc(px, py, 6, 0, 2 * Math.PI); ctx.fill();

      // Label: t₁ or t₂ — offset above and to the right
      const labelX = px + 10;
      const labelY = py - 10;
      drawMixedText(
        ctx,
        labelX, labelY,
        [{ text: 't', italic: true }, { text: sub }],
        { fontSize: 12, color: '#1e293b', align: 'left' }
      );
    }

  }, [params]);

  const secantSlope = params.dt !== 0
    ? (x_of_t(params.t1 + params.dt) - x_of_t(params.t1)) / params.dt
    : 0;
  const tangentSlope = v_of_t(params.t1);
  const convergencePct = tangentSlope !== 0
    ? (1 - Math.abs(secantSlope - tangentSlope) / Math.abs(tangentSlope)) * 100
    : 100;

  const ControlRow = ({ label, name, min, max, step }: any) => (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 70px', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
      <label style={{ fontSize: '13px', fontWeight: 500 }}>{label}</label>
      <input type="range" name={name} min={min} max={max} step={step}
        value={params[name as keyof typeof params]}
        onChange={handleChange} />
      <input type="number" name={name} value={params[name as keyof typeof params]}
        onChange={handleChange} style={{ fontSize: '13px', padding: '4px 6px' }} />
    </div>
  );

  return (
    <SimulationLayout
      title="Instantaneous Velocity via Tangent"
      description="1D Kinematics — The geometric relationship between secant lines, tangent lines, and limits."

      canvasContent={
        <>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', fontSize: '13px', background: '#f8fafc', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: '#7c3aed', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="28" height="10"><path d="M0 5 Q7 0 14 5 Q21 10 28 5" stroke="#7c3aed" strokeWidth="2.5" fill="none" /></svg>
              Position <InlineMath math="x(t)" />
            </span>
            <span style={{ color: '#0891b2', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="28" height="10"><line x1="0" y1="5" x2="28" y2="5" stroke="#0891b2" strokeWidth="2" strokeDasharray="5,4" /></svg>
              Secant (avg vel)
            </span>
            <span style={{ color: '#db2777', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="28" height="10"><line x1="0" y1="5" x2="28" y2="5" stroke="#db2777" strokeWidth="2.5" /></svg>
              Tangent at <InlineMath math="t_1" />
            </span>
            <span style={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="12" height="12"><circle cx="6" cy="6" r="5" fill="#059669" /></svg>
              Points
            </span>
          </div>
          <div style={{ width: '100%', height: '420px' }}>
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
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
            <strong>Interactive:</strong> Decrease <InlineMath math="\Delta t" /> and watch the blue secant converge onto the pink tangent. The <strong>Δ<em>t</em>–Δ<em>x</em> triangle</strong> shows the rise-over-run of the secant.
          </p>
        </div>
      }

      controlsContent={
        <>
          <ControlRow label={<><InlineMath math="x_0" /> (m)</>}           name="x0"   min="-20"  max="20"  step="0.1"   />
          <ControlRow label={<><InlineMath math="v_0" /> (m/s)</>}         name="v0"   min="-10"  max="10"  step="0.1"   />
          <ControlRow label={<><InlineMath math="a" /> (m/s²)</>}          name="a"    min="-5"   max="5"   step="0.1"   />
          <ControlRow label={<><InlineMath math="t_1" /> (s)</>}           name="t1"   min="0"    max="20"  step="0.05"  />
          <ControlRow label={<><InlineMath math="\Delta t" /> (s)</>}      name="dt"   min="0.01" max="10"  step="0.01"  />
          <ControlRow label={<><InlineMath math="t_{\text{max}}" /> (s)</> } name="tMax" min="1"    max="30"  step="0.5"   />
        </>
      }

      metricsContent={
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            <span className="text-muted">Secant slope <InlineMath math="\Delta x / \Delta t" /></span>
            <span style={{ fontWeight: 600, color: '#0891b2' }}>{secantSlope.toFixed(3)} m/s</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            <span className="text-muted">Instant vel <InlineMath math="v(t_1)" /></span>
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
              color:      convergencePct > 99 ? '#166534' : convergencePct > 90 ? '#854d0e' : '#991b1b',
            }}>
              {Math.max(0, convergencePct).toFixed(1)}%
            </span>
          </div>
        </>
      }
    />
  );
}
