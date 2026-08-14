import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BlockMath, InlineMath } from 'react-katex';
import { usePhysicsEngine } from '../../hooks/usePhysicsEngine';
import { useQuerySeed } from '../../hooks/useQuerySeed';
import { useCanvasStage } from '../../hooks/useCanvasStage';
import {
  drawCoordinateGrid,
  drawMixedText,
  drawMotionGraph,
  sampleSeries,
  fitStage,
} from '../../components/physics/drawUtils';
import { SimulationLayout } from '../../components/layout/SimulationLayout';

type Profile = 'const-omega' | 'const-alpha' | 'spin-coast';

type Params = {
  profile: Profile;
  w0: number;
  alpha: number;
  R: number;
  tMax: number;
  tCursor: number;
  tA: number;
  tB: number;
};

const DEFAULT: Params = {
  profile: 'const-alpha',
  w0: 0,
  alpha: 1.5,
  R: 0.8,
  tMax: 8,
  tCursor: 2,
  tA: 1,
  tB: 4,
};

const PROFILE_OPTIONS: { value: Profile; label: string }[] = [
  { value: 'const-omega', label: 'Constant ω' },
  { value: 'const-alpha', label: 'Constant α' },
  { value: 'spin-coast', label: 'Spin-up then coast' },
];

function rotAt(profile: Profile, t: number, p: Params): { th: number; w: number; al: number } {
  if (profile === 'const-omega') {
    const w = p.w0 === 0 ? 2 : p.w0;
    return { al: 0, w, th: w * t };
  }
  if (profile === 'const-alpha') {
    const al = p.alpha;
    const w = p.w0 + al * t;
    const th = p.w0 * t + 0.5 * al * t * t;
    return { th, w, al };
  }
  const alSpin = 2;
  const tSpin = 3;
  const wCoast = alSpin * tSpin;
  const thSpin = 0.5 * alSpin * tSpin * tSpin;
  if (t <= tSpin) {
    return { al: alSpin, w: alSpin * t, th: 0.5 * alSpin * t * t };
  }
  return { al: 0, w: wCoast, th: thSpin + wCoast * (t - tSpin) };
}

export default function RotationalKinematics() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageGen = useCanvasStage(canvasRef);
  const seed = useQuerySeed<Params & { profile: string }>([
    'profile',
    'w0',
    'alpha',
    'R',
    'tMax',
    'tCursor',
    'tA',
    'tB',
  ]);

  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => setFontsReady(true));
    }
  }, []);

  const [params, setParams] = useState<Params>(() => {
    const profile = (['const-omega', 'const-alpha', 'spin-coast'] as Profile[]).includes(
      seed.profile as Profile
    )
      ? (seed.profile as Profile)
      : DEFAULT.profile;
    return { ...DEFAULT, ...seed, profile };
  });
  const [tPlay, setTPlay] = useState(params.tCursor);
  const [showSlope, setShowSlope] = useState(true);
  const [showAreaW, setShowAreaW] = useState(true);
  const [showAreaA, setShowAreaA] = useState(false);

  const physicsStep = useCallback(
    (dt: number) => {
      setTPlay((prev) => {
        const next = prev + dt;
        return next > params.tMax ? 0 : next;
      });
    },
    [params.tMax]
  );

  const { isRunning, toggle, reset } = usePhysicsEngine({
    onStep: physicsStep,
    onReset: () => setTPlay(params.tA),
  });

  const tCursor = isRunning ? tPlay : params.tCursor;
  const now = useMemo(() => rotAt(params.profile, tCursor, params), [params, tCursor]);
  const atA = useMemo(() => rotAt(params.profile, params.tA, params), [params]);
  const atB = useMemo(() => rotAt(params.profile, params.tB, params), [params]);
  const dtAB = Math.max(1e-6, params.tB - params.tA);
  const wAvg = (atB.th - atA.th) / dtAB;
  const aAvg = (atB.w - atA.w) / dtAB;
  const dTh = atB.th - atA.th;
  const dW = atB.w - atA.w;
  const vt = now.w * params.R;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { ctx, w: width, h } = fitStage(canvas, 540);
    const sceneH = Math.round(h * 168 / 540);
    const graphH = Math.floor((h - sceneH) / 3);

    drawCoordinateGrid(ctx, width, h, {
      backgroundColor: '#fcfdfd',
      gridColor: '#e2e8f0',
      subdivisionColor: '#f8fafc',
    });

    const tMax = params.tMax;
    const ths = sampleSeries(0, tMax, 240, (t) => rotAt(params.profile, t, params).th);
    const ws = sampleSeries(0, tMax, 240, (t) => rotAt(params.profile, t, params).w);
    const als = sampleSeries(0, tMax, 240, (t) => rotAt(params.profile, t, params).al);

    const cx = width / 2;
    const cy = sceneH / 2 + 6;
    const diskR = Math.min(58, 28 + params.R * 28);
    ctx.beginPath();
    ctx.arc(cx, cy, diskR, 0, Math.PI * 2);
    ctx.fillStyle = '#e0f2fe';
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    const markAng = -now.th;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + diskR * Math.cos(markAng), cy + diskR * Math.sin(markAng));
    ctx.stroke();
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.arc(cx + diskR * Math.cos(markAng), cy + diskR * Math.sin(markAng), 6, 0, Math.PI * 2);
    ctx.fill();

    drawMixedText(
      ctx,
      16,
      14,
      [{ text: PROFILE_OPTIONS.find((o) => o.value === params.profile)?.label ?? '' }],
      { fontSize: 13, color: '#475569', align: 'left', baseline: 'top' }
    );
    drawMixedText(
      ctx,
      cx,
      sceneH - 14,
      [{ text: 'fixed axis · θ unwrapped on graphs' }],
      { fontSize: 12, color: '#64748b', align: 'center', baseline: 'bottom' }
    );

    const tA = Math.min(params.tA, params.tB);
    const tB = Math.max(params.tA, params.tB);
    const common = {
      tMin: 0,
      tMax,
      tCursor,
      slopeFrom: showSlope ? tA : undefined,
      slopeTo: showSlope ? tB : undefined,
    };

    drawMotionGraph(ctx, { x: 0, y: sceneH, w: width, h: graphH }, als, {
      ...common,
      yLabel: [{ text: 'α', italic: true }, { text: ' (rad/s²)' }],
      color: 'var(--color-accel)',
      fillFrom: showAreaA ? tA : undefined,
      fillTo: showAreaA ? tB : undefined,
      fillColor: 'rgba(91, 33, 182, 0.16)',
    });
    drawMotionGraph(ctx, { x: 0, y: sceneH + graphH, w: width, h: graphH }, ws, {
      ...common,
      yLabel: [{ text: 'ω', italic: true }, { text: ' (rad/s)' }],
      color: 'var(--color-vel)',
      fillFrom: showAreaW ? tA : undefined,
      fillTo: showAreaW ? tB : undefined,
      fillColor: 'rgba(4, 120, 87, 0.18)',
    });
    drawMotionGraph(ctx, { x: 0, y: sceneH + 2 * graphH, w: width, h: graphH }, ths, {
      ...common,
      yLabel: [{ text: 'θ', italic: true }, { text: ' (rad)' }],
      xLabel: [{ text: 't', italic: true }, { text: ' (s)' }],
      color: 'var(--color-gravity)',
    });
  }, [fontsReady, params, tCursor, showSlope, showAreaW, showAreaA, now.th, stageGen]);

  const handleNum = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name as keyof Params;
    const value = parseFloat(e.target.value);
    setParams((p) => ({ ...p, [name]: value }));
    if (name === 'tCursor') setTPlay(value);
  };

  const showConstA = params.profile === 'const-alpha';
  const showConstW = params.profile === 'const-omega';

  return (
    <SimulationLayout
      title="Rotational Kinematics Graphs"
      description="θ, ω, α versus time — the rotational analogues of x, v, a."
      slug="rotational-kinematics"
      running={isRunning}
      actionsContent={
        <>
          <button type="button" onClick={toggle}>
            {isRunning ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="secondary" onClick={reset}>
            Reset
          </button>
        </>
      }
      canvasContent={
        <>
          <div
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              gap: 12,
              fontSize: 13,
              background: '#f8fafc',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <span style={{ color: 'var(--color-accel)', fontWeight: 600 }}>α–t</span>
            <span style={{ color: 'var(--color-vel)', fontWeight: 600 }}>ω–t</span>
            <span style={{ color: 'var(--color-gravity)', fontWeight: 600 }}>θ–t</span>
            <span style={{ marginLeft: 'auto', color: '#64748b' }}>
              cursor t = {tCursor.toFixed(2)} s
            </span>
          </div>
          <div className="sim-stage" style={{ ['--sim-stage-h' as string]: '540px' }}>
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
          </div>
        </>
      }
      theoryContent={
        <div style={{ padding: 16, fontSize: 15, lineHeight: 1.6 }}>
          <p>Fixed-axis rotation uses the same calculus as 1-D translation:</p>
          <BlockMath math="\omega = \frac{\mathrm{d}\theta}{\mathrm{d}t},\qquad \alpha = \frac{\mathrm{d}\omega}{\mathrm{d}t}" />
          <BlockMath math="\Delta\theta = \int \omega\,\mathrm{d}t,\qquad \Delta\omega = \int \alpha\,\mathrm{d}t" />
          <p>
            Angles on the graphs are unwrapped radians (they may exceed <InlineMath math="2\pi" />).
            Rim speed is not a fourth independent kinematic quantity:
          </p>
          <BlockMath math="v_t = \omega R" />
          <p>
            Changing <InlineMath math="R" /> scales <InlineMath math="v_t" /> but leaves{' '}
            <InlineMath math="\theta,\omega,\alpha" /> unchanged for a prescribed angular profile.
          </p>
        </div>
      }
      controlsContent={
        <>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
            Motion profile
            <select
              value={params.profile}
              onChange={(e) => {
                setParams((p) => ({ ...p, profile: e.target.value as Profile }));
                setTPlay(0);
              }}
              style={{ display: 'block', width: '100%', marginTop: 6, padding: '8px 10px' }}
            >
              {PROFILE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {showConstW && (
            <ControlRow
              label={<><InlineMath math="\omega_0" /> (rad/s)</>}
              name="w0"
              min={-8}
              max={8}
              step={0.1}
              value={params.w0}
              onChange={handleNum}
            />
          )}
          {showConstA && (
            <>
              <ControlRow
                label={<><InlineMath math="\omega_0" /> (rad/s)</>}
                name="w0"
                min={-6}
                max={6}
                step={0.1}
                value={params.w0}
                onChange={handleNum}
              />
              <ControlRow
                label={<><InlineMath math="\alpha" /> (rad/s²)</>}
                name="alpha"
                min={-3}
                max={3}
                step={0.1}
                value={params.alpha}
                onChange={handleNum}
              />
            </>
          )}
          <ControlRow
            label={<><InlineMath math="R" /> (m)</>}
            name="R"
            min={0.2}
            max={2}
            step={0.05}
            value={params.R}
            onChange={handleNum}
          />
          <ControlRow
            label={<>Cursor <InlineMath math="t" /> (s)</>}
            name="tCursor"
            min={0}
            max={params.tMax}
            step={0.05}
            value={isRunning ? tPlay : params.tCursor}
            onChange={handleNum}
          />
          <ControlRow label={<><InlineMath math="t_A" /> (s)</>} name="tA" min={0} max={params.tMax} step={0.05} value={params.tA} onChange={handleNum} />
          <ControlRow label={<><InlineMath math="t_B" /> (s)</>} name="tB" min={0} max={params.tMax} step={0.05} value={params.tB} onChange={handleNum} />
          <ToggleRow label="Show slope secant" checked={showSlope} onChange={setShowSlope} />
          <ToggleRow label="Shade area under ω–t (Δθ)" checked={showAreaW} onChange={setShowAreaW} />
          <ToggleRow label="Shade area under α–t (Δω)" checked={showAreaA} onChange={setShowAreaA} />
        </>
      }
      metricsContent={
        <>
          <Metric label={<>At cursor <InlineMath math="t" /></>} value={`${tCursor.toFixed(2)} s`} />
          <Metric label={<InlineMath math="\theta" />} value={`${now.th.toFixed(2)} rad`} color="var(--color-gravity)" />
          <Metric label={<InlineMath math="\omega" />} value={`${now.w.toFixed(2)} rad/s`} color="var(--color-vel)" />
          <Metric label={<InlineMath math="\alpha" />} value={`${now.al.toFixed(2)} rad/s²`} color="var(--color-accel)" />
          <Metric label={<InlineMath math="v_t = \omega R" />} value={`${vt.toFixed(2)} m/s`} />
          <div style={{ borderTop: '1px solid var(--border-color)', margin: '8px 0' }} />
          <Metric label={<>Slope of <InlineMath math="\theta" />–<InlineMath math="t" /></>} value={`${wAvg.toFixed(2)} rad/s`} />
          <Metric label={<InlineMath math="\omega_\mathrm{avg}" />} value={`${wAvg.toFixed(2)} rad/s`} />
          <Metric label={<>Slope of <InlineMath math="\omega" />–<InlineMath math="t" /></>} value={`${aAvg.toFixed(2)} rad/s²`} />
          <Metric label={<>Area under <InlineMath math="\omega" />–<InlineMath math="t" /> = <InlineMath math="\Delta\theta" /></>} value={`${dTh.toFixed(2)} rad`} color="var(--color-vel)" />
          <Metric label={<>Area under <InlineMath math="\alpha" />–<InlineMath math="t" /> = <InlineMath math="\Delta\omega" /></>} value={`${dW.toFixed(2)} rad/s`} color="var(--color-accel)" isLast />
        </>
      }
    />
  );
}

function ControlRow({
  label,
  name,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: React.ReactNode;
  name: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '120px 1fr 70px',
        gap: 10,
        alignItems: 'center',
        marginBottom: 8,
      }}
    >
      <label style={{ fontSize: 13, fontWeight: 500 }}>{label}</label>
      <input type="range" name={name} min={min} max={max} step={step} value={value} onChange={onChange} />
      <input type="number" name={name} min={min} max={max} step={step} value={Number(value.toFixed(3))} onChange={onChange} />
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, margin: '8px 0' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function Metric({
  label,
  value,
  color,
  isLast,
}: {
  label: React.ReactNode;
  value: string;
  color?: string;
  isLast?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        paddingBottom: 8,
        borderBottom: isLast ? 'none' : '1px solid var(--border-color)',
        marginBottom: isLast ? 0 : 8,
      }}
    >
      <span className="text-muted">{label}</span>
      <span style={{ fontWeight: 600, color }}>{value}</span>
    </div>
  );
}
