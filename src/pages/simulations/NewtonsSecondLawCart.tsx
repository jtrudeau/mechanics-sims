import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BlockMath, InlineMath } from 'react-katex';
import { usePhysicsEngine } from '../../hooks/usePhysicsEngine';
import { drawArrow, drawCoordinateGrid, drawMixedText, resolveColor, scaleCanvas, fitStage } from '../../components/physics/drawUtils';
import { SimulationLayout } from '../../components/layout/SimulationLayout';
import { useCanvasStage } from '../../hooks/useCanvasStage';
import { parseUrlParams } from '../../hooks/useUrlSync';
import { PredictionGate } from '../../components/pedagogy/PredictionGate';
import { predictionChallenges } from '../../content/predictionChallenges';

const EPS = 1e-9;
const MAX_TRAVEL_M = 3.0;
const VEL_HISTORY = 180;

type Params = {
  mCart: number;
  mHanger: number;
  g: number;
  frictionEnabled: boolean;
  muS: number;
  muK: number;
  showFbd: boolean;
  showGraph: boolean;
};

type MotionState = {
  x: number;
  v: number;
  atLimit: boolean;
};

type Dynamics = {
  a: number;
  tension: number;
  normal: number;
  fsMax: number;
  fk: number;
  friction: number;
  netExternal: number;
  cartWeight: number;
  hangerWeight: number;
  regime: 'frictionless' | 'static' | 'kinetic';
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const format = (value: number, places = 2) => Number.isFinite(value) ? value.toFixed(places) : (0).toFixed(places);

function computeDynamics(params: Params): Dynamics {
  const mCart = Math.max(params.mCart, EPS);
  const mHanger = Math.max(params.mHanger, EPS);
  const g = Math.max(params.g, EPS);
  const cartWeight = mCart * g;
  const hangerWeight = mHanger * g;
  const normal = cartWeight;
  const fsMax = params.frictionEnabled ? params.muS * normal : 0;
  const fk = params.frictionEnabled ? params.muK * normal : 0;

  if (!params.frictionEnabled) {
    const a = hangerWeight / (mCart + mHanger);
    return {
      a,
      tension: mCart * a,
      normal,
      fsMax,
      fk,
      friction: 0,
      netExternal: hangerWeight,
      cartWeight,
      hangerWeight,
      regime: 'frictionless'
    };
  }

  if (hangerWeight <= fsMax + EPS) {
    return {
      a: 0,
      tension: hangerWeight,
      normal,
      fsMax,
      fk,
      friction: hangerWeight,
      netExternal: 0,
      cartWeight,
      hangerWeight,
      regime: 'static'
    };
  }

  const netExternal = Math.max(0, hangerWeight - fk);
  const a = netExternal / (mCart + mHanger);

  return {
    a,
    tension: mCart * a + fk,
    normal,
    fsMax,
    fk,
    friction: fk,
    netExternal,
    cartWeight,
    hangerWeight,
    regime: 'kinetic'
  };
}

export default function NewtonsSecondLawCart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const velocityChartRef = useRef<HTMLCanvasElement>(null);
  const velocityHistoryRef = useRef<number[]>([]);
  const timeRef = useRef(0);
  const stageGen = useCanvasStage(canvasRef);

  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => setFontsReady(true));
    }
  }, []);

  const DEFAULT_PARAMS: Params = {
    mCart: 4.0,
    mHanger: 1.2,
    g: 9.8,
    frictionEnabled: false,
    muS: 0.35,
    muK: 0.25,
    showFbd: true,
    showGraph: true
  };

  const [searchParams] = useSearchParams();
  const [params, setParams] = useState<Params>(() => parseUrlParams(searchParams, DEFAULT_PARAMS));

  useEffect(() => {
    setParams((prev) => parseUrlParams(searchParams, prev));
  }, [searchParams]);

  const [state, setState] = useState<MotionState>({ x: 0, v: 0, atLimit: false });

  const resetHistory = () => {
    velocityHistoryRef.current = [];
    timeRef.current = 0;
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = Number(e.target.value);
    if (!Number.isFinite(rawValue)) return;

    resetHistory();
    setParams(prev => {
      const next = { ...prev };

      if (e.target.name === 'mCart') next.mCart = clamp(rawValue, 0.5, 12);
      if (e.target.name === 'mHanger') next.mHanger = clamp(rawValue, 0.1, 6);
      if (e.target.name === 'g') next.g = clamp(rawValue, 1, 20);
      if (e.target.name === 'muS') {
        next.muS = clamp(rawValue, 0, 1.2);
        next.muK = Math.min(next.muK, next.muS);
      }
      if (e.target.name === 'muK') next.muK = clamp(rawValue, 0, prev.muS);

      return next;
    });
  };

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    resetHistory();
    const { name, checked } = e.target;
    setParams(prev => ({ ...prev, [name]: checked }));
  };

  const physicsStep = useCallback((dt: number) => {
    const dynamics = computeDynamics(params);

    setState(prev => {
      const next: MotionState = { ...prev };

      if (prev.atLimit) {
        next.x = MAX_TRAVEL_M;
        next.v = 0;
      } else if (dynamics.regime === 'static') {
        next.v = 0;
      } else if (dt > 0) {
        next.x = prev.x + prev.v * dt + 0.5 * dynamics.a * dt * dt;
        next.v = prev.v + dynamics.a * dt;

        if (next.x >= MAX_TRAVEL_M) {
          next.x = MAX_TRAVEL_M;
          next.v = 0;
          next.atLimit = true;
        }
      }

      if (dt > 0) {
        velocityHistoryRef.current.push(next.v);
        if (velocityHistoryRef.current.length > VEL_HISTORY) velocityHistoryRef.current.shift();
        timeRef.current += dt;
      }

      return next;
    });
  }, [params]);

  const { isRunning, toggle, reset, stepForward, start } = usePhysicsEngine({
    onStep: physicsStep,
    onReset: () => {
      setState({ x: 0, v: 0, atLimit: false });
      resetHistory();
    },
    fixedDt: 0.01,
  });

  const handleApplyChallenge = useCallback((setup: Record<string, unknown>) => {
    setState({ x: 0, v: 0, atLimit: false });
    resetHistory();
    setParams((prev) => ({
      ...prev,
      ...(setup as Partial<Params>),
    }));
  }, []);

  const challengeContent = (
    <PredictionGate
      challenges={predictionChallenges['newtons-second-law-cart']}
      onApplySetup={handleApplyChallenge}
      onRunSim={start}
    />
  );

  useEffect(() => {
    if (!isRunning) physicsStep(0);
  }, [params, isRunning, physicsStep]);

  const dynamics = computeDynamics(params);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { ctx, w: width, h: height, s } = fitStage(canvas, 430);
    const lw = 4.5 * s;
    const fs = Math.round(18 * s);

    drawCoordinateGrid(ctx, width, height, {
      backgroundColor: '#fcfdfd',
      gridColor: '#e2e8f0',
      subdivisionColor: '#f8fafc'
    });

    const trackY = Math.round(height * 0.51);
    const cartW = (width < 520 ? 90 : 118) * s;
    const cartH = 66 * s;
    const cartStartX = (width < 520 ? 76 : 112) * Math.min(1, s);
    const pulleyX = Math.max(cartStartX + 180 * s, width - 96 * s);
    const cartCenterY = trackY - cartH / 2;
    const stringY = cartCenterY - 2 * s;
    const pulleyR = 28 * s;
    const hangerW = 66 * s;
    const hangerH = 70 * s;
    const hangerStartY = stringY + 86;
    const horizontalTravelPx = Math.max(72, pulleyX - pulleyR - 34 - cartW / 2 - cartStartX);
    const verticalTravelPx = Math.max(72, height - 42 - hangerH / 2 - hangerStartY);
    const pxPerMeter = Math.min(horizontalTravelPx, verticalTravelPx) / MAX_TRAVEL_M;
    const cartCx = cartStartX + state.x * pxPerMeter;
    const hangerCy = hangerStartY + state.x * pxPerMeter;
    const cartLeft = cartCx - cartW / 2;
    const cartTop = trackY - cartH;
    const cartRight = cartCx + cartW / 2;
    const hangerLeft = pulleyX - hangerW / 2;
    const hangerTop = hangerCy - hangerH / 2;
    const limitX = cartStartX + MAX_TRAVEL_M * pxPerMeter;

    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, trackY, width, height - trackY);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(20, trackY);
    ctx.lineTo(width - 24, trackY);
    ctx.stroke();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    for (let hx = -40; hx < width + 40; hx += 20) {
      ctx.beginPath();
      ctx.moveTo(hx, trackY);
      ctx.lineTo(hx + 36, trackY + 36);
      ctx.stroke();
    }

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(30, trackY - 5);
    ctx.lineTo(pulleyX - pulleyR, trackY - 5);
    ctx.stroke();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(30, trackY + 7);
    ctx.lineTo(pulleyX - pulleyR, trackY + 7);
    ctx.stroke();

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pulleyX, trackY);
    ctx.lineTo(pulleyX, stringY);
    ctx.stroke();
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(pulleyX - 6, trackY - 8, 12, 16);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cartRight, stringY);
    ctx.lineTo(pulleyX, stringY);
    ctx.lineTo(pulleyX, hangerTop);
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(pulleyX, stringY, pulleyR, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(pulleyX, stringY, 5 * s, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = 'rgba(15, 23, 42, 0.06)';
    ctx.fillRect(cartLeft + 5, cartTop + 5, cartW, cartH);
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(cartLeft, cartTop, cartW, cartH);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.2;
    ctx.strokeRect(cartLeft, cartTop, cartW, cartH);

    // Cart center of mass indicator dot
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(cartCx, cartCenterY, 3.5 * s, 0, 2 * Math.PI);
    ctx.fill();

    // Position cart mass label 'mc' in upper-left corner of cart
    // completely unobscured by vertical force vectors or tension arrow
    drawMixedText(
      ctx,
      cartLeft + 24 * s,
      cartTop + 20 * s,
      [{ text: 'm', italic: true }, { text: 'c', subscript: true }],
      { fontSize: Math.round(19 * s), color: '#0284c7', align: 'center', baseline: 'middle', halo: true }
    );

    ctx.fillStyle = '#334155';
    for (const wx of [cartLeft + 22 * s, cartRight - 22 * s]) {
      ctx.beginPath();
      ctx.arc(wx, trackY + 8 * s, 10 * s, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(15, 23, 42, 0.06)';
    ctx.fillRect(hangerLeft + 5, hangerTop + 5, hangerW, hangerH);
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(hangerLeft, hangerTop, hangerW, hangerH);
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2.2;
    ctx.strokeRect(hangerLeft, hangerTop, hangerW, hangerH);

    // Hanger center of mass indicator dot
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(pulleyX, hangerCy, 3.5 * s, 0, 2 * Math.PI);
    ctx.fill();

    // Position hanging mass label 'mh' offset horizontally to the left
    // completely unobscured by vertical tension and gravity arrows
    drawMixedText(
      ctx,
      pulleyX - 18 * s,
      hangerCy,
      [{ text: 'm', italic: true }, { text: 'h', subscript: true }],
      { fontSize: Math.round(19 * s), color: '#92400e', align: 'center', baseline: 'middle', halo: true }
    );

    ctx.strokeStyle = '#475569';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(limitX + cartW / 2, trackY - 42);
    ctx.lineTo(limitX + cartW / 2, trackY + 24);
    ctx.stroke();
    ctx.setLineDash([]);
    drawMixedText(
      ctx,
      limitX + cartW / 2,
      trackY + 42,
      [{ text: 'travel limit' }],
      { fontSize: Math.round(11 * s), color: '#475569', align: 'center', baseline: 'top' }
    );

    drawMixedText(
      ctx,
      cartStartX + (limitX - cartStartX) / 2,
      trackY + 28,
      [{ text: 'x', italic: true }, { text: ' = ' + format(state.x, 2) + ' m' }],
      { fontSize: Math.round(13 * s), color: '#475569', align: 'center', baseline: 'top' }
    );

    if (state.atLimit) {
      ctx.fillStyle = '#fee2e2';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.2;
      ctx.fillRect(16, 14, 178, 30);
      ctx.strokeRect(16, 14, 178, 30);
      drawMixedText(
        ctx,
        105,
        29,
        [{ text: 'motion stopped at limit' }],
        { fontSize: 12, color: '#991b1b', align: 'center', baseline: 'middle' }
      );
    }

    if (params.showFbd) {
      const largestForce = Math.max(
        dynamics.cartWeight,
        dynamics.hangerWeight,
        dynamics.normal,
        dynamics.tension,
        dynamics.friction,
        1
      );
      const forceScale = (88 * s) / largestForce;
      const cartArrowX = cartCx;
      const cartArrowY = cartCenterY;
      const hangerArrowX = pulleyX;
      const hangerArrowY = hangerCy;

      const tTip = drawArrow(ctx, cartArrowX, cartArrowY, dynamics.tension * forceScale, 0, 'var(--color-force-app)', lw, true);
      drawMixedText(
        ctx,
        tTip.hx + 10,
        tTip.hy,
        [{ text: 'T', italic: true, vector: true }],
        { fontSize: fs, color: 'var(--color-force-app)', align: 'left', baseline: 'middle', halo: true }
      );

      const nTip = drawArrow(ctx, cartArrowX, cartArrowY, dynamics.normal * forceScale, -Math.PI / 2, 'var(--color-normal)', lw, true);
      drawMixedText(
        ctx,
        nTip.hx,
        nTip.hy - 8,
        [{ text: 'N', italic: true, vector: true }],
        { fontSize: fs, color: 'var(--color-normal)', align: 'center', baseline: 'bottom', halo: true }
      );

      const wcTip = drawArrow(ctx, cartArrowX, cartArrowY, dynamics.cartWeight * forceScale, Math.PI / 2, 'var(--color-gravity)', lw, true);
      drawMixedText(
        ctx,
        wcTip.hx,
        wcTip.hy + 10,
        [{ text: 'm', italic: true }, { text: 'c', subscript: true, italic: false }, { text: 'g', italic: true }],
        { fontSize: fs, color: 'var(--color-gravity)', align: 'center', baseline: 'top', halo: true }
      );

      if (params.frictionEnabled && dynamics.friction > 0.05) {
        const fTip = drawArrow(ctx, cartArrowX, trackY - 10, dynamics.friction * forceScale, Math.PI, 'var(--color-friction)', lw, true);
        drawMixedText(
          ctx,
          fTip.hx - 10,
          fTip.hy,
          [
            { text: 'f', italic: true, vector: true },
            { text: dynamics.regime === 'static' ? 's' : 'k', subscript: true, italic: false }
          ],
          { fontSize: fs, color: 'var(--color-friction)', align: 'right', baseline: 'middle', halo: true }
        );
      }

      const htTip = drawArrow(ctx, hangerArrowX, hangerArrowY, dynamics.tension * forceScale, -Math.PI / 2, 'var(--color-force-app)', lw, true);
      drawMixedText(
        ctx,
        htTip.hx + 10,
        htTip.hy,
        [{ text: 'T', italic: true, vector: true }],
        { fontSize: fs, color: 'var(--color-force-app)', align: 'left', baseline: 'middle', halo: true }
      );

      const whTip = drawArrow(ctx, hangerArrowX, hangerArrowY, dynamics.hangerWeight * forceScale, Math.PI / 2, 'var(--color-gravity)', lw, true);
      drawMixedText(
        ctx,
        whTip.hx + 12,
        whTip.hy,
        [{ text: 'm', italic: true }, { text: 'h', subscript: true, italic: false }, { text: 'g', italic: true }],
        { fontSize: fs, color: 'var(--color-gravity)', align: 'left', baseline: 'middle', halo: true }
      );
    }

    if (dynamics.a > 0.01 && !state.atLimit) {
      const accelLen = Math.max(18 * s, dynamics.a * 24 * s);
      const aTip = drawArrow(ctx, cartCx - 12 * s, cartTop - 28 * s, accelLen, 0, 'var(--color-accel)', lw, true);
      drawMixedText(
        ctx,
        aTip.hx + 10,
        aTip.hy,
        [{ text: 'a', italic: true, vector: true }],
        { fontSize: fs, color: 'var(--color-accel)', align: 'left', baseline: 'middle', halo: true }
      );
      const haTip = drawArrow(ctx, pulleyX + hangerW / 2 + 18 * s, hangerCy - 20 * s, accelLen, Math.PI / 2, 'var(--color-accel)', lw, true);
      drawMixedText(
        ctx,
        haTip.hx,
        haTip.hy + 8,
        [{ text: 'a', italic: true, vector: true }],
        { fontSize: fs, color: 'var(--color-accel)', align: 'center', baseline: 'top', halo: true }
      );
    }
  }, [dynamics, fontsReady, params.showFbd, state, stageGen]);

  useEffect(() => {
    if (!params.showGraph) return;
    const canvas = velocityChartRef.current;
    if (!canvas) return;

    const width = canvas.parentElement!.clientWidth;
    const height = 170;
    const ctx = scaleCanvas(canvas, width, height);

    drawCoordinateGrid(ctx, width, height, {
      backgroundColor: '#fcfdfd',
      gridColor: '#e2e8f0',
      subdivisionColor: '#f8fafc'
    });

    const padL = 54;
    const padR = 14;
    const padT = 16;
    const padB = 38;
    const chartW = width - padL - padR;
    const chartH = height - padT - padB;
    const hist = velocityHistoryRef.current;
    const maxSpeed = Math.max(0.5, Math.abs(state.v), ...hist.map(v => Math.abs(v))) * 1.2;
    const mapI = (i: number) => padL + (i / Math.max(1, VEL_HISTORY - 1)) * chartW;
    const mapV = (v: number) => padT + chartH - (v / maxSpeed) * chartH;

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(padL, padT, chartW, chartH);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, mapV(0));
    ctx.lineTo(padL + chartW, mapV(0));
    ctx.stroke();

    for (const tick of [0, maxSpeed / 2, maxSpeed]) {
      drawMixedText(
        ctx,
        padL - 8,
        mapV(tick),
        [{ text: tick.toFixed(1) }],
        { fontSize: 12, color: '#475569', align: 'right', baseline: 'middle' }
      );
    }

    ctx.save();
    ctx.translate(14, padT + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    drawMixedText(
      ctx,
      0,
      0,
      [{ text: 'v', italic: true }, { text: '  (m/s)' }],
      { fontSize: 14, color: '#334155', align: 'center' }
    );
    ctx.restore();

    drawMixedText(
      ctx,
      padL + chartW / 2,
      height - 5,
      [{ text: 'recent time' }],
      { fontSize: 12, color: '#475569', align: 'center', baseline: 'bottom' }
    );

    if (hist.length > 1) {
      ctx.strokeStyle = resolveColor('var(--color-vel)');
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      hist.forEach((v, i) => {
        const px = mapI(i + VEL_HISTORY - hist.length);
        const py = mapV(v);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      ctx.fillStyle = resolveColor('var(--color-vel)');
      ctx.beginPath();
      ctx.arc(mapI(VEL_HISTORY - 1), mapV(hist[hist.length - 1]), 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, [params.showGraph, state, fontsReady]);

  const regimeLabel = dynamics.regime === 'frictionless'
    ? 'NO FRICTION'
    : dynamics.regime === 'static'
      ? 'STATIC'
      : 'KINETIC';
  const regimeColors = dynamics.regime === 'static'
    ? { background: '#dcfce7', color: '#166534' }
    : dynamics.regime === 'kinetic'
      ? { background: '#fef3c7', color: '#92400e' }
      : { background: '#dbeafe', color: '#1e40af' };

  return (
    <SimulationLayout
      title="Newton's 2nd Law: Cart and Hanging Mass"
      description="Connected Systems - Tension, acceleration, and free-body diagrams."
      slug="newtons-second-law-cart"
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
            <span style={{ color: 'var(--color-force-app)', fontWeight: 600 }}>{'-> '}<InlineMath math="\vec{T}" /></span>
            <span style={{ color: 'var(--color-normal)', fontWeight: 600 }}>{'-> '}<InlineMath math="\vec{N}" /></span>
            <span style={{ color: 'var(--color-gravity)', fontWeight: 600 }}>{'-> '}<InlineMath math="\vec{F}_g" /></span>
            <span style={{ color: 'var(--color-friction)', fontWeight: 600 }}>{'-> '}<InlineMath math="\vec{f}" /></span>
            <span style={{ color: 'var(--color-accel)', fontWeight: 600 }}>{'-> '}<InlineMath math="\vec{a}" /></span>
            <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: '12px', padding: '3px 12px', borderRadius: 99, ...regimeColors }}>
              {regimeLabel}
            </span>
            <button
              type="button"
              className="secondary"
              style={{ padding: '2px 10px', fontSize: '12px', height: 'auto', lineHeight: '1.4' }}
              onClick={() => setParams(p => ({ ...p, showGraph: !p.showGraph }))}
            >
              {params.showGraph ? '▲ Collapse Graph' : '▼ Expand Graph'}
            </button>
          </div>
          <div className="sim-stage sim-stage-split" style={{ ['--sim-stage-h' as string]: params.showGraph ? '430px' : '580px' }}>
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
          </div>
          {params.showGraph && (
            <div style={{ borderTop: '1px solid var(--border-color)', background: '#fff' }}>
              <div 
                onClick={() => setParams(p => ({ ...p, showGraph: false }))}
                style={{ 
                  padding: '8px 16px', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  color: '#475569', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  background: '#f8fafc',
                  cursor: 'pointer'
                }}
              >
                <span>Speed <InlineMath math="v" /> vs recent time</span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>▲ Collapse</span>
              </div>
              <div style={{ width: '100%', height: '170px' }}>
                <canvas ref={velocityChartRef} style={{ display: 'block', width: '100%', height: '100%' }} />
              </div>
            </div>
          )}
        </>
      }

      theoryContent={
        <div style={{ padding: '16px', fontSize: '15px', lineHeight: '1.6' }}>
          <p>
            The cart and hanger share one acceleration because the string length is fixed. Without friction, the hanging weight is the only external force along the direction of motion for the two-object system.
          </p>
          <BlockMath math="a = \frac{m_h g}{m_c + m_h}" />
          <p>
            For individual objects, Newton's second law gives the tension from either free-body diagram:
          </p>
          <BlockMath math="T = m_c a \qquad T = m_h(g-a)" />
          <p>
            With friction enabled, static friction first adjusts up to its threshold. If the hanging weight exceeds that threshold, kinetic friction sets the moving-system acceleration.
          </p>
          <BlockMath math="f_{s,\max}=\mu_s m_c g" />
          <BlockMath math="a = \frac{m_h g - \mu_k m_c g}{m_c + m_h}" />
          <p>
            Tension is internal to the combined cart-hanger system, so it does not appear in the system-level net external force.
          </p>
        </div>
      }

      controlsContent={
        <>
          <ControlRow label={<>Cart mass <InlineMath math="m_c" /> (kg)</>} name="mCart" min="0.5" max="12" step="0.1" value={params.mCart} onChange={handleNumberChange} onReset={() => setParams(p => ({ ...p, mCart: DEFAULT_PARAMS.mCart }))} />
          <ControlRow label={<>Hanging mass <InlineMath math="m_h" /> (kg)</>} name="mHanger" min="0.1" max="6" step="0.1" value={params.mHanger} onChange={handleNumberChange} onReset={() => setParams(p => ({ ...p, mHanger: DEFAULT_PARAMS.mHanger }))} />
          <ControlRow label={<>Gravity <InlineMath math="g" /> (m/s^2)</>} name="g" min="1" max="20" step="0.1" value={params.g} onChange={handleNumberChange} onReset={() => setParams(p => ({ ...p, g: DEFAULT_PARAMS.g }))} />
          <ToggleRow label="Enable friction" name="frictionEnabled" checked={params.frictionEnabled} onChange={handleToggleChange} />
          {params.frictionEnabled && (
            <>
              <ControlRow label={<>Static <InlineMath math="\mu_s" /></>} name="muS" min="0" max="1.2" step="0.01" value={params.muS} onChange={handleNumberChange} onReset={() => setParams(p => ({ ...p, muS: DEFAULT_PARAMS.muS }))} />
              <ControlRow label={<>Kinetic <InlineMath math="\mu_k" /></>} name="muK" min="0" max={params.muS.toString()} step="0.01" value={params.muK} onChange={handleNumberChange} onReset={() => setParams(p => ({ ...p, muK: DEFAULT_PARAMS.muK }))} />
            </>
          )}
          <ToggleRow label="Free-body vectors" name="showFbd" checked={params.showFbd} onChange={handleToggleChange} />
          <ToggleRow label="Motion graph" name="showGraph" checked={params.showGraph} onChange={handleToggleChange} />
        </>
      }

      metricsContent={
        <>
          <MetricRow label={<>Acceleration <InlineMath math="a" /></>} value={`${format(dynamics.a)} m/s^2`} color="var(--color-accel)" />
          <MetricRow label={<>Tension <InlineMath math="T" /></>} value={`${format(dynamics.tension)} N`} color="var(--color-force-app)" />
          <MetricRow label={<>Cart normal <InlineMath math="N" /></>} value={`${format(dynamics.normal, 1)} N`} />
          <MetricRow label={<>Max static <InlineMath math="f_{s,\max}" /></>} value={`${format(dynamics.fsMax, 1)} N`} />
          <MetricRow label={<>Actual friction <InlineMath math="f" /></>} value={`${format(dynamics.friction, 1)} N`} color="var(--color-friction)" />
          <MetricRow label={<>System net force <InlineMath math="F_{\text{net}}" /></>} value={`${format(dynamics.netExternal, 2)} N`} />
          <MetricRow label={<>Position <InlineMath math="x" /></>} value={`${format(state.x, 2)} m`} />
          <MetricRow label={<>Speed <InlineMath math="v" /></>} value={`${format(Math.abs(state.v), 2)} m/s`} color="var(--color-vel)" last />
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
  <div style={{ display: 'grid', gridTemplateColumns: '142px 1fr 68px auto', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
    <label style={{ fontSize: '13px', fontWeight: 500 }}>{label}</label>
    <input type="range" name={name} min={min} max={max} step={step} value={value} onChange={onChange} />
    <input type="number" name={name} min={min} max={max} step={step} value={value} onChange={onChange} style={{ fontSize: '13px', padding: '4px 6px' }} />
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

const ToggleRow = ({ label, name, checked, onChange }: {
  label: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 500, margin: '9px 0' }}>
    <input type="checkbox" name={name} checked={checked} onChange={onChange} />
    {label}
  </label>
);

const MetricRow = ({ label, value, color, last = false }: {
  label: React.ReactNode;
  value: string;
  color?: string;
  last?: boolean;
}) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', paddingBottom: last ? 0 : '8px', borderBottom: last ? 'none' : '1px solid var(--border-color)', marginBottom: last ? 0 : '8px' }}>
    <span className="text-muted">{label}</span>
    <span style={{ fontWeight: 600, color }}>{value}</span>
  </div>
);
