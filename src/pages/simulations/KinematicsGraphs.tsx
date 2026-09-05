import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BlockMath, InlineMath } from 'react-katex';
import { usePhysicsEngine } from '../../hooks/usePhysicsEngine';
import { useQuerySeed } from '../../hooks/useQuerySeed';
import { useCanvasStage } from '../../hooks/useCanvasStage';
import {
  drawArrow,
  drawCoordinateGrid,
  drawMixedText,
  drawMotionGraph,
  sampleSeries,
  fitStage,
} from '../../components/physics/drawUtils';
import { SimulationLayout } from '../../components/layout/SimulationLayout';

type Profile = 'const-v' | 'const-a' | 'cruise' | 'turnaround';

type Params = {
  profile: Profile;
  x0: number;
  v0: number;
  a: number;
  tMax: number;
  tCursor: number;
  tA: number;
  tB: number;
};

const DEFAULT: Params = {
  profile: 'const-a',
  x0: 0,
  v0: 0,
  a: 2,
  tMax: 8,
  tCursor: 2,
  tA: 1,
  tB: 4,
};

const PROFILE_OPTIONS: { value: Profile; label: string }[] = [
  { value: 'const-v', label: 'Constant v' },
  { value: 'const-a', label: 'Constant a' },
  { value: 'cruise', label: 'Accel–cruise–brake' },
  { value: 'turnaround', label: 'Turnaround' },
];

function motionAt(profile: Profile, t: number, p: Params): { x: number; v: number; a: number } {
  if (profile === 'const-v') {
    const v = p.v0 === 0 ? 3 : p.v0;
    return { a: 0, v, x: p.x0 + v * t };
  }
  if (profile === 'const-a') {
    const a = p.a;
    const v = p.v0 + a * t;
    const x = p.x0 + p.v0 * t + 0.5 * a * t * t;
    return { x, v, a };
  }
  if (profile === 'turnaround') {
    const a = -2;
    const v0 = 8;
    const v = v0 + a * t;
    const x = v0 * t + 0.5 * a * t * t;
    return { x, v, a };
  }
  // accelerate 0–2 s, cruise 2–5 s, brake 5–7 s, rest after
  const aMag = 2;
  const tAcc = 2;
  const tCruiseEnd = 5;
  const tStop = 7;
  const vCruise = aMag * tAcc;
  const xAcc = 0.5 * aMag * tAcc * tAcc;
  const xCruise = xAcc + vCruise * (tCruiseEnd - tAcc);
  if (t <= tAcc) {
    return { a: aMag, v: aMag * t, x: 0.5 * aMag * t * t };
  }
  if (t <= tCruiseEnd) {
    return { a: 0, v: vCruise, x: xAcc + vCruise * (t - tAcc) };
  }
  if (t <= tStop) {
    const dt = t - tCruiseEnd;
    return { a: -aMag, v: vCruise - aMag * dt, x: xCruise + vCruise * dt - 0.5 * aMag * dt * dt };
  }
  const xStop = xCruise + vCruise * (tStop - tCruiseEnd) - 0.5 * aMag * (tStop - tCruiseEnd) ** 2;
  return { a: 0, v: 0, x: xStop };
}

export default function KinematicsGraphs() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageGen = useCanvasStage(canvasRef);
  const seed = useQuerySeed<Params & { profile: string }>([
    'profile',
    'x0',
    'v0',
    'a',
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
    const profile = (['const-v', 'const-a', 'cruise', 'turnaround'] as Profile[]).includes(
      seed.profile as Profile
    )
      ? (seed.profile as Profile)
      : DEFAULT.profile;
    return { ...DEFAULT, ...seed, profile };
  });
  const [tPlay, setTPlay] = useState(params.tCursor);
  const [showSlope, setShowSlope] = useState(true);
  const [showAreaV, setShowAreaV] = useState(true);
  const [showAreaA, setShowAreaA] = useState(false);
  const [showGraphs, setShowGraphs] = useState(true);

  const physicsStep = useCallback(
    (dt: number) => {
      setTPlay((prev) => {
        const next = prev + dt;
        return next > params.tMax ? 0 : next;
      });
    },
    [params.tMax]
  );

  const { isRunning, toggle, reset, stepForward } = usePhysicsEngine({
    onStep: physicsStep,
    onReset: () => setTPlay(params.tA),
  });

  const tCursor = isRunning ? tPlay : params.tCursor;
  const now = useMemo(() => motionAt(params.profile, tCursor, params), [params, tCursor]);
  const atA = useMemo(() => motionAt(params.profile, params.tA, params), [params]);
  const atB = useMemo(() => motionAt(params.profile, params.tB, params), [params]);
  const dtAB = Math.max(1e-6, params.tB - params.tA);
  const vAvg = (atB.x - atA.x) / dtAB;
  const aAvg = (atB.v - atA.v) / dtAB;
  const dx = atB.x - atA.x;
  const dv = atB.v - atA.v;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { ctx, w: width, h } = fitStage(canvas, 514);
    const sceneH = showGraphs ? Math.round(h * 135 / 514) : h - 10;
    const graphH = showGraphs ? Math.floor((h - sceneH) / 3) : 0;

    drawCoordinateGrid(ctx, width, h, {
      backgroundColor: '#fcfdfd',
      gridColor: '#e2e8f0',
      subdivisionColor: '#f8fafc',
    });

    const tMax = params.tMax;
    const xs = sampleSeries(0, tMax, 240, (t) => motionAt(params.profile, t, params).x);
    const vs = sampleSeries(0, tMax, 240, (t) => motionAt(params.profile, t, params).v);
    const as = sampleSeries(0, tMax, 240, (t) => motionAt(params.profile, t, params).a);

    const xNow = now.x;
    let xMin = xs[0].y;
    let xMax = xs[0].y;
    for (const s of xs) {
      if (s.y < xMin) xMin = s.y;
      if (s.y > xMax) xMax = s.y;
    }
    const xSpan = Math.max(4, xMax - xMin);
    const trackPad = 54;
    const mapSceneX = (x: number) =>
      trackPad + ((x - (xMin - 0.08 * xSpan)) / (xSpan * 1.16)) * (width - 2 * trackPad);

    const cartW = showGraphs ? 56 : 88;
    const cartH = showGraphs ? 32 : 48;
    const wheelR = showGraphs ? 6 : 9;
    const trackY = showGraphs ? sceneH - 26 : sceneH / 2 + 36;
    const cartY = trackY - cartH;

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(24, trackY);
    ctx.lineTo(width - 24, trackY);
    ctx.stroke();

    const cartX = mapSceneX(xNow);
    ctx.fillStyle = 'rgba(15,23,42,0.06)';
    ctx.fillRect(cartX - cartW / 2 + 3, cartY + 3, cartW, cartH);
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(cartX - cartW / 2, cartY, cartW, cartH);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.2;
    ctx.strokeRect(cartX - cartW / 2, cartY, cartW, cartH);

    drawMixedText(ctx, cartX, cartY + cartH / 2,
      [{ text: 'm', italic: true }],
      { fontSize: showGraphs ? 15 : 18, color: '#0284c7', align: 'center', baseline: 'middle', halo: true });

    ctx.fillStyle = '#334155';
    for (const wx of [cartX - cartW * 0.28, cartX + cartW * 0.28]) {
      ctx.beginPath();
      ctx.arc(wx, trackY + wheelR * 0.5, wheelR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    const vDir = now.v >= 0 ? 1 : -1;
    if (Math.abs(now.v) > 0.08) {
      const vLen = Math.min(84, Math.max(24, Math.abs(now.v) * (showGraphs ? 11 : 16)));
      const vTip = drawArrow(ctx, cartX, cartY - 14, vLen, vDir === 1 ? 0 : Math.PI, 'var(--color-vel)', 3.5, true);
      drawMixedText(ctx, vTip.hx + vDir * 10, cartY - 14,
        [{ text: 'v', italic: true, vector: true }],
        { fontSize: 16, color: 'var(--color-vel)', align: vDir === 1 ? 'left' : 'right', baseline: 'middle', halo: true });
    }

    drawMixedText(
      ctx,
      16,
      16,
      [{ text: PROFILE_OPTIONS.find((o) => o.value === params.profile)?.label ?? '' }],
      { fontSize: 13, color: '#475569', align: 'left', baseline: 'top' }
    );

    if (!showGraphs) {
      drawMixedText(
        ctx,
        width / 2,
        trackY + 36,
        [{ text: 'x', italic: true }, { text: ` = ${now.x.toFixed(2)} m    ` }, { text: 'v', italic: true }, { text: ` = ${now.v.toFixed(2)} m/s    ` }, { text: 'a', italic: true }, { text: ` = ${now.a.toFixed(2)} m/s²` }],
        { fontSize: 16, color: '#334155', align: 'center', baseline: 'top', halo: true }
      );
    }

    if (showGraphs && graphH > 20) {
      const tA = Math.min(params.tA, params.tB);
      const tB = Math.max(params.tA, params.tB);
      const common = {
        tMin: 0,
        tMax,
        tCursor,
        slopeFrom: showSlope ? tA : undefined,
        slopeTo: showSlope ? tB : undefined,
      };

      drawMotionGraph(ctx, { x: 0, y: sceneH, w: width, h: graphH }, as, {
        ...common,
        yLabel: [{ text: 'a', italic: true }, { text: ' (m/s²)' }],
        color: 'var(--color-accel)',
        fillFrom: showAreaA ? tA : undefined,
        fillTo: showAreaA ? tB : undefined,
        fillColor: 'rgba(91, 33, 182, 0.16)',
      });
      drawMotionGraph(ctx, { x: 0, y: sceneH + graphH, w: width, h: graphH }, vs, {
        ...common,
        yLabel: [{ text: 'v', italic: true }, { text: ' (m/s)' }],
        color: 'var(--color-vel)',
        fillFrom: showAreaV ? tA : undefined,
        fillTo: showAreaV ? tB : undefined,
        fillColor: 'rgba(4, 120, 87, 0.18)',
      });
      drawMotionGraph(ctx, { x: 0, y: sceneH + 2 * graphH, w: width, h: graphH }, xs, {
        ...common,
        yLabel: [{ text: 'x', italic: true }, { text: ' (m)' }],
        xLabel: [{ text: 't', italic: true }, { text: ' (s)' }],
        color: 'var(--color-gravity)',
      });
    }
  }, [fontsReady, params, tCursor, showSlope, showAreaV, showAreaA, showGraphs, now, stageGen]);

  const handleNum = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name as keyof Params;
    const value = parseFloat(e.target.value);
    setParams((p) => ({ ...p, [name]: value }));
    if (name === 'tCursor') setTPlay(value);
  };

  const showConstA = params.profile === 'const-a';
  const showConstV = params.profile === 'const-v';

  return (
    <SimulationLayout
      title="Kinematics Graphs"
      description="Graphical analysis — slope of x–t is v; area under v–t is Δx."
      slug="kinematics-graphs"
      running={isRunning}
      actionsContent={
        <>
          <button type="button" onClick={toggle}>
            {isRunning ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="secondary" onClick={() => stepForward(0.05)} title="Advance 1 frame (+0.05s)">
            Step
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
            <span style={{ color: 'var(--color-accel)', fontWeight: 600 }}>
              a–t
            </span>
            <span style={{ color: 'var(--color-vel)', fontWeight: 600 }}>v–t</span>
            <span style={{ color: 'var(--color-gravity)', fontWeight: 600 }}>x–t</span>
            <span style={{ color: '#1d4ed8', fontWeight: 600 }}>secant slope</span>
            <span style={{ marginLeft: 'auto', color: '#475569' }}>
              cursor t = {tCursor.toFixed(2)} s
            </span>
            <button
              type="button"
              className="secondary"
              style={{ padding: '2px 10px', fontSize: 12, height: 'auto', lineHeight: '1.4' }}
              onClick={() => setShowGraphs(p => !p)}
            >
              {showGraphs ? '▲ Collapse Graphs' : '▼ Expand Graphs'}
            </button>
          </div>
          <div className="sim-stage" style={{ ['--sim-stage-h' as string]: '514px' }}>
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
          </div>
        </>
      }
      theoryContent={
        <div style={{ padding: 16, fontSize: 15, lineHeight: 1.6 }}>
          <p>
            For one-dimensional motion the three graphs are not independent. Instantaneous
            velocity is the slope of position versus time:
          </p>
          <BlockMath math="v = \frac{\mathrm{d}x}{\mathrm{d}t}" />
          <p>Acceleration is the slope of velocity versus time:</p>
          <BlockMath math="a = \frac{\mathrm{d}v}{\mathrm{d}t}" />
          <p>Signed area under the graphs recovers the changes:</p>
          <BlockMath math="\Delta x = \int_{t_A}^{t_B} v\,\mathrm{d}t,\qquad \Delta v = \int_{t_A}^{t_B} a\,\mathrm{d}t" />
          <p>
            Constant <InlineMath math="a" /> makes <InlineMath math="v(t)" /> linear and{' '}
            <InlineMath math="x(t)" /> parabolic. A horizontal <InlineMath math="v" />–<InlineMath math="t" />{' '}
            graph means the object keeps its velocity — including a nonzero cruise.
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
                const profile = e.target.value as Profile;
                setParams((p) => ({ ...p, profile }));
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
          {showConstV && (
            <ControlRow label={<><InlineMath math="v_0" /> (m/s)</>} name="v0" min={-8} max={8} step={0.1} value={params.v0} onChange={handleNum} />
          )}
          {showConstA && (
            <>
              <ControlRow label={<><InlineMath math="x_0" /> (m)</>} name="x0" min={-10} max={10} step={0.1} value={params.x0} onChange={handleNum} />
              <ControlRow label={<><InlineMath math="v_0" /> (m/s)</>} name="v0" min={-8} max={8} step={0.1} value={params.v0} onChange={handleNum} />
              <ControlRow label={<><InlineMath math="a" /> (m/s²)</>} name="a" min={-4} max={4} step={0.1} value={params.a} onChange={handleNum} />
            </>
          )}
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
          <ToggleRow label="Shade area under v–t (Δx)" checked={showAreaV} onChange={setShowAreaV} />
          <ToggleRow label="Shade area under a–t (Δv)" checked={showAreaA} onChange={setShowAreaA} />
        </>
      }
      metricsContent={
        <>
          <Metric label={<>At cursor <InlineMath math="t" /></>} value={`${tCursor.toFixed(2)} s`} />
          <Metric label={<InlineMath math="x" />} value={`${now.x.toFixed(2)} m`} color="var(--color-gravity)" />
          <Metric label={<InlineMath math="v" />} value={`${now.v.toFixed(2)} m/s`} color="var(--color-vel)" />
          <Metric label={<InlineMath math="a" />} value={`${now.a.toFixed(2)} m/s²`} color="var(--color-accel)" />
          <div style={{ borderTop: '1px solid var(--border-color)', margin: '8px 0' }} />
          <Metric label={<>Slope of <InlineMath math="x" />–<InlineMath math="t" /></>} value={`${vAvg.toFixed(2)} m/s`} />
          <Metric label={<InlineMath math="v_\mathrm{avg}" />} value={`${vAvg.toFixed(2)} m/s`} />
          <Metric label={<>Slope of <InlineMath math="v" />–<InlineMath math="t" /></>} value={`${aAvg.toFixed(2)} m/s²`} />
          <Metric label={<>Area under <InlineMath math="v" />–<InlineMath math="t" /> = <InlineMath math="\Delta x" /></>} value={`${dx.toFixed(2)} m`} color="var(--color-vel)" />
          <Metric label={<>Area under <InlineMath math="a" />–<InlineMath math="t" /> = <InlineMath math="\Delta v" /></>} value={`${dv.toFixed(2)} m/s`} color="var(--color-accel)" isLast />
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
