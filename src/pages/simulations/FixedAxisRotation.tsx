import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BlockMath, InlineMath } from 'react-katex';
import { usePhysicsEngine } from '../../hooks/usePhysicsEngine';
import { drawArrow, drawCoordinateGrid, drawMixedText, resolveColor, fitStage } from '../../components/physics/drawUtils';
import { SimulationLayout } from '../../components/layout/SimulationLayout';
import { useCanvasStage } from '../../hooks/useCanvasStage';
import { parseUrlParams } from '../../hooks/useUrlSync';
import { PredictionGate } from '../../components/pedagogy/PredictionGate';
import { predictionChallenges } from '../../content/predictionChallenges';

type BodyPreset = 'solid-disk' | 'hoop' | 'rod-center' | 'rod-end';
type NumericParam = 'mass' | 'size' | 'force' | 'forceRadius' | 'forceAngleDeg' | 'brakeTorque' | 'omega0';
type BooleanParam = 'showDecomposition' | 'showTangentialSpeed' | 'showEnergy';

type Params = {
  preset: BodyPreset;
  mass: number;
  size: number;
  force: number;
  forceRadius: number;
  forceAngleDeg: number;
  brakeTorque: number;
  omega0: number;
  showDecomposition: boolean;
  showTangentialSpeed: boolean;
  showEnergy: boolean;
};

type RotationState = {
  theta: number;
  omega: number;
  work: number;
  time: number;
};

type BodyModel = {
  label: string;
  dimensionLabel: string;
  dimensionSymbol: 'R' | 'L';
  inertia: number;
  forceRadiusMax: number;
  trackingRadius: number;
  visualExtent: number;
  shape: BodyPreset;
};

const OMEGA_EPS = 0.02;
const TWO_PI = Math.PI * 2;

const initialParams: Params = {
  preset: 'solid-disk',
  mass: 4,
  size: 2.4,
  force: 12,
  forceRadius: 1.7,
  forceAngleDeg: 65,
  brakeTorque: 0,
  omega0: 0.4,
  showDecomposition: true,
  showTangentialSpeed: true,
  showEnergy: true
};

const bodyOptions: { value: BodyPreset; label: string }[] = [
  { value: 'solid-disk', label: 'Solid disk' },
  { value: 'hoop', label: 'Hoop' },
  { value: 'rod-center', label: 'Rod about center' },
  { value: 'rod-end', label: 'Rod about end' }
];

export default function FixedAxisRotation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageGen = useCanvasStage(canvasRef);
  const [fontsReady, setFontsReady] = useState(false);

  const [searchParams] = useSearchParams();
  const [params, setParams] = useState<Params>(() => parseUrlParams(searchParams, initialParams));

  useEffect(() => {
    setParams((prev) => parseUrlParams(searchParams, prev));
  }, [searchParams]);

  const [state, setState] = useState<RotationState>({
    theta: 0,
    omega: initialParams.omega0,
    work: 0,
    time: 0
  });

  useEffect(() => {
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => setFontsReady(true));
    }
  }, []);

  const resetState = useCallback((omega0 = params.omega0) => {
    setState({ theta: 0, omega: omega0, work: 0, time: 0 });
  }, [params.omega0]);

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = e.target.value as BodyPreset;
    setParams(prev => {
      const forceRadiusMax = getForceRadiusMax(preset, prev.size);
      return {
        ...prev,
        preset,
        forceRadius: clamp(prev.forceRadius, 0, forceRadiusMax)
      };
    });
  };

  const handleNumericChange = (name: NumericParam, rawValue: number) => {
    if (!Number.isFinite(rawValue)) return;

    setParams(prev => {
      const next = { ...prev };
      switch (name) {
        case 'mass':
          next.mass = clamp(rawValue, 1, 12);
          break;
        case 'size':
          next.size = clamp(rawValue, 1, 5);
          next.forceRadius = clamp(next.forceRadius, 0, getForceRadiusMax(next.preset, next.size));
          break;
        case 'force':
          next.force = clamp(rawValue, 0, 30);
          break;
        case 'forceRadius':
          next.forceRadius = clamp(rawValue, 0, getForceRadiusMax(next.preset, next.size));
          break;
        case 'forceAngleDeg':
          next.forceAngleDeg = clamp(rawValue, -180, 180);
          break;
        case 'brakeTorque':
          next.brakeTorque = clamp(rawValue, 0, 12);
          break;
        case 'omega0':
          next.omega0 = clamp(rawValue, -6, 6);
          break;
      }
      return next;
    });
  };

  const handleToggle = (name: BooleanParam, checked: boolean) => {
    setParams(prev => ({ ...prev, [name]: checked }));
  };

  useEffect(() => {
    resetState(params.omega0);
  }, [params.preset, params.mass, params.size, params.omega0, resetState]);

  useEffect(() => {
    setParams(prev => {
      const forceRadiusMax = getForceRadiusMax(prev.preset, prev.size);
      if (prev.forceRadius <= forceRadiusMax) return prev;
      return { ...prev, forceRadius: forceRadiusMax };
    });
  }, [params.preset, params.size]);

  const physicsStep = useCallback((dt: number) => {
    setState(prev => {
      const model = getBodyModel(params);
      const torques = getTorques(params, prev.omega);
      const alpha = torques.netTorque / model.inertia;
      let stepDt = dt;
      let dTheta = prev.omega * stepDt + 0.5 * alpha * stepDt * stepDt;
      let nextOmega = prev.omega + alpha * stepDt;

      const brakeCanHold = params.brakeTorque > 0 && Math.abs(torques.appliedTorque) <= params.brakeTorque;
      const crossesRest = Math.abs(prev.omega) > OMEGA_EPS && prev.omega * nextOmega < 0;
      if (brakeCanHold && crossesRest && Math.abs(alpha) > 1e-9) {
        stepDt = clamp(-prev.omega / alpha, 0, dt);
        dTheta = prev.omega * stepDt + 0.5 * alpha * stepDt * stepDt;
        nextOmega = 0;
      }

      const nextTheta = prev.theta + dTheta;
      const nextWork = prev.work + torques.netTorque * dTheta;
      if (!Number.isFinite(nextTheta) || !Number.isFinite(nextOmega) || !Number.isFinite(nextWork)) {
        return { theta: 0, omega: params.omega0, work: 0, time: 0 };
      }

      return {
        theta: nextTheta,
        omega: Math.abs(nextOmega) < OMEGA_EPS && brakeCanHold ? 0 : nextOmega,
        work: nextWork,
        time: prev.time + dt
      };
    });
  }, [params]);

  const { isRunning, toggle, reset, stepForward, start } = usePhysicsEngine({
    onStep: physicsStep,
    onReset: () => resetState(params.omega0),
    maxDt: 0.035,
    fixedDt: 0.01,
  });

  const handleApplyChallenge = useCallback((setup: Record<string, unknown>) => {
    setParams((prev) => {
      const next = { ...prev, ...(setup as Partial<Params>) };
      resetState(next.omega0);
      return next;
    });
  }, [resetState]);

  const challengeContent = (
    <PredictionGate
      challenges={predictionChallenges['fixed-axis-rotation']}
      onApplySetup={handleApplyChallenge}
      onRunSim={start}
    />
  );

  const model = getBodyModel(params);
  const torques = getTorques(params, state.omega);
  const alpha = torques.netTorque / model.inertia;
  const kineticEnergy = 0.5 * model.inertia * state.omega * state.omega;
  const initialEnergy = 0.5 * model.inertia * params.omega0 * params.omega0;
  const deltaK = kineticEnergy - initialEnergy;
  const tangentialSpeed = state.omega * model.trackingRadius;
  const thetaWrapped = wrapSigned(state.theta);
  const radiusMax = getForceRadiusMax(params.preset, params.size);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { ctx, w: width, h: height, s } = fitStage(canvas, 450);

    drawCoordinateGrid(ctx, width, height, {
      backgroundColor: '#fcfdfd',
      gridColor: '#e2e8f0',
      subdivisionColor: '#f8fafc'
    });

    const energyBandHeight = params.showEnergy ? 74 : 0;
    const sceneHeight = height - energyBandHeight;
    const pivotX = width / 2;
    const pivotY = sceneHeight / 2 + 10;
    const fitExtent = Math.max(model.visualExtent, 0.8);
    const pxPerMeter = Math.max(48, (Math.min(width, sceneHeight) / 2 - 42 * s) / fitExtent);
    const theta = wrapUnsigned(state.theta);
    const forcePoint = pointFromPivot(pivotX, pivotY, params.forceRadius * pxPerMeter, theta);
    const markerPoint = pointFromPivot(pivotX, pivotY, model.trackingRadius * pxPerMeter, theta);
    const bodyExtentPx = model.visualExtent * pxPerMeter;

    drawReferenceLine(ctx, pivotX, pivotY, width);
    drawBody(ctx, model, pivotX, pivotY, theta, pxPerMeter);
    drawThetaArc(ctx, pivotX, pivotY, thetaWrapped, Math.min(48, Math.max(30, bodyExtentPx * 0.36)));

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 7.5 * s, 0, TWO_PI);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    drawMixedText(ctx, pivotX + 14 * s, pivotY + 18 * s, [{ text: 'fixed axis' }], {
      fontSize: Math.round(14 * s),
      color: '#475569',
      align: 'left'
    });

    if (params.forceRadius > 0.02) {
      const leverTip = drawArrow(ctx, pivotX, pivotY, params.forceRadius * pxPerMeter, -theta, '#475569', 2.8 * s);
      const labelPoint = pointFromPivot(pivotX, pivotY, params.forceRadius * pxPerMeter * 0.5, theta);
      const offset = normalOffset(theta, 20 * s);
      drawMixedText(ctx, labelPoint.x + offset.x, labelPoint.y + offset.y, [{ text: 'r', italic: true }], {
        fontSize: Math.round(18 * s),
        color: '#475569',
        align: 'center',
        halo: true
      });
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(leverTip.hx, leverTip.hy, 4.5 * s, 0, TWO_PI);
      ctx.fill();
    }

    drawForceVectors(ctx, params, torques, forcePoint.x, forcePoint.y, theta, s);
    drawTorqueArcs(ctx, pivotX, pivotY, bodyExtentPx, torques.netTorque, state.omega);

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(markerPoint.x, markerPoint.y, 6 * s, 0, TWO_PI);
    ctx.fill();
    ctx.stroke();

    if (params.showTangentialSpeed && Math.abs(tangentialSpeed) > 0.05) {
      const speedScale = 13 * s;
      const direction = -(theta + Math.sign(tangentialSpeed) * Math.PI / 2);
      const speedTip = drawArrow(
        ctx,
        markerPoint.x,
        markerPoint.y,
        clamp(Math.abs(tangentialSpeed) * speedScale, 18 * s, 96 * s),
        direction,
        'var(--color-vel)',
        4 * s
      );
      drawMixedText(ctx, speedTip.hx + 10 * s * Math.cos(direction), speedTip.hy + 10 * s * Math.sin(direction), [
        { text: 'v', italic: true },
        { text: 't', italic: true, subscript: true }
      ], {
        fontSize: Math.round(16 * s),
        color: 'var(--color-vel)',
        align: tangentialSpeed >= 0 ? 'left' : 'right'
      });
    }

    if (params.showEnergy) {
      drawEnergyBars(ctx, width, height, kineticEnergy, state.work, deltaK);
    }
  }, [alpha, deltaK, fontsReady, kineticEnergy, model, params, state, tangentialSpeed, thetaWrapped, torques, stageGen]);

  return (
    <SimulationLayout
      title="Torque and Fixed-Axis Rotation"
      description="Rotational Dynamics - Torque, moment of inertia, and angular acceleration."
      slug="fixed-axis-rotation"
      shareParams={params as unknown as Record<string, unknown>}
      challengeContent={challengeContent}
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
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '14px', fontSize: '13px', background: '#f8fafc', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: 'var(--color-force-app)', fontWeight: 600 }}>{'-> '}<InlineMath math="\vec{F}" /></span>
            <span style={{ color: 'var(--color-accel-tangential)', fontWeight: 600 }}>{'-> '}<InlineMath math="\vec{F}_t" /></span>
            <span style={{ color: '#475569', fontWeight: 600 }}>{'-> '}<InlineMath math="\vec{r}" /></span>
            <span style={{ color: 'var(--color-vel)', fontWeight: 600 }}>{'-> '}<InlineMath math="\vec{v}_t" /></span>
            <span style={{ color: '#7c2d12', fontWeight: 600 }}>curved <InlineMath math="\tau_{\text{net}}" /></span>
            <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: '12px', padding: '3px 12px', borderRadius: 99, background: torques.netTorque >= 0 ? '#dcfce7' : '#fee2e2', color: torques.netTorque >= 0 ? '#166534' : '#991b1b' }}>
              {Math.abs(torques.netTorque) < 0.01 ? 'ZERO TORQUE' : torques.netTorque > 0 ? 'CCW TORQUE' : 'CW TORQUE'}
            </span>
          </div>
          <div className="sim-stage" style={{ ['--sim-stage-h' as string]: '450px' }}>
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
          </div>
        </>
      }
      theoryContent={
        <div style={{ padding: '16px', fontSize: '15px', lineHeight: '1.6' }}>
          <p>
            Torque depends on the lever arm <InlineMath math="r" />, applied force <InlineMath math="F" />, and the angle <InlineMath math="\phi" /> between them. Only the perpendicular force component changes the rotation.
          </p>
          <BlockMath math="\tau = rF\sin\phi = rF_t" />
          <p>
            The fixed pivot supplies whatever constraint force is needed at the axis, so the rotational equation of motion is set by net torque and moment of inertia.
          </p>
          <BlockMath math="\tau_{\text{net}} = I\alpha" />
          <BlockMath math="\omega_{t+\Delta t}=\omega_t+\alpha\Delta t,\qquad \theta_{t+\Delta t}=\theta_t+\omega_t\Delta t+\frac{1}{2}\alpha\Delta t^2" />
          <p>
            Rotational kinetic energy and rim speed connect this model to linear motion:
          </p>
          <BlockMath math="K_{\text{rot}}=\frac{1}{2}I\omega^2,\qquad v_t=\omega R" />
          <p>
            Translation-to-rotation analogy: <InlineMath math="F \leftrightarrow \tau" />, <InlineMath math="m \leftrightarrow I" />, <InlineMath math="a \leftrightarrow \alpha" />, and <InlineMath math="K=\frac{1}{2}mv^2 \leftrightarrow K_{\text{rot}}=\frac{1}{2}I\omega^2" />.
          </p>
        </div>
      }
      controlsContent={
        <>
          <SelectRow label="Body preset" value={params.preset} options={bodyOptions} onChange={handlePresetChange} />
          <ControlRow label={<>Mass <InlineMath math="M" /> (kg)</>} name="mass" min={1} max={12} step={0.1} value={params.mass} onChange={handleNumericChange} onReset={() => handleNumericChange('mass', initialParams.mass)} />
          <ControlRow label={<>{model.dimensionLabel} <InlineMath math={model.dimensionSymbol} /> (m)</>} name="size" min={1} max={5} step={0.1} value={params.size} onChange={handleNumericChange} onReset={() => handleNumericChange('size', initialParams.size)} />
          <ControlRow label={<>Force <InlineMath math="F" /> (N)</>} name="force" min={0} max={30} step={0.5} value={params.force} onChange={handleNumericChange} onReset={() => handleNumericChange('force', initialParams.force)} />
          <ControlRow label={<>Apply radius <InlineMath math="r" /> (m)</>} name="forceRadius" min={0} max={radiusMax} step={0.05} value={params.forceRadius} onChange={handleNumericChange} onReset={() => handleNumericChange('forceRadius', initialParams.forceRadius)} />
          <ControlRow label={<>Force angle <InlineMath math="\phi" /> (deg)</>} name="forceAngleDeg" min={-180} max={180} step={1} value={params.forceAngleDeg} onChange={handleNumericChange} onReset={() => handleNumericChange('forceAngleDeg', initialParams.forceAngleDeg)} />
          <ControlRow label={<>Brake torque (N m)</>} name="brakeTorque" min={0} max={12} step={0.2} value={params.brakeTorque} onChange={handleNumericChange} onReset={() => handleNumericChange('brakeTorque', initialParams.brakeTorque)} />
          <ControlRow label={<>Initial <InlineMath math="\omega_0" /> (rad/s)</>} name="omega0" min={-6} max={6} step={0.1} value={params.omega0} onChange={handleNumericChange} onReset={() => handleNumericChange('omega0', initialParams.omega0)} />
          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '10px', paddingTop: '10px' }}>
            <ToggleRow label="Torque decomposition" name="showDecomposition" checked={params.showDecomposition} onChange={handleToggle} />
            <ToggleRow label="Rim tangential speed" name="showTangentialSpeed" checked={params.showTangentialSpeed} onChange={handleToggle} />
            <ToggleRow label="Energy and work bars" name="showEnergy" checked={params.showEnergy} onChange={handleToggle} />
          </div>
        </>
      }
      metricsContent={
        <>
          <MetricRow label={<><InlineMath math="I" /> moment of inertia</>} value={`${formatNumber(model.inertia)} kg m^2`} />
          <MetricRow label={<><InlineMath math="\tau_{\text{app}}" /> applied torque</>} value={`${formatNumber(torques.appliedTorque)} N m`} color="var(--color-force-app)" />
          <MetricRow label={<><InlineMath math="\tau_{\text{net}}" /> net torque</>} value={`${formatNumber(torques.netTorque)} N m`} color={torques.netTorque >= 0 ? '#166534' : '#991b1b'} />
          <MetricRow label={<><InlineMath math="\alpha" /> angular accel</>} value={`${formatNumber(alpha)} rad/s^2`} />
          <MetricRow label={<><InlineMath math="\omega" /> angular velocity</>} value={`${formatNumber(state.omega)} rad/s`} color="var(--color-vel)" />
          <MetricRow label={<><InlineMath math="\theta" /> angle</>} value={`${formatNumber(state.theta)} rad`} />
          <MetricRow label={<><InlineMath math="v_t" /> tangential speed</>} value={`${formatNumber(tangentialSpeed)} m/s`} color="var(--color-vel)" />
          <MetricRow label={<><InlineMath math="K_{\text{rot}}" /> kinetic energy</>} value={`${formatNumber(kineticEnergy)} J`} />
          <MetricRow label={<>Work by net torque</>} value={`${formatNumber(state.work)} J`} color="#7c2d12" />
          <MetricRow label={<><InlineMath math="\Delta K" /> check</>} value={`${formatNumber(deltaK)} J`} color={Math.abs(state.work - deltaK) < 0.08 || params.brakeTorque > 0 ? '#475569' : '#b91c1c'} isLast />
        </>
      }
    />
  );
}

function getBodyModel(params: Params): BodyModel {
  const mass = Math.max(params.mass, 1e-6);
  const size = Math.max(params.size, 1e-6);

  switch (params.preset) {
    case 'solid-disk':
      return {
        label: 'solid disk',
        dimensionLabel: 'Radius',
        dimensionSymbol: 'R',
        inertia: 0.5 * mass * size * size,
        forceRadiusMax: size,
        trackingRadius: size,
        visualExtent: size,
        shape: params.preset
      };
    case 'hoop':
      return {
        label: 'hoop',
        dimensionLabel: 'Radius',
        dimensionSymbol: 'R',
        inertia: mass * size * size,
        forceRadiusMax: size,
        trackingRadius: size,
        visualExtent: size,
        shape: params.preset
      };
    case 'rod-center':
      return {
        label: 'rod about center',
        dimensionLabel: 'Length',
        dimensionSymbol: 'L',
        inertia: (1 / 12) * mass * size * size,
        forceRadiusMax: size / 2,
        trackingRadius: size / 2,
        visualExtent: size / 2,
        shape: params.preset
      };
    case 'rod-end':
      return {
        label: 'rod about end',
        dimensionLabel: 'Length',
        dimensionSymbol: 'L',
        inertia: (1 / 3) * mass * size * size,
        forceRadiusMax: size,
        trackingRadius: size,
        visualExtent: size,
        shape: params.preset
      };
  }
}

function getForceRadiusMax(preset: BodyPreset, size: number) {
  return preset === 'rod-center' ? Math.max(size / 2, 0) : Math.max(size, 0);
}

function getTorques(params: Params, omega: number) {
  const phi = degreesToRadians(params.forceAngleDeg);
  const tangentialForce = params.force * Math.sin(phi);
  const radialForce = params.force * Math.cos(phi);
  const appliedTorque = params.forceRadius * tangentialForce;

  let brakeTorque = 0;
  if (params.brakeTorque > 0) {
    if (Math.abs(omega) < OMEGA_EPS && Math.abs(appliedTorque) <= params.brakeTorque) {
      brakeTorque = -appliedTorque;
    } else {
      const brakeSignSource = Math.abs(omega) >= OMEGA_EPS ? omega : appliedTorque;
      brakeTorque = brakeSignSource === 0 ? 0 : -Math.sign(brakeSignSource) * params.brakeTorque;
    }
  }

  return {
    phi,
    tangentialForce,
    radialForce,
    appliedTorque,
    brakeTorque,
    netTorque: appliedTorque + brakeTorque
  };
}

function drawBody(
  ctx: CanvasRenderingContext2D,
  model: BodyModel,
  cx: number,
  cy: number,
  theta: number,
  pxPerMeter: number
) {
  if (model.shape === 'solid-disk' || model.shape === 'hoop') {
    const radiusPx = model.trackingRadius * pxPerMeter;

    ctx.save();
    if (model.shape === 'solid-disk') {
      ctx.fillStyle = '#e0f2fe';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, radiusPx, 0, TWO_PI);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.arc(cx, cy, radiusPx, 0, TWO_PI);
      ctx.stroke();
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.arc(cx, cy, radiusPx, 0, TWO_PI);
      ctx.stroke();
    }

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    for (const angle of [theta, theta + Math.PI / 2]) {
      const a = -angle;
      ctx.beginPath();
      ctx.moveTo(cx - radiusPx * Math.cos(a), cy - radiusPx * Math.sin(a));
      ctx.lineTo(cx + radiusPx * Math.cos(a), cy + radiusPx * Math.sin(a));
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  const halfLengthPx = (model.shape === 'rod-center' ? model.trackingRadius : model.trackingRadius / 2) * pxPerMeter;
  const startR = model.shape === 'rod-center' ? -model.trackingRadius : 0;
  const endR = model.shape === 'rod-center' ? model.trackingRadius : model.trackingRadius;
  const start = pointFromPivot(cx, cy, startR * pxPerMeter, theta);
  const end = pointFromPivot(cx, cy, endR * pxPerMeter, theta);

  ctx.save();
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.10)';
  ctx.lineWidth = 22;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(start.x + 3, start.y + 3);
  ctx.lineTo(end.x + 3, end.y + 3);
  ctx.stroke();

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  ctx.strokeStyle = '#bfdbfe';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.restore();

  if (model.shape === 'rod-end') {
    const center = pointFromPivot(cx, cy, halfLengthPx, theta);
    drawMixedText(ctx, center.x, center.y - 20, [{ text: model.label }], {
      fontSize: 12,
      color: '#475569',
      align: 'center'
    });
  }
}

function drawReferenceLine(ctx: CanvasRenderingContext2D, cx: number, cy: number, width: number) {
  ctx.save();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(Math.max(12, cx - width * 0.18), cy);
  ctx.lineTo(Math.min(width - 12, cx + width * 0.28), cy);
  ctx.stroke();
  ctx.setLineDash([]);
  drawMixedText(ctx, Math.min(width - 18, cx + width * 0.28 + 10), cy - 12, [{ text: 'reference' }], {
    fontSize: 11,
    color: '#475569',
    align: 'right'
  });
  ctx.restore();
}

function drawThetaArc(ctx: CanvasRenderingContext2D, cx: number, cy: number, theta: number, radius: number) {
  if (Math.abs(theta) < 0.04) return;
  drawCurvedArrow(ctx, cx, cy, radius, 0, theta, 'var(--color-gravity)', 1.7);
  const mid = theta / 2;
  const label = pointFromPivot(cx, cy, radius + 16, mid);
  drawMixedText(ctx, label.x, label.y, [{ text: 'θ', italic: true }], {
    fontSize: 13,
    color: 'var(--color-gravity)',
    align: 'center',
    halo: true
  });
}

function drawForceVectors(
  ctx: CanvasRenderingContext2D,
  params: Params,
  torques: ReturnType<typeof getTorques>,
  x: number,
  y: number,
  theta: number,
  s: number
) {
  if (params.force < 0.05) return;

  const forceScale = 3.1 * s;
  const forceAngle = -(theta + torques.phi);
  const forceTip = drawArrow(ctx, x, y, clamp(params.force * forceScale, 18 * s, 105 * s), forceAngle, 'var(--color-force-app)', 4.5 * s, true);
  drawMixedText(ctx, forceTip.hx + 12 * s * Math.cos(forceAngle), forceTip.hy + 12 * s * Math.sin(forceAngle), [
    { text: 'F', italic: true, vector: true }
  ], {
    fontSize: Math.round(18 * s),
    color: 'var(--color-force-app)',
    align: 'center',
    halo: true
  });

  if (!params.showDecomposition) return;

  if (Math.abs(torques.radialForce) > 0.05) {
    const radialDirection = -(theta + (torques.radialForce >= 0 ? 0 : Math.PI));
    ctx.save();
    ctx.setLineDash([5, 4]);
    const radialTip = drawArrow(ctx, x, y, clamp(Math.abs(torques.radialForce) * forceScale, 14 * s, 90 * s), radialDirection, '#0f766e', 3 * s, true);
    ctx.restore();
    drawMixedText(ctx, radialTip.hx + 10 * s * Math.cos(radialDirection), radialTip.hy + 10 * s * Math.sin(radialDirection), [
      { text: 'F', italic: true },
      { text: 'r', italic: false, subscript: true }
    ], {
      fontSize: Math.round(16 * s),
      color: '#0f766e',
      align: 'center',
      halo: true
    });
  }

  if (Math.abs(torques.tangentialForce) > 0.05) {
    const tangentDirection = -(theta + Math.sign(torques.tangentialForce) * Math.PI / 2);
    const tangentTip = drawArrow(ctx, x, y, clamp(Math.abs(torques.tangentialForce) * forceScale, 14 * s, 96 * s), tangentDirection, 'var(--color-accel-tangential)', 4 * s, true);
    drawMixedText(ctx, tangentTip.hx + 12 * s * Math.cos(tangentDirection), tangentTip.hy + 12 * s * Math.sin(tangentDirection), [
      { text: 'F', italic: true },
      { text: 't', italic: false, subscript: true }
    ], {
      fontSize: Math.round(17 * s),
      color: 'var(--color-accel-tangential)',
      align: 'center',
      halo: true
    });
  }
}

function drawTorqueArcs(ctx: CanvasRenderingContext2D, cx: number, cy: number, bodyExtentPx: number, netTorque: number, omega: number) {
  const torqueRadius = bodyExtentPx + 28;
  if (Math.abs(netTorque) > 0.02) {
    const sweep = Math.sign(netTorque) * 1.1;
    drawCurvedArrow(ctx, cx, cy, torqueRadius, Math.sign(netTorque) > 0 ? -0.85 : 0.85, sweep, '#7c2d12', 3);
    const label = pointFromPivot(cx, cy, torqueRadius + 18, Math.sign(netTorque) > 0 ? -0.18 : 0.18);
    drawMixedText(ctx, label.x, label.y, [
      { text: 'τ', italic: true },
      { text: 'net', italic: false, subscript: true }
    ], {
      fontSize: 15,
      color: '#7c2d12',
      align: 'center',
      halo: true
    });
  }

  if (Math.abs(omega) > 0.05) {
    const omegaRadius = bodyExtentPx + 52;
    const sweep = Math.sign(omega) * 0.9;
    drawCurvedArrow(ctx, cx, cy, omegaRadius, Math.sign(omega) > 0 ? 2.35 : -2.35, sweep, 'var(--color-vel)', 2.5);
    const label = pointFromPivot(cx, cy, omegaRadius + 14, Math.sign(omega) > 0 ? 2.8 : -2.8);
    drawMixedText(ctx, label.x, label.y, [{ text: 'ω', italic: true }], {
      fontSize: 15,
      color: 'var(--color-vel)',
      align: 'center',
      halo: true
    });
  }
}

function drawEnergyBars(ctx: CanvasRenderingContext2D, width: number, height: number, kineticEnergy: number, work: number, deltaK: number) {
  const top = height - 72;
  const padX = 28;
  const chartW = width - padX * 2;
  const chartH = 50;
  const maxEnergy = Math.max(1, Math.abs(kineticEnergy), Math.abs(work), Math.abs(deltaK));
  const items = [
    { label: [{ text: 'K', italic: true }, { text: 'rot', italic: false, subscript: true }], value: kineticEnergy, color: '#0f766e' },
    { label: [{ text: 'W', italic: true }, { text: 'net', italic: false, subscript: true }], value: work, color: '#7c2d12' },
    { label: [{ text: 'Δ' }, { text: 'K', italic: true }], value: deltaK, color: '#475569' }
  ];
  const columnW = chartW / items.length;
  const zeroY = top + chartH - 10;

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, top - 1, width, height - top + 1);
  ctx.strokeStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(0, top - 1);
  ctx.lineTo(width, top - 1);
  ctx.stroke();

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padX, zeroY);
  ctx.lineTo(width - padX, zeroY);
  ctx.stroke();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const centerX = padX + columnW * i + columnW / 2;
    const barW = Math.min(60, columnW * 0.45);
    const barH = clamp(Math.abs(item.value) / maxEnergy * 28, 0, 28);
    const barY = item.value >= 0 ? zeroY - barH : zeroY;
    ctx.fillStyle = item.color;
    ctx.fillRect(centerX - barW / 2, barY, barW, barH);
    drawMixedText(ctx, centerX, top + 9, item.label, {
      fontSize: 12,
      color: item.color,
      align: 'center',
      halo: true
    });
  }
  ctx.restore();
}

function drawCurvedArrow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  startMathAngle: number,
  sweepMathAngle: number,
  color: string,
  lineWidth: number
) {
  if (Math.abs(sweepMathAngle) < 0.03 || radius < 4) return;
  const resolved = resolveColor(color);
  const steps = 28;
  const direction = Math.sign(sweepMathAngle);

  ctx.save();
  ctx.strokeStyle = resolved;
  ctx.fillStyle = resolved;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const a = startMathAngle + sweepMathAngle * (i / steps);
    const x = cx + radius * Math.cos(a);
    const y = cy - radius * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  const end = startMathAngle + sweepMathAngle;
  const tipX = cx + radius * Math.cos(end);
  const tipY = cy - radius * Math.sin(end);
  const tangentX = -Math.sin(end) * direction;
  const tangentY = -Math.cos(end) * direction;
  const tangentAngle = Math.atan2(tangentY, tangentX);
  const headLen = 10;
  const headWidth = 6;

  ctx.translate(tipX, tipY);
  ctx.rotate(tangentAngle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-headLen, -headWidth);
  ctx.lineTo(-headLen, headWidth);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function pointFromPivot(cx: number, cy: number, radiusPx: number, theta: number) {
  return {
    x: cx + radiusPx * Math.cos(theta),
    y: cy - radiusPx * Math.sin(theta)
  };
}

function normalOffset(theta: number, amount: number) {
  return {
    x: -Math.sin(theta) * amount,
    y: -Math.cos(theta) * amount
  };
}

function wrapUnsigned(theta: number) {
  const wrapped = theta % TWO_PI;
  return wrapped < 0 ? wrapped + TWO_PI : wrapped;
}

function wrapSigned(theta: number) {
  const wrapped = wrapUnsigned(theta);
  return wrapped > Math.PI ? wrapped - TWO_PI : wrapped;
}

function degreesToRadians(deg: number) {
  return deg * Math.PI / 180;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return '0.00';
  if (Math.abs(value) >= 1000) return value.toExponential(2);
  return value.toFixed(2);
}

function SelectRow({ label, value, options, onChange }: {
  label: string;
  value: BodyPreset;
  options: { value: BodyPreset; label: string }[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
      <label style={{ fontSize: '13px', fontWeight: 500 }}>{label}</label>
      <select value={value} onChange={onChange} style={{ fontSize: '13px', padding: '5px 6px' }}>
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

function ControlRow({ label, name, min, max, step, value, onChange, onReset }: {
  label: React.ReactNode;
  name: NumericParam;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (name: NumericParam, value: number) => void;
  onReset?: () => void;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(name, parseFloat(e.target.value));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 68px auto', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
      <label style={{ fontSize: '13px', fontWeight: 500 }}>{label}</label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={handleChange} />
      <input type="number" min={min} max={max} step={step} value={Number(value.toFixed(3))} onChange={handleChange} style={{ fontSize: '13px', padding: '4px 6px' }} />
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
            color: 'var(--text-muted)'
          }}
        >
          ↺
        </button>
      )}
    </div>
  );
}

function ToggleRow({ label, name, checked, onChange }: {
  label: string;
  name: BooleanParam;
  checked: boolean;
  onChange: (name: BooleanParam, checked: boolean) => void;
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '8px' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(name, e.target.checked)} />
      {label}
    </label>
  );
}

function MetricRow({ label, value, color = '#0f172a', isLast = false }: {
  label: React.ReactNode;
  value: string;
  color?: string;
  isLast?: boolean;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', paddingBottom: isLast ? 0 : '8px', borderBottom: isLast ? 'none' : '1px solid var(--border-color)', marginBottom: isLast ? 0 : '8px' }}>
      <span className="text-muted">{label}</span>
      <span style={{ fontWeight: 600, color, textAlign: 'right' }}>{value}</span>
    </div>
  );
}
