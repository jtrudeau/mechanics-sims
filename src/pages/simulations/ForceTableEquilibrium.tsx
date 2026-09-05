import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BlockMath, InlineMath } from 'react-katex';
import { drawArrow, drawCoordinateGrid, drawMixedText, fitStage } from '../../components/physics/drawUtils';
import { SimulationLayout } from '../../components/layout/SimulationLayout';
import { useCanvasStage } from '../../hooks/useCanvasStage';
import { PredictionGate } from '../../components/pedagogy/PredictionGate';
import { predictionChallenges } from '../../content/predictionChallenges';

type ForceConfig = {
  magnitude: number;
  angleDeg: number;
};

type ForceVector = ForceConfig & {
  index: number;
  angleRad: number;
  fx: number;
  fy: number;
  color: string;
};

type ForceSummary = {
  sumFx: number;
  sumFy: number;
  resultantMagnitude: number;
  resultantAngleDeg: number;
  equilibrantAngleDeg: number;
};

const DEFAULT_ACTIVE_COUNT = 3;
const EPSILON_FORCE = 0.1;
const SCENE_HEIGHT = 500;

const FORCE_COLORS = ['#1d4ed8', '#7c3aed', '#0f766e', '#b45309'];
const RESULTANT_COLOR = '#dc2626';
const EQUILIBRANT_COLOR = '#15803d';

const DEFAULT_FORCES: ForceConfig[] = [
  { magnitude: 10.0, angleDeg: 0 },
  { magnitude: 8.0, angleDeg: 125 },
  { magnitude: 5.0, angleDeg: 250 },
  { magnitude: 4.0, angleDeg: 300 }
];

const createDefaultForces = () => DEFAULT_FORCES.map(force => ({ ...force }));

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const degToRad = (degrees: number) => (degrees * Math.PI) / 180;
const radToDeg = (radians: number) => (radians * 180) / Math.PI;
const normalizeDeg = (degrees: number) => ((degrees % 360) + 360) % 360;

const parseClampedNumber = (rawValue: string, fallback: number, min: number, max: number) => {
  const parsed = Number.parseFloat(rawValue);
  return Number.isFinite(parsed) ? clamp(parsed, min, max) : fallback;
};

const formatForce = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)} N`;
const formatMagnitude = (value: number) => `${value.toFixed(2)} N`;
const formatAngle = (magnitude: number, angleDeg: number) =>
  magnitude < EPSILON_FORCE ? '--' : `${normalizeDeg(angleDeg).toFixed(1)} deg`;

export default function ForceTableEquilibrium() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageGen = useCanvasStage(canvasRef);

  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => setFontsReady(true));
    }
  }, []);

  const [searchParams] = useSearchParams();
  const [activeCount, setActiveCount] = useState(DEFAULT_ACTIVE_COUNT);
  const [forces, setForces] = useState<ForceConfig[]>(createDefaultForces);
  const [showResultant, setShowResultant] = useState(true);
  const [showEquilibrant, setShowEquilibrant] = useState(true);
  const [showComponents, setShowComponents] = useState(true);

  const applyParams = useCallback((sp: URLSearchParams) => {
    const ac = sp.get('activeCount');
    if (ac) setActiveCount(clamp(parseInt(ac, 10), 2, 4));
    setForces((prev) => {
      const next = [...prev];
      for (let i = 0; i < 4; i++) {
        const mag = sp.get(`f${i + 1}`);
        const ang = sp.get(`a${i + 1}`);
        if (mag !== null && Number.isFinite(Number(mag))) {
          next[i] = { ...next[i], magnitude: Number(mag) };
        }
        if (ang !== null && Number.isFinite(Number(ang))) {
          next[i] = { ...next[i], angleDeg: Number(ang) };
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    applyParams(searchParams);
  }, [searchParams, applyParams]);

  const shareParams = useMemo(() => {
    const p: Record<string, unknown> = { activeCount };
    forces.slice(0, activeCount).forEach((f, i) => {
      p[`f${i + 1}`] = f.magnitude;
      p[`a${i + 1}`] = f.angleDeg;
    });
    return p;
  }, [activeCount, forces]);

  const handleApplyChallenge = useCallback((setup: Record<string, unknown>) => {
    if (setup.activeCount) setActiveCount(Number(setup.activeCount));
    setForces((prev) => {
      const next = [...prev];
      for (let i = 0; i < 4; i++) {
        if (setup[`f${i + 1}`] !== undefined) {
          next[i] = { ...next[i], magnitude: Number(setup[`f${i + 1}`]) };
        }
        if (setup[`a${i + 1}`] !== undefined) {
          next[i] = { ...next[i], angleDeg: Number(setup[`a${i + 1}`]) };
        }
      }
      return next;
    });
  }, []);

  const challengeContent = (
    <PredictionGate
      challenges={predictionChallenges['force-table-equilibrium']}
      onApplySetup={handleApplyChallenge}
    />
  );

  const activeForces = useMemo<ForceVector[]>(
    () =>
      forces.slice(0, activeCount).map((force, index) => {
        const angleRad = degToRad(force.angleDeg);
        return {
          ...force,
          index,
          angleRad,
          fx: force.magnitude * Math.cos(angleRad),
          fy: force.magnitude * Math.sin(angleRad),
          color: FORCE_COLORS[index]
        };
      }),
    [activeCount, forces]
  );

  const summary = useMemo<ForceSummary>(() => {
    const sumFx = activeForces.reduce((sum, force) => sum + force.fx, 0);
    const sumFy = activeForces.reduce((sum, force) => sum + force.fy, 0);
    const resultantMagnitude = Math.hypot(sumFx, sumFy);
    const resultantAngleDeg =
      resultantMagnitude < EPSILON_FORCE ? 0 : normalizeDeg(radToDeg(Math.atan2(sumFy, sumFx)));

    return {
      sumFx,
      sumFy,
      resultantMagnitude,
      resultantAngleDeg,
      equilibrantAngleDeg: normalizeDeg(resultantAngleDeg + 180)
    };
  }, [activeForces]);

  const isEquilibrium = summary.resultantMagnitude < EPSILON_FORCE;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { ctx, w: width, h: height, s } = fitStage(canvas, SCENE_HEIGHT);

    drawForceTableScene(ctx, width, height, activeForces, summary, {
      showComponents,
      showEquilibrant,
      showResultant,
      s
    });
  }, [activeForces, fontsReady, showComponents, showEquilibrant, showResultant, summary, stageGen]);

  const updateForce = (index: number, field: keyof ForceConfig, rawValue: string) => {
    setForces(prev =>
      prev.map((force, forceIndex) => {
        if (forceIndex !== index) return force;

        const min = field === 'magnitude' ? 0 : 0;
        const max = field === 'magnitude' ? 20 : 360;
        const nextValue = parseClampedNumber(rawValue, force[field], min, max);
        return { ...force, [field]: nextValue };
      })
    );
  };

  const reset = () => {
    setActiveCount(DEFAULT_ACTIVE_COUNT);
    setForces(createDefaultForces());
    setShowResultant(true);
    setShowEquilibrant(true);
    setShowComponents(true);
  };

  return (
    <SimulationLayout
      title="Static Equilibrium: Force Table"
      description="Vector Components - Resultants, equilibrants, and zero net force."
      slug="force-table-equilibrium"
      shareParams={shareParams}
      challengeContent={challengeContent}
      actionsContent={<button className="secondary" onClick={reset}>Reset</button>}
      canvasContent={
        <>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px', fontSize: '13px', background: '#f8fafc', flexWrap: 'wrap', alignItems: 'center' }}>
            {activeForces.map(force => (
              <LegendItem key={force.index} color={force.color} label={<InlineMath math={`\\vec{F}_${force.index + 1}`} />} />
            ))}
            {showResultant && <LegendItem color={RESULTANT_COLOR} label={<InlineMath math="\vec{R}" />} />}
            {showEquilibrant && <LegendItem color={EQUILIBRANT_COLOR} label={<InlineMath math="\vec{E}=-\vec{R}" />} dashed />}
            <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: '12px', padding: '3px 12px', borderRadius: 99, background: isEquilibrium ? '#dcfce7' : '#fee2e2', color: isEquilibrium ? '#166534' : '#991b1b' }}>
              {isEquilibrium ? 'EQUILIBRIUM' : 'NET FORCE'}
            </span>
          </div>
          <div className="sim-stage" style={{ ['--sim-stage-h' as string]: `${SCENE_HEIGHT}px` }}>
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
          </div>
        </>
      }
      theoryContent={
        <div style={{ padding: '16px', fontSize: '15px', lineHeight: '1.6' }}>
          <p>
            Each applied force is resolved into rectangular components using the force-table convention that angles are measured counterclockwise from the positive x-axis.
          </p>
          <BlockMath math="F_{x,i}=F_i\cos(\theta_i)\qquad F_{y,i}=F_i\sin(\theta_i)" />
          <p>
            The resultant is the vector sum of all active applied forces. Its direction is computed with <InlineMath math="\operatorname{atan2}" /> so quadrant information is preserved.
          </p>
          <BlockMath math="\sum F_x=\sum_i F_{x,i}\qquad \sum F_y=\sum_i F_{y,i}" />
          <BlockMath math="R=\sqrt{(\sum F_x)^2+(\sum F_y)^2}\qquad \theta_R=\operatorname{atan2}(\sum F_y,\sum F_x)" />
          <p>
            The equilibrant has the same magnitude as the resultant and points in the opposite direction:
          </p>
          <BlockMath math="F_{\text{equilibrant}}=R\qquad \theta_E=\theta_R+180^\circ" />
          <p>
            Static equilibrium means the net force is zero, not that no forces are present. Multiple nonzero forces can balance when their components sum to zero.
          </p>
          <BlockMath math="\sum F_x=0\qquad \sum F_y=0\qquad R=0" />
        </div>
      }
      controlsContent={
        <>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Active forces</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px' }}>
              {[2, 3, 4].map(count => (
                <button
                  key={count}
                  type="button"
                  className={activeCount === count ? undefined : 'secondary'}
                  onClick={() => setActiveCount(count)}
                  style={{
                    padding: '7px 8px',
                    background: activeCount === count ? '#1d4ed8' : undefined,
                    color: activeCount === count ? '#ffffff' : undefined
                  }}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {forces.slice(0, activeCount).map((force, index) => (
            <div key={index} style={{ marginBottom: '12px', paddingBottom: '10px', borderBottom: index === activeCount - 1 ? 'none' : '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: FORCE_COLORS[index] }}>
                <span style={{ width: '14px', height: '3px', background: FORCE_COLORS[index], borderRadius: '2px' }} />
                Force {index + 1}
              </div>
              <ControlRow
                label={<><InlineMath math={`F_${index + 1}`} /> (N)</>}
                min={0}
                max={20}
                step={0.5}
                value={force.magnitude}
                onChange={value => updateForce(index, 'magnitude', value)}
              />
              <ControlRow
                label={<><InlineMath math={`\\theta_${index + 1}`} /> (deg)</>}
                min={0}
                max={360}
                step={1}
                value={force.angleDeg}
                onChange={value => updateForce(index, 'angleDeg', value)}
              />
            </div>
          ))}

          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'grid', gap: '8px' }}>
            <ToggleRow label="Show resultant" checked={showResultant} onChange={setShowResultant} />
            <ToggleRow label="Show equilibrant" checked={showEquilibrant} onChange={setShowEquilibrant} />
            <ToggleRow label="Show components" checked={showComponents} onChange={setShowComponents} />
          </div>
        </>
      }
      metricsContent={
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '12px' }}>
            <thead>
              <tr style={{ color: '#475569', textAlign: 'right' }}>
                <th style={{ textAlign: 'left', fontWeight: 600, padding: '0 6px 6px 0' }}>Force</th>
                <th style={{ fontWeight: 600, padding: '0 6px 6px' }}><InlineMath math="F_x" /></th>
                <th style={{ fontWeight: 600, padding: '0 0 6px 6px' }}><InlineMath math="F_y" /></th>
              </tr>
            </thead>
            <tbody>
              {activeForces.map(force => (
                <tr key={force.index} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <td style={{ textAlign: 'left', padding: '7px 6px 7px 0', color: force.color, fontWeight: 700 }}>
                    <InlineMath math={`\\vec{F}_${force.index + 1}`} />
                  </td>
                  <td style={{ textAlign: 'right', padding: '7px 6px' }}>{formatForce(force.fx)}</td>
                  <td style={{ textAlign: 'right', padding: '7px 0 7px 6px' }}>{formatForce(force.fy)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <MetricRow label={<><InlineMath math="\sum F_x" /></>} value={formatForce(summary.sumFx)} />
          <MetricRow label={<><InlineMath math="\sum F_y" /></>} value={formatForce(summary.sumFy)} />
          <MetricRow label={<>Resultant <InlineMath math="R" /></>} value={formatMagnitude(summary.resultantMagnitude)} color={RESULTANT_COLOR} />
          <MetricRow label={<><InlineMath math="\theta_R" /></>} value={formatAngle(summary.resultantMagnitude, summary.resultantAngleDeg)} />
          <MetricRow label={<>Equilibrant <InlineMath math="F_E" /></>} value={formatMagnitude(summary.resultantMagnitude)} color={EQUILIBRANT_COLOR} />
          <MetricRow label={<><InlineMath math="\theta_E" /></>} value={formatAngle(summary.resultantMagnitude, summary.equilibrantAngleDeg)} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
            <span className="text-muted">Status</span>
            <span style={{ fontWeight: 700, color: isEquilibrium ? '#166534' : '#991b1b' }}>
              {isEquilibrium ? 'Balanced' : 'Unbalanced'}
            </span>
          </div>
        </>
      }
    />
  );
}

function drawForceTableScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  forces: ForceVector[],
  summary: ForceSummary,
  options: {
    showComponents: boolean;
    showEquilibrant: boolean;
    showResultant: boolean;
    s: number;
  }
) {
  const s = options.s;
  drawCoordinateGrid(ctx, width, height, {
    backgroundColor: '#fcfdfd',
    gridColor: '#e2e8f0',
    subdivisionColor: '#f8fafc'
  });

  const cx = width / 2;
  const cy = height / 2 + 12;
  const tableRadius = Math.max(130, Math.min(width * 0.44, height * 0.42));
  const maxApplied = forces.reduce((max, force) => Math.max(max, force.magnitude), 0);
  const maxVector = Math.max(maxApplied, summary.resultantMagnitude, 1);
  const forceScale = (tableRadius - 34 * s) / maxVector;

  drawTable(ctx, cx, cy, tableRadius, s);

  if (options.showComponents) {
    for (const force of forces) {
      drawComponentProjection(ctx, cx, cy, forceScale, force);
    }
  }

  for (const force of forces) {
    drawForceVector(ctx, cx, cy, forceScale, force, width, height, s);
  }

  if (options.showResultant) {
    drawSummaryVector(ctx, cx, cy, forceScale, summary.resultantMagnitude, summary.resultantAngleDeg, RESULTANT_COLOR, [{ text: 'R', italic: true, vector: true }], width, height, false, s);
  }

  if (options.showEquilibrant) {
    drawSummaryVector(ctx, cx, cy, forceScale, summary.resultantMagnitude, summary.equilibrantAngleDeg, EQUILIBRANT_COLOR, [{ text: 'E', italic: true, vector: true }], width, height, true, s);
  }

  drawCentralRing(ctx, cx, cy, summary, s);

  if (summary.resultantMagnitude < EPSILON_FORCE && (options.showResultant || options.showEquilibrant)) {
    drawMixedText(ctx, cx, cy - tableRadius - 22 * s,
      [{ text: 'R', italic: true, vector: true }, { text: ' = 0 N' }],
      {
        fontSize: Math.round(16 * s),
        color: '#166534',
        align: 'center',
        baseline: 'middle',
        halo: true
      }
    );
  }
}

function drawTable(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, s: number) {
  ctx.save();

  ctx.fillStyle = 'rgba(15, 23, 42, 0.05)';
  ctx.beginPath();
  ctx.arc(cx + 4, cy + 5, radius + 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  for (const fraction of [0.25, 0.5, 0.75]) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius * fraction, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.25;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(cx - radius, cy);
  ctx.lineTo(cx + radius, cy);
  ctx.moveTo(cx, cy - radius);
  ctx.lineTo(cx, cy + radius);
  ctx.stroke();
  ctx.setLineDash([]);

  for (let deg = 0; deg < 360; deg += 15) {
    const angle = -degToRad(deg);
    const tickLength = deg % 30 === 0 ? 10 : 5;
    const outerX = cx + radius * Math.cos(angle);
    const outerY = cy + radius * Math.sin(angle);
    const innerX = cx + (radius - tickLength) * Math.cos(angle);
    const innerY = cy + (radius - tickLength) * Math.sin(angle);

    ctx.strokeStyle = deg % 30 === 0 ? '#475569' : '#cbd5e1';
    ctx.lineWidth = deg % 30 === 0 ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(innerX, innerY);
    ctx.lineTo(outerX, outerY);
    ctx.stroke();
  }

  ctx.fillStyle = '#475569';
  ctx.font = `${Math.round(11 * s)}px "Inter", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const deg of [0, 90, 180, 270]) {
    const angle = -degToRad(deg);
    drawMixedText(ctx, cx + (radius + 22 * s) * Math.cos(angle), cy + (radius + 22 * s) * Math.sin(angle),
      [{ text: `${deg}°` }],
      { fontSize: Math.round(11 * s), color: '#475569', align: 'center', baseline: 'middle', halo: true });
  }

  drawMixedText(ctx, cx + radius - 12, cy + 16,
    [{ text: '+' }, { text: 'x', italic: true }],
    { fontSize: Math.round(12 * s), color: '#475569', align: 'right', halo: true });
  drawMixedText(ctx, cx + 16, cy - radius + 12,
    [{ text: '+' }, { text: 'y', italic: true }],
    { fontSize: Math.round(12 * s), color: '#475569', align: 'left', halo: true });

  ctx.restore();
}

function drawComponentProjection(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  forceScale: number,
  force: ForceVector
) {
  if (force.magnitude < EPSILON_FORCE) return;

  const xEnd = cx + force.fx * forceScale;
  const yEnd = cy - force.fy * forceScale;
  const fxLength = Math.abs(force.fx) * forceScale;
  const fyLength = Math.abs(force.fy) * forceScale;

  ctx.save();
  ctx.strokeStyle = force.color;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1.25;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(xEnd, cy);
  ctx.lineTo(xEnd, yEnd);
  ctx.stroke();
  ctx.restore();

  if (fxLength > 8) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    drawArrow(ctx, cx, cy, fxLength, force.fx >= 0 ? 0 : Math.PI, force.color, 2);
    ctx.restore();
  }

  if (fyLength > 8) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    drawArrow(ctx, xEnd, cy, fyLength, force.fy >= 0 ? -Math.PI / 2 : Math.PI / 2, force.color, 2);
    ctx.restore();
  }

  if (fxLength > 42) {
    drawMixedText(
      ctx,
      (cx + xEnd) / 2,
      cy + 13 + force.index * 2,
      [{ text: 'F', italic: true }, { text: `${force.index + 1}x`, subscript: true }],
      { fontSize: 11, color: force.color, align: 'center', baseline: 'top' }
    );
  }

  if (fyLength > 42) {
    drawMixedText(
      ctx,
      xEnd + (force.fx >= 0 ? 11 : -11),
      (cy + yEnd) / 2,
      [{ text: 'F', italic: true }, { text: `${force.index + 1}y`, subscript: true }],
      { fontSize: 11, color: force.color, align: force.fx >= 0 ? 'left' : 'right', baseline: 'middle' }
    );
  }
}

function drawForceVector(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  forceScale: number,
  force: ForceVector,
  width: number,
  height: number,
  s: number
) {
  const vectorLength = force.magnitude * forceScale;
  if (vectorLength < 1) return;

  const screenAngle = -force.angleRad;
  const tip = drawArrow(ctx, cx, cy, vectorLength, screenAngle, force.color, 4.5 * s, true);
  const pad = 18 * s;
  const labelX = clamp(tip.hx + pad * Math.cos(screenAngle), pad, width - pad);
  const labelY = clamp(tip.hy + pad * Math.sin(screenAngle), pad, height - pad);

  drawMixedText(
    ctx,
    labelX,
    labelY,
    [{ text: 'F', italic: true, vector: true }, { text: `${force.index + 1}`, subscript: true, italic: false }],
    { fontSize: Math.round(15 * s), color: force.color, align: 'center', baseline: 'middle', halo: true }
  );
}

function drawSummaryVector(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  forceScale: number,
  magnitude: number,
  angleDeg: number,
  color: string,
  label: { text: string; italic?: boolean; vector?: boolean; subscript?: boolean }[],
  width: number,
  height: number,
  dashed: boolean,
  s: number
) {
  if (magnitude < EPSILON_FORCE) return;

  const screenAngle = -degToRad(angleDeg);
  ctx.save();
  if (dashed) ctx.setLineDash([8, 5]);
  const tip = drawArrow(ctx, cx, cy, magnitude * forceScale, screenAngle, color, 5 * s, true);
  ctx.restore();

  const pad = 20 * s;
  const labelX = clamp(tip.hx + 22 * s * Math.cos(screenAngle), pad, width - pad);
  const labelY = clamp(tip.hy + 22 * s * Math.sin(screenAngle), pad, height - pad);
  drawMixedText(ctx, labelX, labelY, label, { fontSize: Math.round(17 * s), color, align: 'center', baseline: 'middle', halo: true });
}

function drawCentralRing(ctx: CanvasRenderingContext2D, cx: number, cy: number, summary: ForceSummary, s: number) {
  const displacement = summary.resultantMagnitude < EPSILON_FORCE ? 0 : Math.min(22 * s, summary.resultantMagnitude * 2.4 * s);
  const angleRad = degToRad(summary.resultantAngleDeg);
  const ringX = cx + displacement * Math.cos(angleRad);
  const ringY = cy - displacement * Math.sin(angleRad);
  const ringR = 18 * s;

  ctx.save();

  if (displacement > 0) {
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(220, 38, 38, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ringX, ringY);
    ctx.stroke();
  }

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = displacement > 0 ? '#dc2626' : '#166534';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.arc(ringX, ringY, ringR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = displacement > 0 ? '#dc2626' : '#166534';
  ctx.beginPath();
  ctx.arc(ringX, ringY, 5 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

const ControlRow = ({ label, min, max, step, value, onChange }: {
  label: React.ReactNode;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: string) => void;
}) => (
  <div style={{ display: 'grid', gridTemplateColumns: '92px minmax(100px, 1fr) 78px', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
    <label style={{ fontSize: '13px', fontWeight: 500 }}>{label}</label>
    <input type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(event.target.value)} />
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={event => onChange(event.target.value)}
      style={{ fontSize: '13px', padding: '4px 6px' }}
    />
  </div>
);

const ToggleRow = ({ label, checked, onChange }: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500 }}>
    <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
    <span>{label}</span>
  </label>
);

const MetricRow = ({ label, value, color }: {
  label: React.ReactNode;
  value: string;
  color?: string;
}) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
    <span className="text-muted">{label}</span>
    <span style={{ fontWeight: 600, color }}>{value}</span>
  </div>
);

const LegendItem = ({ color, label, dashed = false }: {
  color: string;
  label: React.ReactNode;
  dashed?: boolean;
}) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color, fontWeight: 600 }}>
    <span style={{ width: '18px', height: 0, borderTop: dashed ? `2px dashed ${color}` : `3px solid ${color}`, borderRadius: '2px' }} />
    {label}
  </span>
);
