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
    
    const ctx = scaleCanvas(canvas, rect.width, 400);
    const width = rect.width;
    const height = 400;
    
    ctx.clearRect(0, 0, width, height);
    
    const pad = 40;
    const tMin = 0;
    const tMax = params.tMax;
    
    let xMin = x_of_t(tMin);
    let xMax = x_of_t(tMin);
    for(let t=0; t<=tMax; t+=0.1) {
      const x = x_of_t(t);
      if(x < xMin) xMin = x;
      if(x > xMax) xMax = x;
    }
    const xRange = Math.max(1, xMax - xMin);
    xMin -= xRange * 0.1;
    xMax += xRange * 0.1;
    
    const mapX = (t: number) => pad + (t - tMin) / (tMax - tMin) * (width - 2 * pad);
    const mapY = (x: number) => height - pad - (x - xMin) / (xMax - xMin) * (height - 2 * pad);
    
    // Draw Grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(mapX(0), 0); ctx.lineTo(mapX(0), height); ctx.stroke(); // Y axis
    if (xMin <= 0 && xMax >= 0) {
      ctx.beginPath(); ctx.moveTo(0, mapY(0)); ctx.lineTo(width, mapY(0)); ctx.stroke(); // X axis
    }
    
    // Draw curve
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for(let t=0; t<=tMax; t+=0.05) {
      const px = mapX(t);
      const py = mapY(x_of_t(t));
      if (t === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    
    // Secant
    const t2 = params.t1 + params.dt;
    const x1 = x_of_t(params.t1);
    const x2 = x_of_t(t2);
    const secantSlope = (x2 - x1) / params.dt;
    const drawSecant = (t: number) => x1 + secantSlope * (t - params.t1);
    
    ctx.strokeStyle = '#0891b2';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(mapX(0), mapY(drawSecant(0)));
    ctx.lineTo(mapX(tMax), mapY(drawSecant(tMax)));
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Tangent
    const tangentSlope = v_of_t(params.t1);
    const drawTangent = (t: number) => x1 + tangentSlope * (t - params.t1);
    
    ctx.strokeStyle = '#db2777';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mapX(0), mapY(drawTangent(0)));
    ctx.lineTo(mapX(tMax), mapY(drawTangent(tMax)));
    ctx.stroke();
    
    // Points
    ctx.fillStyle = '#059669';
    ctx.beginPath(); ctx.arc(mapX(params.t1), mapY(x1), 6, 0, 2*Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(mapX(t2), mapY(x2), 6, 0, 2*Math.PI); ctx.fill();
    
  }, [params]);

  const secantSlope = (x_of_t(params.t1 + params.dt) - x_of_t(params.t1)) / params.dt;
  const tangentSlope = v_of_t(params.t1);

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
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', fontSize: '14px', background: '#f8fafc' }}>
            <span style={{ color: '#7c3aed', fontWeight: 600 }}>— Position <InlineMath math="x(t)" /></span>
            <span style={{ color: '#0891b2', fontWeight: 600 }}>- - Secant</span>
            <span style={{ color: '#db2777', fontWeight: 600 }}>— Tangent at <InlineMath math="t_1" /></span>
          </div>
          <div style={{ width: '100%', height: '400px', flex: 1 }}>
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
            <strong>Interactive:</strong> Gradually decrease <InlineMath math="\Delta t" /> below and watch the blue secant line converge onto the pink tangent line.
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
            <span style={{ fontWeight: 600, color: '#0891b2' }}>{secantSlope.toFixed(2)} m/s</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="text-muted">Instant Velocity <InlineMath math="v(t_1)" /></span>
            <span style={{ fontWeight: 600, color: '#db2777' }}>{tangentSlope.toFixed(2)} m/s</span>
          </div>
        </>
      }
    />
  );
}
