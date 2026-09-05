import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import { usePhysicsEngine } from '../../hooks/usePhysicsEngine';
import { drawArrow, drawMixedText, drawCoordinateGrid, resolveColor, fitStage } from '../../components/physics/drawUtils';
import { SimulationLayout } from '../../components/layout/SimulationLayout';
import { useCanvasStage } from '../../hooks/useCanvasStage';

const g = 9.8;
const TURN_NUDGE = 0.006;

type TrackPresetId = 'ramp' | 'valley' | 'hill';

type TrackPreset = {
  id: TrackPresetId;
  label: string;
  xMin: number;
  xMax: number;
  startX: number;
  startDirection: 1 | -1;
  y: (x: number) => number;
  dy: (x: number) => number;
};

type Params = {
  mass: number;
  initialSpeed: number;
  preset: TrackPresetId;
  frictionEnabled: boolean;
  muK: number;
  showEnergyBars: boolean;
  showWorkGraph: boolean;
};

type SimState = {
  x: number;
  direction: 1 | -1;
  energyPerMass: number;
  dissipatedPerMass: number;
  elapsed: number;
};

type Metrics = {
  height: number;
  speed: number;
  kinetic: number;
  potential: number;
  mechanical: number;
  initialMechanical: number;
  workGravity: number;
  workFriction: number;
  dissipated: number;
  ledgerResidual: number;
};

const TRACK_PRESETS: Record<TrackPresetId, TrackPreset> = {
  ramp: {
    id: 'ramp',
    label: 'Ramp',
    xMin: -6,
    xMax: 6,
    startX: -5.4,
    startDirection: 1,
    y: (x) => 1.72 - 0.22 * x,
    dy: () => -0.22
  },
  valley: {
    id: 'valley',
    label: 'Valley',
    xMin: -6,
    xMax: 6,
    startX: -5.15,
    startDirection: 1,
    y: (x) => 0.34 + 0.062 * x * x,
    dy: (x) => 0.124 * x
  },
  hill: {
    id: 'hill',
    label: 'Hill / turning point',
    xMin: -6,
    xMax: 6,
    startX: -5.25,
    startDirection: 1,
    y: (x) => 0.58 + 2.18 * Math.exp(-(x * x) / 3.9),
    dy: (x) => 2.18 * Math.exp(-(x * x) / 3.9) * (-2 * x / 3.9)
  }
};

const PRESET_ORDER: TrackPresetId[] = ['ramp', 'valley', 'hill'];

const DEFAULT_PARAMS: Params = {
  mass: 2.0,
  initialSpeed: 4.2,
  preset: 'hill',
  frictionEnabled: false,
  muK: 0.08,
  showEnergyBars: true,
  showWorkGraph: true
};

export default function WorkEnergyTrack() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageGen = useCanvasStage(canvasRef);

  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => setFontsReady(true));
    }
  }, []);

  const [params, setParams] = useState<Params>(DEFAULT_PARAMS);
  const [state, setState] = useState<SimState>(() => createInitialState(DEFAULT_PARAMS));

  const preset = TRACK_PRESETS[params.preset];

  const metrics = useMemo(() => computeMetrics(params, state), [params, state]);
  const turningPoints = useMemo(
    () => findTurningPoints(preset, state.energyPerMass),
    [preset, state.energyPerMass]
  );

  const physicsStep = useCallback((dt: number) => {
    setState((prev) => advanceState(prev, dt, params));
  }, [params]);

  const resetToInitial = useCallback(() => {
    setState(createInitialState(params));
  }, [params]);

  const { isRunning, toggle, reset, stepForward } = usePhysicsEngine({
    onStep: physicsStep,
    onReset: resetToInitial,
    maxDt: 0.035
  });

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!Number.isFinite(value)) return;

    const name = e.target.name;
    if (name === 'mass') {
      setParams((prev) => ({ ...prev, mass: clamp(value, 0.5, 8) }));
      return;
    }
    if (name === 'initialSpeed') {
      const nextParams = { ...params, initialSpeed: clamp(value, 0, 9) };
      setParams(nextParams);
      setState(createInitialState(nextParams));
      return;
    }
    if (name === 'muK') {
      setParams((prev) => ({ ...prev, muK: clamp(value, 0, 0.35) }));
    }
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextPreset = e.target.value as TrackPresetId;
    if (TRACK_PRESETS[nextPreset]) {
      const nextParams = { ...params, preset: nextPreset };
      setParams(nextParams);
      setState(createInitialState(nextParams));
    }
  };

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name;
    const checked = e.target.checked;
    setParams((prev) => {
      if (name === 'frictionEnabled') return { ...prev, frictionEnabled: checked };
      if (name === 'showEnergyBars') return { ...prev, showEnergyBars: checked };
      if (name === 'showWorkGraph') return { ...prev, showWorkGraph: checked };
      return prev;
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { ctx, w: width, h: height, s } = fitStage(canvas, 590);

    drawCoordinateGrid(ctx, width, height, {
      backgroundColor: '#fcfdfd',
      gridColor: '#e2e8f0',
      subdivisionColor: '#f8fafc'
    });

    const showBars = params.showEnergyBars;
    const showGraph = params.showWorkGraph;
    const hasBottomCharts = showBars || showGraph;
    const topHeight = hasBottomCharts ? Math.round(height * 0.58) : height - 20;
    const trackBox = { x: 54, y: 22, w: width - 84, h: topHeight - 58 };
    const profile = sampleTrack(preset, 220);
    const yMinRaw = Math.min(...profile.map((point) => point.y));
    const yMaxRaw = Math.max(...profile.map((point) => point.y), state.energyPerMass / g);
    const yPad = Math.max(0.18, (yMaxRaw - yMinRaw) * 0.16);
    const yMin = Math.max(0, yMinRaw - yPad);
    const yMax = yMaxRaw + yPad;
    const mapX = (x: number) => trackBox.x + ((x - preset.xMin) / (preset.xMax - preset.xMin)) * trackBox.w;
    const mapY = (y: number) => trackBox.y + ((yMax - y) / Math.max(0.1, yMax - yMin)) * trackBox.h;

    drawTrackScene(ctx, {
      preset,
      profile,
      state,
      params,
      metrics,
      turningPoints,
      mapX,
      mapY,
      trackBox,
      width,
      s
    });

    const chartTop = topHeight + 14;
    const chartHeight = height - chartTop - 20;

    if (showBars && showGraph) {
      const panelW = (width - 42) / 2;
      drawEnergyBars(ctx, { x: 16, y: chartTop, w: panelW, h: chartHeight }, metrics);
      drawWorkGraph(ctx, {
        rect: { x: 26 + panelW, y: chartTop, w: panelW, h: chartHeight },
        preset,
        params,
        state,
        metrics
      });
    } else if (showBars) {
      drawEnergyBars(ctx, { x: 16, y: chartTop, w: width - 32, h: chartHeight }, metrics);
    } else if (showGraph) {
      drawWorkGraph(ctx, {
        rect: { x: 16, y: chartTop, w: width - 32, h: chartHeight },
        preset,
        params,
        state,
        metrics
      });
    }
  }, [params, preset, state, metrics, turningPoints, fontsReady, stageGen]);

  return (
    <SimulationLayout
      title="Work and Mechanical Energy on a Track"
      description="Energy Methods - Work, kinetic energy, potential energy, and losses."
      slug="work-energy-track"

      actionsContent={
        <>
          <button onClick={toggle}>{isRunning ? 'Pause' : 'Play'}</button>
          <button className="secondary" onClick={() => stepForward(0.035)} title="Advance 1 frame (+0.035s)">Step</button>
          <button className="secondary" onClick={reset}>Reset</button>
        </>
      }

      running={isRunning}

      canvasContent={
        <>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px', fontSize: '13px', background: '#f8fafc', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: 'var(--color-vel)', fontWeight: 600 }}>{'-> '}<InlineMath math="\vec{v}" /></span>
            <span style={{ color: 'var(--color-gravity)', fontWeight: 600 }}>{'-> '}<InlineMath math="\vec{F}_g" /></span>
            <span style={{ color: 'var(--color-normal)', fontWeight: 600 }}>{'-> '}<InlineMath math="\vec{F}_N" /></span>
            <span style={{ color: 'var(--color-friction)', fontWeight: 600 }}>{'-> '}<InlineMath math="\vec{f}_k" /></span>
            <span style={{ color: '#334155', fontWeight: 600 }}>-- <InlineMath math="E/(mg)" /> height line</span>
            <span style={{
              marginLeft: 'auto',
              fontWeight: 700,
              fontSize: '12px',
              padding: '3px 12px',
              borderRadius: 99,
              background: params.frictionEnabled ? '#fee2e2' : '#dcfce7',
              color: params.frictionEnabled ? '#991b1b' : '#166534'
            }}>
              {params.frictionEnabled ? 'FRICTION ON' : 'CONSERVATIVE'}
            </span>
            <button
              type="button"
              className="secondary"
              style={{ padding: '2px 10px', fontSize: '12px', height: 'auto', lineHeight: '1.4' }}
              onClick={() => setParams(p => {
                const hasAny = p.showEnergyBars || p.showWorkGraph;
                return {
                  ...p,
                  showEnergyBars: !hasAny,
                  showWorkGraph: !hasAny,
                };
              })}
            >
              {(params.showEnergyBars || params.showWorkGraph) ? '▲ Collapse Graphs' : '▼ Expand Graphs'}
            </button>
          </div>
          <div className="sim-stage" style={{ ['--sim-stage-h' as string]: '590px' }}>
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
          </div>
        </>
      }

      theoryContent={
        <div style={{ padding: '16px', fontSize: '15px', lineHeight: '1.6' }}>
          <p>
            The cart is constrained to a fixed track profile <InlineMath math="y(x)" />. Kinetic and gravitational potential energy are computed from the cart speed and height:
          </p>
          <BlockMath math="K = \frac{1}{2}mv^2 \qquad U_g = mgy(x)" />
          <p>
            The work-energy theorem connects the net work along the track to the change in kinetic energy:
          </p>
          <BlockMath math="W_{\text{net}} = \Delta K" />
          <p>
            With friction off, only gravity does work, so mechanical energy is conserved:
          </p>
          <BlockMath math="E_{\text{mech}} = K + U_g = \text{constant}" />
          <p>
            With kinetic friction on, nonconservative work removes mechanical energy and appears as dissipated energy:
          </p>
          <BlockMath math="W_f \approx -\mu_k mg\int ds \qquad E_{\text{diss}} = -W_f" />
        </div>
      }

      controlsContent={
        <>
          <ControlRow label={<><InlineMath math="m" /> (kg)</>} name="mass" min="0.5" max="8" step="0.1" value={params.mass} onChange={handleNumberChange} onReset={() => setParams(p => ({ ...p, mass: DEFAULT_PARAMS.mass }))} />
          <ControlRow label={<><InlineMath math="v_0" /> (m/s)</>} name="initialSpeed" min="0" max="9" step="0.1" value={params.initialSpeed} onChange={handleNumberChange} onReset={() => setParams(p => ({ ...p, initialSpeed: DEFAULT_PARAMS.initialSpeed }))} />
          <SelectRow label="Track preset" value={params.preset} onChange={handlePresetChange} />
          <ToggleRow label={<>Kinetic friction</>} name="frictionEnabled" checked={params.frictionEnabled} onChange={handleToggleChange} />
          <ControlRow label={<><InlineMath math="\mu_k" /></>} name="muK" min="0" max="0.35" step="0.01" value={params.muK} onChange={handleNumberChange} disabled={!params.frictionEnabled} onReset={() => setParams(p => ({ ...p, muK: DEFAULT_PARAMS.muK }))} />
          <ToggleRow label={<>Energy bars</>} name="showEnergyBars" checked={params.showEnergyBars} onChange={handleToggleChange} />
          <ToggleRow label={<>Force/work graph</>} name="showWorkGraph" checked={params.showWorkGraph} onChange={handleToggleChange} />
        </>
      }

      metricsContent={
        <>
          <MetricRow label={<><InlineMath math="K" /> kinetic</>} value={`${metrics.kinetic.toFixed(2)} J`} color="var(--color-vel)" />
          <MetricRow label={<><InlineMath math="U_g" /> potential</>} value={`${metrics.potential.toFixed(2)} J`} color="var(--color-gravity)" />
          <MetricRow label={<><InlineMath math="E_{\text{mech}}" /> total</>} value={`${metrics.mechanical.toFixed(2)} J`} color="#1d4ed8" />
          <MetricRow label={<><InlineMath math="W_g" /> gravity work</>} value={`${metrics.workGravity.toFixed(2)} J`} color="#6b21a8" />
          <MetricRow label={<><InlineMath math="W_f" /> friction work</>} value={`${metrics.workFriction.toFixed(2)} J`} color="var(--color-friction)" />
          <MetricRow label={<><InlineMath math="v" /> speed</>} value={`${metrics.speed.toFixed(2)} m/s`} color="var(--color-vel)" />
          <MetricRow label={<><InlineMath math="y" /> height</>} value={`${metrics.height.toFixed(2)} m`} />
          <MetricRow label="Dissipated energy" value={`${metrics.dissipated.toFixed(2)} J`} color="#b91c1c" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-muted">Energy ledger residual</span>
            <span style={{
              fontWeight: 700,
              fontSize: '13px',
              padding: '2px 10px',
              borderRadius: 99,
              background: metrics.ledgerResidual < 0.03 ? '#dcfce7' : '#fef9c3',
              color: metrics.ledgerResidual < 0.03 ? '#166534' : '#854d0e'
            }}>
              {metrics.ledgerResidual.toFixed(3)} J
            </span>
          </div>
        </>
      }
    />
  );
}

function createInitialState(params: Params): SimState {
  const preset = TRACK_PRESETS[params.preset];
  const energyPerMass = 0.5 * params.initialSpeed * params.initialSpeed + g * preset.y(preset.startX);
  return {
    x: preset.startX,
    direction: preset.startDirection,
    energyPerMass,
    dissipatedPerMass: 0,
    elapsed: 0
  };
}

function advanceState(prev: SimState, dt: number, params: Params): SimState {
  if (!Number.isFinite(dt) || dt <= 0) return prev;

  const preset = TRACK_PRESETS[params.preset];
  const lossPerMeter = params.frictionEnabled ? params.muK * g : 0;
  const steps = Math.max(1, Math.ceil(dt / 0.008));
  const subDt = dt / steps;

  let x = clamp(prev.x, preset.xMin, preset.xMax);
  let direction: 1 | -1 = prev.direction >= 0 ? 1 : -1;
  let energyPerMass = Math.max(prev.energyPerMass, potentialPerMass(preset, x));
  let dissipatedPerMass = Math.max(0, prev.dissipatedPerMass);

  for (let i = 0; i < steps; i += 1) {
    const kineticPerMass = Math.max(0, energyPerMass - potentialPerMass(preset, x));
    const speed = Math.sqrt(2 * kineticPerMass);

    if (speed < 0.012) {
      const downhill = downhillDirection(preset, x, direction);
      const nudged = nudgeWithinEnergySurface(preset, x, downhill, energyPerMass);
      if (Math.abs(nudged - x) < 1e-6) break;
      direction = downhill;
      x = nudged;
      continue;
    }

    const slope = preset.dy(x);
    const dsDx = Math.sqrt(1 + slope * slope);
    const proposedX = x + direction * speed * subDt / dsDx;
    const targetX = clamp(proposedX, preset.xMin, preset.xMax);
    const boundaryHit = targetX !== proposedX;
    const ds = arcLength(preset, x, targetX, 8);
    const targetEnergy = energyPerMass - lossPerMeter * ds;
    const targetKineticPerMass = targetEnergy - potentialPerMass(preset, targetX);

    if (targetKineticPerMass < -1e-5) {
      const turnX = findReachableLimit(preset, x, targetX, energyPerMass, lossPerMeter);
      const traveled = arcLength(preset, x, turnX, 8);
      const loss = lossPerMeter * traveled;
      energyPerMass = Math.max(potentialPerMass(preset, turnX), energyPerMass - loss);
      dissipatedPerMass += loss;
      direction = downhillDirection(preset, turnX, direction);
      x = nudgeWithinEnergySurface(preset, turnX, direction, energyPerMass);
    } else {
      x = targetX;
      energyPerMass = Math.max(targetEnergy, potentialPerMass(preset, x));
      dissipatedPerMass += lossPerMeter * ds;

      if (boundaryHit) {
        direction = direction === 1 ? -1 : 1;
        x = nudgeWithinEnergySurface(preset, x, direction, energyPerMass);
      }
    }
  }

  return {
    x,
    direction,
    energyPerMass,
    dissipatedPerMass,
    elapsed: prev.elapsed + dt
  };
}

function computeMetrics(params: Params, state: SimState): Metrics {
  const preset = TRACK_PRESETS[params.preset];
  const height = preset.y(state.x);
  const initialHeight = preset.y(preset.startX);
  const kineticPerMass = Math.max(0, state.energyPerMass - g * height);
  const speed = Math.sqrt(2 * kineticPerMass);
  const kinetic = params.mass * kineticPerMass;
  const potential = params.mass * g * height;
  const mechanical = kinetic + potential;
  const initialMechanical = params.mass * (0.5 * params.initialSpeed * params.initialSpeed + g * initialHeight);
  const workGravity = params.mass * g * (initialHeight - height);
  const workFriction = -params.mass * state.dissipatedPerMass;
  const dissipated = params.mass * state.dissipatedPerMass;
  const ledgerResidual = Math.abs(mechanical + dissipated - initialMechanical);

  return {
    height,
    speed,
    kinetic,
    potential,
    mechanical,
    initialMechanical,
    workGravity,
    workFriction,
    dissipated,
    ledgerResidual
  };
}

function drawTrackScene(
  ctx: CanvasRenderingContext2D,
  opts: {
    preset: TrackPreset;
    profile: { x: number; y: number }[];
    state: SimState;
    params: Params;
    metrics: Metrics;
    turningPoints: number[];
    mapX: (x: number) => number;
    mapY: (y: number) => number;
    trackBox: { x: number; y: number; w: number; h: number };
    width: number;
    s: number;
  }
) {
  const { preset, profile, state, params, metrics, turningPoints, mapX, mapY, trackBox, width, s } = opts;
  const axisY = trackBox.y + trackBox.h + 18;

  ctx.save();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(trackBox.x, axisY);
  ctx.lineTo(trackBox.x + trackBox.w, axisY);
  ctx.stroke();

  drawMixedText(ctx, trackBox.x + trackBox.w / 2, axisY + 20,
    [{ text: 'position x (m)' }],
    { fontSize: 12, color: '#475569', align: 'center' });

  for (let tick = Math.ceil(preset.xMin / 2) * 2; tick <= preset.xMax; tick += 2) {
    const px = mapX(tick);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, axisY - 4);
    ctx.lineTo(px, axisY + 4);
    ctx.stroke();
    drawMixedText(ctx, px, axisY + 10, [{ text: tick.toFixed(0) }], {
      fontSize: 11,
      color: '#475569',
      align: 'center',
      baseline: 'top'
    });
  }

  const energyHeight = state.energyPerMass / g;
  const energyY = mapY(energyHeight);
  if (energyY > trackBox.y - 8 && energyY < axisY) {
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(trackBox.x, energyY);
    ctx.lineTo(trackBox.x + trackBox.w, energyY);
    ctx.stroke();
    ctx.setLineDash([]);
    drawMixedText(ctx, Math.min(width - 12, trackBox.x + trackBox.w - 4), energyY - 8,
      [{ text: 'E/(mg)' }],
      { fontSize: 12, color: '#334155', align: 'right', baseline: 'bottom' });
  }

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 8 * s;
  ctx.beginPath();
  profile.forEach((point, i) => {
    const px = mapX(point.x);
    const py = mapY(point.y);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 4 * s;
  ctx.beginPath();
  profile.forEach((point, i) => {
    const px = mapX(point.x);
    const py = mapY(point.y);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();

  drawEndStop(ctx, mapX(preset.xMin), mapY(preset.y(preset.xMin)), -1);
  drawEndStop(ctx, mapX(preset.xMax), mapY(preset.y(preset.xMax)), 1);

  turningPoints.forEach((turnX) => {
    const px = mapX(turnX);
    const py = mapY(preset.y(turnX));
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(px, py - 52);
    ctx.lineTo(px, py + 24);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
    drawMixedText(ctx, px, py - 58, [{ text: 'turn' }], {
      fontSize: 11,
      color: '#0f172a',
      align: 'center',
      baseline: 'bottom'
    });
  });

  const x = state.x;
  const y = preset.y(x);
  const slope = preset.dy(x);
  const dsDx = Math.sqrt(1 + slope * slope);
  const tangentAngle = Math.atan2(-slope / dsDx, 1 / dsDx);
  const velocityAngle = state.direction === 1 ? tangentAngle : tangentAngle + Math.PI;
  const normalX = -slope / dsDx;
  const normalY = 1 / dsDx;
  const screenNormalAngle = Math.atan2(-normalY, normalX);
  const trackPx = mapX(x);
  const trackPy = mapY(y);
  const cartCx = trackPx + normalX * 22 * s;
  const cartCy = trackPy - normalY * 22 * s;
  const lw = 4.5 * s;
  const fs = Math.round(18 * s);

  ctx.save();
  ctx.translate(cartCx, cartCy);
  ctx.rotate(tangentAngle);
  ctx.fillStyle = 'rgba(15,23,42,0.08)';
  ctx.fillRect(-31 * s, -15 * s, 64 * s, 34 * s);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(-32 * s, -18 * s, 64 * s, 34 * s);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2.2 * s;
  ctx.strokeRect(-32 * s, -18 * s, 64 * s, 34 * s);

  // Position mass label 'm' in cart center
  drawMixedText(ctx, 0, -2 * s,
    [{ text: 'm', italic: true }],
    { fontSize: Math.round(16 * s), color: '#475569', align: 'center', baseline: 'middle', halo: true });

  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.arc(-18 * s, 16 * s, 6 * s, 0, Math.PI * 2);
  ctx.arc(18 * s, 16 * s, 6 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (metrics.speed > 0.05) {
    const vTip = drawArrow(ctx, cartCx, cartCy - 2 * s, clamp(metrics.speed * 12 * s, 24 * s, 90 * s), velocityAngle, 'var(--color-vel)', lw, true);
    drawMixedText(ctx, vTip.hx + 10 * s * Math.cos(velocityAngle), vTip.hy + 10 * s * Math.sin(velocityAngle),
      [{ text: 'v', italic: true, vector: true }],
      { fontSize: fs, color: 'var(--color-vel)', align: 'center', baseline: 'middle', halo: true });
  }

  const gTip = drawArrow(ctx, cartCx - 14 * s, cartCy, 68 * s, Math.PI / 2, 'var(--color-gravity)', lw, true);
  drawMixedText(ctx, gTip.hx - 4 * s, gTip.hy + 14 * s,
    [{ text: 'F', italic: true, vector: true }, { text: 'g', subscript: true, italic: false }],
    { fontSize: fs, color: 'var(--color-gravity)', align: 'right', baseline: 'top', halo: true });

  const nTip = drawArrow(ctx, cartCx + 12 * s, cartCy, 62 * s, screenNormalAngle, 'var(--color-normal)', lw, true);
  drawMixedText(ctx, nTip.hx + 10 * s * Math.cos(screenNormalAngle), nTip.hy + 10 * s * Math.sin(screenNormalAngle),
    [{ text: 'F', italic: true, vector: true }, { text: 'N', subscript: true, italic: false }],
    { fontSize: fs, color: 'var(--color-normal)', align: 'center', baseline: 'middle', halo: true });

  if (params.frictionEnabled && metrics.speed > 0.04) {
    const fAngle = velocityAngle + Math.PI;
    const fTip = drawArrow(ctx, cartCx, cartCy + 10 * s, clamp((20 + params.muK * 130) * s, 20 * s, 66 * s), fAngle, 'var(--color-friction)', lw, true);
    drawMixedText(ctx, fTip.hx + 8 * s * Math.cos(fAngle), fTip.hy + 8 * s * Math.sin(fAngle),
      [{ text: 'f', italic: true, vector: true }, { text: 'k', subscript: true, italic: false }],
      { fontSize: fs, color: 'var(--color-friction)', align: 'center', baseline: 'middle', halo: true });
  }

  drawMixedText(ctx, trackBox.x + 4, trackBox.y + 4,
    [{ text: preset.label }],
    { fontSize: Math.round(13 * s), color: '#334155', align: 'left', baseline: 'top' });

  ctx.restore();
}

function drawEnergyBars(ctx: CanvasRenderingContext2D, rect: { x: number; y: number; w: number; h: number }, metrics: Metrics) {
  drawPanelFrame(ctx, rect, 'Energy ledger');

  const entries = [
    { label: [{ text: 'K', italic: true }], value: metrics.kinetic, color: resolveColor('var(--color-vel)') },
    { label: [{ text: 'U', italic: true }, { text: 'g', subscript: true, italic: false }], value: metrics.potential, color: resolveColor('var(--color-gravity)') },
    { label: [{ text: 'E', italic: true }, { text: 'mech', subscript: true, italic: false }], value: metrics.mechanical, color: '#1d4ed8' },
    { label: [{ text: 'E', italic: true }, { text: 'diss', subscript: true, italic: false }], value: metrics.dissipated, color: '#b91c1c' }
  ];
  const maxEnergy = Math.max(1, metrics.initialMechanical, ...entries.map((entry) => entry.value)) * 1.16;
  const chart = { x: rect.x + 38, y: rect.y + 36, w: rect.w - 62, h: rect.h - 76 };
  const baseY = chart.y + chart.h;
  const slot = chart.w / entries.length;

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(chart.x - 12, baseY);
  ctx.lineTo(chart.x + chart.w + 4, baseY);
  ctx.stroke();

  ctx.strokeStyle = '#94a3b8';
  ctx.setLineDash([5, 4]);
  const initialY = baseY - (metrics.initialMechanical / maxEnergy) * chart.h;
  ctx.beginPath();
  ctx.moveTo(chart.x - 10, initialY);
  ctx.lineTo(chart.x + chart.w + 4, initialY);
  ctx.stroke();
  ctx.setLineDash([]);
  drawMixedText(ctx, chart.x + chart.w, initialY - 5,
    [{ text: 'E', italic: true }, { text: '0', subscript: true, italic: false }, { text: ' (init)' }],
    {
      fontSize: 10,
      color: '#475569',
      align: 'right',
      baseline: 'bottom',
      halo: true
    }
  );

  entries.forEach((entry, i) => {
    const barW = Math.min(46, slot * 0.42);
    const cx = chart.x + slot * (i + 0.5);
    const barH = Math.max(0, (entry.value / maxEnergy) * chart.h);
    ctx.fillStyle = entry.color;
    ctx.fillRect(cx - barW / 2, baseY - barH, barW, barH);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - barW / 2, baseY - barH, barW, barH);
    drawMixedText(ctx, cx, baseY + 14, entry.label, {
      fontSize: 12,
      color: '#334155',
      align: 'center',
      baseline: 'top',
      halo: true
    });
    drawMixedText(ctx, cx, baseY - barH - 6, [{ text: entry.value.toFixed(1) }], {
      fontSize: 10,
      color: '#334155',
      align: 'center',
      baseline: 'bottom',
      halo: true
    });
  });
}

function drawWorkGraph(
  ctx: CanvasRenderingContext2D,
  opts: {
    rect: { x: number; y: number; w: number; h: number };
    preset: TrackPreset;
    params: Params;
    state: SimState;
    metrics: Metrics;
  }
) {
  const { rect, preset, params, state, metrics } = opts;
  drawPanelFrame(ctx, rect, 'Tangential force and work');

  const padL = 42;
  const padR = 16;
  const padT = 34;
  const padB = 34;
  const chart = { x: rect.x + padL, y: rect.y + padT, w: rect.w - padL - padR, h: rect.h - padT - padB };
  const samples = sampleTrack(preset, 180);
  const gravityForces = samples.map((point) => gravityTangentForce(params.mass, preset.dy(point.x)));
  const frictionMag = params.frictionEnabled ? params.muK * params.mass * g : 0;
  const forceLimit = Math.max(8, ...gravityForces.map((force) => Math.abs(force)), frictionMag) * 1.25;
  const mapX = (x: number) => chart.x + ((x - preset.xMin) / (preset.xMax - preset.xMin)) * chart.w;
  const mapF = (force: number) => chart.y + chart.h / 2 - (force / forceLimit) * (chart.h / 2);
  const zeroY = mapF(0);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(chart.x, chart.y, chart.w, chart.h);
  ctx.beginPath();
  ctx.moveTo(chart.x, zeroY);
  ctx.lineTo(chart.x + chart.w, zeroY);
  ctx.stroke();

  const shadeStart = preset.startX;
  const shadeEnd = state.x;
  if (Math.abs(shadeEnd - shadeStart) > 0.02) {
    const n = 90;
    const positiveWork = metrics.workGravity >= 0;
    ctx.fillStyle = positiveWork ? 'rgba(21,128,61,0.16)' : 'rgba(185,28,28,0.14)';
    ctx.beginPath();
    ctx.moveTo(mapX(shadeStart), zeroY);
    for (let i = 0; i <= n; i += 1) {
      const t = i / n;
      const x = shadeStart + (shadeEnd - shadeStart) * t;
      ctx.lineTo(mapX(x), mapF(gravityTangentForce(params.mass, preset.dy(x))));
    }
    ctx.lineTo(mapX(shadeEnd), zeroY);
    ctx.closePath();
    ctx.fill();
  }

  ctx.strokeStyle = resolveColor('var(--color-gravity)');
  ctx.lineWidth = 2;
  ctx.beginPath();
  samples.forEach((point, i) => {
    const px = mapX(point.x);
    const py = mapF(gravityTangentForce(params.mass, preset.dy(point.x)));
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();

  if (params.frictionEnabled) {
    const frictionForce = -state.direction * frictionMag;
    ctx.strokeStyle = resolveColor('var(--color-friction)');
    ctx.lineWidth = 1.8;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(chart.x, mapF(frictionForce));
    ctx.lineTo(chart.x + chart.w, mapF(frictionForce));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const cartX = mapX(state.x);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(cartX, chart.y);
  ctx.lineTo(cartX, chart.y + chart.h);
  ctx.stroke();
  ctx.setLineDash([]);

  drawMixedText(ctx, chart.x + chart.w / 2, rect.y + rect.h - 6,
    [{ text: 'Position ' }, { text: 'x', italic: true }, { text: ' (m)' }],
    {
      fontSize: 11,
      color: '#475569',
      align: 'center',
      baseline: 'bottom',
      halo: true
    }
  );
  ctx.save();
  ctx.translate(rect.x + 12, chart.y + chart.h / 2);
  ctx.rotate(-Math.PI / 2);
  drawMixedText(ctx, 0, 0,
    [{ text: 'F', italic: true }, { text: 'tan', subscript: true, italic: false }, { text: ' (N)' }],
    {
      fontSize: 11,
      color: '#475569',
      align: 'center',
      halo: true
    }
  );
  ctx.restore();

  drawMixedText(ctx, chart.x + 4, chart.y + 6,
    [
      { text: 'W', italic: true },
      { text: 'g', subscript: true, italic: false },
      { text: ` = ${metrics.workGravity.toFixed(1)} J,  ` },
      { text: 'W', italic: true },
      { text: 'f', subscript: true, italic: false },
      { text: ` = ${metrics.workFriction.toFixed(1)} J` }
    ],
    { fontSize: 11, color: '#334155', align: 'left', baseline: 'top', halo: true });
}

function drawPanelFrame(ctx: CanvasRenderingContext2D, rect: { x: number; y: number; w: number; h: number }, title: string) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.2;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  drawMixedText(ctx, rect.x + 12, rect.y + 12, [{ text: title }], {
    fontSize: 13,
    color: '#334155',
    align: 'left',
    baseline: 'top'
  });
  ctx.restore();
}

function drawEndStop(ctx: CanvasRenderingContext2D, x: number, y: number, direction: 1 | -1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(direction === 1 ? -0.25 : 0.25);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -26);
  ctx.lineTo(0, 14);
  ctx.stroke();
  ctx.restore();
}

function sampleTrack(preset: TrackPreset, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    const x = preset.xMin + (preset.xMax - preset.xMin) * t;
    return { x, y: preset.y(x) };
  });
}

function findTurningPoints(preset: TrackPreset, energyPerMass: number) {
  const roots: number[] = [];
  const samples = 260;
  let prevX = preset.xMin;
  let prevValue = potentialPerMass(preset, prevX) - energyPerMass;

  for (let i = 1; i <= samples; i += 1) {
    const x = preset.xMin + (preset.xMax - preset.xMin) * (i / samples);
    const value = potentialPerMass(preset, x) - energyPerMass;

    if (prevValue * value < 0) {
      roots.push(bisectRoot(preset, prevX, x, energyPerMass));
    } else if (Math.abs(value) < 0.004) {
      roots.push(x);
    }

    prevX = x;
    prevValue = value;
  }

  return roots
    .sort((a, b) => a - b)
    .filter((root, index, list) => index === 0 || Math.abs(root - list[index - 1]) > 0.08);
}

function bisectRoot(preset: TrackPreset, a: number, b: number, energyPerMass: number) {
  let lo = a;
  let hi = b;
  let loValue = potentialPerMass(preset, lo) - energyPerMass;

  for (let i = 0; i < 30; i += 1) {
    const mid = (lo + hi) / 2;
    const midValue = potentialPerMass(preset, mid) - energyPerMass;
    if (loValue * midValue <= 0) {
      hi = mid;
    } else {
      lo = mid;
      loValue = midValue;
    }
  }

  return (lo + hi) / 2;
}

function findReachableLimit(preset: TrackPreset, x0: number, x1: number, energyPerMass: number, lossPerMeter: number) {
  let lo = 0;
  let hi = 1;

  for (let i = 0; i < 30; i += 1) {
    const mid = (lo + hi) / 2;
    const x = x0 + (x1 - x0) * mid;
    const remaining = energyPerMass - lossPerMeter * arcLength(preset, x0, x, 8) - potentialPerMass(preset, x);
    if (remaining >= 0) lo = mid;
    else hi = mid;
  }

  return x0 + (x1 - x0) * lo;
}

function nudgeWithinEnergySurface(preset: TrackPreset, x: number, direction: 1 | -1, energyPerMass: number) {
  const distances = [TURN_NUDGE, TURN_NUDGE * 3, TURN_NUDGE * 8];
  for (const distance of distances) {
    const candidate = clamp(x + direction * distance, preset.xMin, preset.xMax);
    if (candidate !== x && potentialPerMass(preset, candidate) <= energyPerMass + 1e-6) {
      return candidate;
    }
  }
  return x;
}

function downhillDirection(preset: TrackPreset, x: number, fallbackDirection: 1 | -1): 1 | -1 {
  const slope = preset.dy(x);
  if (Math.abs(slope) < 0.015) return fallbackDirection === 1 ? -1 : 1;
  return slope > 0 ? -1 : 1;
}

function gravityTangentForce(mass: number, slope: number) {
  return -mass * g * slope / Math.sqrt(1 + slope * slope);
}

function arcLength(preset: TrackPreset, a: number, b: number, segments: number) {
  if (Math.abs(a - b) < 1e-9) return 0;
  const n = Math.max(2, segments);
  const dx = (b - a) / n;
  let length = 0;
  let prev = Math.sqrt(1 + preset.dy(a) * preset.dy(a));

  for (let i = 1; i <= n; i += 1) {
    const x = a + dx * i;
    const current = Math.sqrt(1 + preset.dy(x) * preset.dy(x));
    length += (prev + current) * 0.5 * Math.abs(dx);
    prev = current;
  }

  return length;
}

function potentialPerMass(preset: TrackPreset, x: number) {
  return g * preset.y(clamp(x, preset.xMin, preset.xMax));
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

const ControlRow = ({ label, name, min, max, step, value, onChange, disabled = false, onReset }: {
  label: React.ReactNode;
  name: string;
  min: string;
  max: string;
  step: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  onReset?: () => void;
}) => (
  <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 68px auto', gap: '8px', alignItems: 'center', marginBottom: '8px', opacity: disabled ? 0.55 : 1 }}>
    <label style={{ fontSize: '13px', fontWeight: 500 }}>{label}</label>
    <input type="range" name={name} min={min} max={max} step={step}
      value={value} onChange={onChange} disabled={disabled} />
    <input type="number" name={name} min={min} max={max} step={step} value={value}
      onChange={onChange} disabled={disabled} style={{ fontSize: '13px', padding: '4px 6px' }} />
    {onReset && (
      <button
        type="button"
        onClick={onReset}
        disabled={disabled}
        title="Reset parameter to default"
        style={{
          padding: '2px 6px',
          fontSize: '11px',
          lineHeight: 1,
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          background: 'transparent',
          cursor: disabled ? 'not-allowed' : 'pointer',
          color: 'var(--text-muted)'
        }}
      >
        ↺
      </button>
    )}
  </div>
);

const SelectRow = ({ label, value, onChange }: {
  label: React.ReactNode;
  value: TrackPresetId;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) => (
  <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
    <label style={{ fontSize: '13px', fontWeight: 500 }}>{label}</label>
    <select value={value} onChange={onChange} style={{ fontSize: '13px', padding: '5px 6px' }}>
      {PRESET_ORDER.map((presetId) => (
        <option key={presetId} value={presetId}>{TRACK_PRESETS[presetId].label}</option>
      ))}
    </select>
  </div>
);

const ToggleRow = ({ label, name, checked, onChange }: {
  label: React.ReactNode;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
    <span>{label}</span>
    <input type="checkbox" name={name} checked={checked} onChange={onChange} />
  </label>
);

const MetricRow = ({ label, value, color = '#334155' }: {
  label: React.ReactNode;
  value: string;
  color?: string;
}) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px', gap: '10px' }}>
    <span className="text-muted">{label}</span>
    <span style={{ fontWeight: 600, color, textAlign: 'right' }}>{value}</span>
  </div>
);
