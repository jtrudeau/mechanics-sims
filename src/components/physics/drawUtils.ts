// Shared canvas drawing utilities for mechanics simulations

// Fallback palette mapping for textbook scientific colors when CSS variables cannot be parsed directly in canvas
export const CSS_VAR_FALLBACKS: Record<string, string> = {
  '--color-force-app': '#1d4ed8',       // Royal Indigo
  '--color-friction': '#b91c1c',        // Deep Crimson
  '--color-normal': '#0f766e',          // Teal Forest
  '--color-gravity': '#581c87',         // Slate Royal Purple
  '--color-vel': '#15803d',             // Emerald Green
  '--color-accel': '#6b21a8',           // Deep Violet
  '--color-accel-radial': '#b45309',     // Ochre Orange
  '--color-accel-tangential': '#c2410c'  // Warm Vermillion
};

// Resolves a CSS variable color string like 'var(--color-gravity)' to its actual hex/rgb value
export function resolveColor(color: string): string {
  if (!color) return color;
  if (color.startsWith('var(')) {
    const match = color.match(/var\(([^)]+)\)/);
    if (match) {
      const varName = match[1].trim();
      if (typeof window !== 'undefined' && window.getComputedStyle) {
        const val = window.getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        if (val) return val;
      }
      return CSS_VAR_FALLBACKS[varName] || '#000000';
    }
  }
  return color;
}

// Proportional & crisp vector arrow drawing
export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  len: number,
  ang: number,
  color: string,
  lineWidth: number = 4.5
) {
  const absLen = Math.abs(len);
  if (absLen < 1) return { hx: x, hy: y }; // Ignore negligible length vectors

  const resolvedColor = resolveColor(color);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.strokeStyle = resolvedColor;
  ctx.fillStyle = resolvedColor;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Calculate dynamic arrowhead size
  // Shrinks for small vectors so the head never dominates or overflows the shaft
  const headLen = Math.min(absLen * 0.4, Math.max(10, lineWidth * 3.0));
  const headHalfWidth = headLen * 0.6;
  
  const direction = len >= 0 ? 1 : -1;
  const shaftEnd = len - direction * headLen;
  
  // Draw shaft line (stops exactly where the head begins)
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(shaftEnd, 0);
  ctx.stroke();
  
  // Draw sharp, filled arrowhead
  ctx.beginPath();
  ctx.moveTo(len, 0);
  ctx.lineTo(len - direction * headLen, -headHalfWidth);
  ctx.lineTo(len - direction * headLen, headHalfWidth);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
  
  return {
    hx: x + len * Math.cos(ang),
    hy: y + len * Math.sin(ang)
  };
}

export function drawLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ang: number,
  text: string,
  offset: number = 16,
  color: string = '#0f172a'
) {
  const resolvedColor = resolveColor(color);
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = resolvedColor;
  ctx.font = 'italic 16px "KaTeX_Math", "KaTeX_Main", serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  
  const nx = -Math.sin(ang);
  const ny = Math.cos(ang);
  
  ctx.fillText(text, nx * offset, ny * offset);
  ctx.restore();
}

// Device pixel ratio scaling for crisp canvas on Retina/high-res screens
export function scaleCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

/** Scale drawing sizes with canvas min-dimension. 1 at ~420px, up to 1.5 when the stage is large. */
export function sceneScale(width: number, height: number) {
  const m = Math.min(width, height);
  return Math.min(1.7, Math.max(1, m / 420));
}

/** Size a canvas to its parent stage and return CSS-pixel dimensions plus a scene scale. */
export function fitStage(canvas: HTMLCanvasElement, fallbackH = 420) {
  const parent = canvas.parentElement;
  const w = Math.max(1, Math.round(parent?.clientWidth ?? 640));
  const h = Math.max(1, Math.round(parent?.clientHeight || fallbackH));
  const ctx = scaleCanvas(canvas, w, h);
  return { ctx, w, h, s: sceneScale(w, h) };
}

// ─── Mixed-font math label helper ─────────────────────────────────────────────
// Renders label segments with alternating italic math / upright unit fonts,
// and supports vector arrows over text and subscript positioning.
// E.g.  [{text:'F', italic:true, vector:true}, {text:'app', italic:false, subscript:true}]  → "F⃗_app"
export type TextSeg = { 
  text: string; 
  italic?: boolean; 
  vector?: boolean;    // If true, draws a neat textbook vector arrow above the character
  subscript?: boolean; // If true, renders smaller and offset downwards for math subscripts
};

export function drawMixedText(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  segments: TextSeg[],
  opts: {
    fontSize?: number;
    color?: string;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
  } = {}
) {
  const { fontSize = 15, color = '#334155', align = 'left', baseline = 'middle' } = opts;
  const resolvedColor = resolveColor(color);

  const getSegFont = (seg: TextSeg) => {
    const size = seg.subscript ? fontSize * 0.75 : fontSize;
    return seg.italic
      ? `italic ${size}px "KaTeX_Math", "KaTeX_Main", serif`
      : `${size}px "KaTeX_Main", "Inter", sans-serif`;
  };

  ctx.save();
  ctx.fillStyle = resolvedColor;
  ctx.textBaseline = baseline;

  // Measure total width
  let totalW = 0;
  for (const seg of segments) {
    ctx.font = getSegFont(seg);
    totalW += ctx.measureText(seg.text).width;
  }

  let startX = x;
  if (align === 'center') startX = x - totalW / 2;
  else if (align === 'right') startX = x - totalW;

  let curX = startX;
  for (const seg of segments) {
    ctx.font = getSegFont(seg);
    
    // Draw subscript offset downwards
    const curY = seg.subscript ? y + fontSize * 0.25 : y;
    ctx.fillText(seg.text, curX, curY);

    const textWidth = ctx.measureText(seg.text).width;

    // Draw tiny vector arrow above the character if vector flag is true
    if (seg.vector) {
      const curFontSize = seg.subscript ? fontSize * 0.7 : fontSize;
      const refY = seg.subscript ? curY : y;
      let arrowY = refY - curFontSize * 0.5;
      if (baseline === 'middle') {
        arrowY = refY - curFontSize * 0.65;
      } else if (baseline === 'bottom' || baseline === 'alphabetic') {
        arrowY = refY - curFontSize * 1.05;
      } else if (baseline === 'top') {
        arrowY = refY - curFontSize * 0.2;
      }

      const arrowW = Math.max(8, textWidth * 0.7);
      let arrowX = curX + (textWidth - arrowW) / 2;
      if (seg.italic) {
        arrowX += curFontSize * 0.15;
      }

      ctx.save();
      ctx.strokeStyle = resolvedColor;
      ctx.lineWidth = 1.0;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Shaft
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX + arrowW, arrowY);
      ctx.stroke();

      // Head (LaTeX style open arrow - single upper barb)
      ctx.beginPath();
      ctx.moveTo(arrowX + arrowW - curFontSize * 0.18, arrowY - curFontSize * 0.13);
      ctx.lineTo(arrowX + arrowW, arrowY);
      ctx.stroke();

      ctx.restore();
    }

    curX += textWidth;
  }

  ctx.restore();
  return totalW;
}

// ─── Textbook Graph/Ledger Grid Helper ─────────────────────────────────────────
// Renders a high-quality grid paper coordinate system as background
export function drawCoordinateGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opts: {
    gridSize?: number;
    subdivisions?: number;
    gridColor?: string;
    subdivisionColor?: string;
    backgroundColor?: string;
  } = {}
) {
  const {
    gridSize = 40,
    subdivisions = 4,
    gridColor = '#e2e8f0',
    subdivisionColor = '#f1f5f9',
    backgroundColor = '#ffffff'
  } = opts;

  ctx.save();

  // Background base
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  const subGridSize = gridSize / subdivisions;

  // 1. Draw sub-grid lines (very thin, subtle)
  ctx.strokeStyle = subdivisionColor;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let gx = subGridSize; gx < width; gx += subGridSize) {
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, height);
  }
  for (let gy = subGridSize; gy < height; gy += subGridSize) {
    ctx.moveTo(0, gy);
    ctx.lineTo(width, gy);
  }
  ctx.stroke();

  // 2. Draw major grid lines (slightly thicker, stronger color)
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = gridSize; gx < width; gx += gridSize) {
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, height);
  }
  for (let gy = gridSize; gy < height; gy += gridSize) {
    ctx.moveTo(0, gy);
    ctx.lineTo(width, gy);
  }
  ctx.stroke();

  ctx.restore();
}

// ─── Motion graph (x–t, v–t, a–t and rotational analogues) ───────────────────

export type MotionSample = { t: number; y: number };

export type MotionGraphBox = { x: number; y: number; w: number; h: number };

export type MotionGraphResult = {
  mapT: (t: number) => number;
  mapY: (y: number) => number;
  tMin: number;
  tMax: number;
  yMin: number;
  yMax: number;
  /** Signed trapezoid area of the series between fillFrom and fillTo, if those were set. */
  shadedArea: number | null;
};

function niceRange(min: number, max: number, padFrac = 0.14) {
  let lo = min;
  let hi = max;
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi - lo < 1e-9) {
    const mid = Number.isFinite(lo) ? lo : 0;
    lo = mid - 1;
    hi = mid + 1;
  }
  const span = hi - lo;
  lo -= span * padFrac;
  hi += span * padFrac;
  if (lo < 0 && hi > 0) {
    // Keep zero visible when the data straddles it.
    return { lo, hi };
  }
  return { lo, hi };
}

function trapArea(samples: MotionSample[], tA: number, tB: number) {
  if (samples.length < 2) return 0;
  const a = Math.min(tA, tB);
  const b = Math.max(tA, tB);
  let area = 0;
  for (let i = 1; i < samples.length; i++) {
    const t0 = samples[i - 1].t;
    const t1 = samples[i].t;
    const y0 = samples[i - 1].y;
    const y1 = samples[i].y;
    if (t1 <= a || t0 >= b) continue;
    const u0 = Math.max(t0, a);
    const u1 = Math.min(t1, b);
    if (u1 <= u0) continue;
    const f0 = t1 === t0 ? y0 : y0 + ((y1 - y0) * (u0 - t0)) / (t1 - t0);
    const f1 = t1 === t0 ? y1 : y0 + ((y1 - y0) * (u1 - t0)) / (t1 - t0);
    area += 0.5 * (f0 + f1) * (u1 - u0);
  }
  return area;
}

function interpY(samples: MotionSample[], t: number) {
  if (samples.length === 0) return 0;
  if (t <= samples[0].t) return samples[0].y;
  const last = samples[samples.length - 1];
  if (t >= last.t) return last.y;
  for (let i = 1; i < samples.length; i++) {
    if (t <= samples[i].t) {
      const t0 = samples[i - 1].t;
      const t1 = samples[i].t;
      const y0 = samples[i - 1].y;
      const y1 = samples[i].y;
      const u = t1 === t0 ? 0 : (t - t0) / (t1 - t0);
      return y0 + u * (y1 - y0);
    }
  }
  return last.y;
}

/**
 * Draw one kinematics-style graph in a box: series, axes, optional cursor,
 * slope secant, and signed area shading. Used by the graphical-analysis sims
 * and as a compact strip under circular / rotational canvases.
 */
export function drawMotionGraph(
  ctx: CanvasRenderingContext2D,
  box: MotionGraphBox,
  samples: MotionSample[],
  opts: {
    yLabel: TextSeg[];
    xLabel?: TextSeg[];
    color?: string;
    tMin?: number;
    tMax?: number;
    yMin?: number;
    yMax?: number;
    tCursor?: number;
    fillFrom?: number;
    fillTo?: number;
    fillColor?: string;
    slopeFrom?: number;
    slopeTo?: number;
    showXAxis?: boolean;
    tickCount?: number;
  } = { yLabel: [{ text: 'y' }] }
): MotionGraphResult {
  const padL = 52;
  const padR = 12;
  const padT = 10;
  const padB = opts.xLabel ? 28 : 14;
  const plotX = box.x + padL;
  const plotY = box.y + padT;
  const plotW = Math.max(20, box.w - padL - padR);
  const plotH = Math.max(20, box.h - padT - padB);

  const tMin = opts.tMin ?? (samples[0]?.t ?? 0);
  const tMax = opts.tMax ?? (samples[samples.length - 1]?.t ?? 1);
  const tSpan = Math.max(1e-6, tMax - tMin);

  let yLo = opts.yMin;
  let yHi = opts.yMax;
  if (yLo == null || yHi == null) {
    let mn = 0;
    let mx = 0;
    if (samples.length) {
      mn = samples[0].y;
      mx = samples[0].y;
      for (const s of samples) {
        if (s.y < mn) mn = s.y;
        if (s.y > mx) mx = s.y;
      }
    }
    const ranged = niceRange(mn, mx);
    yLo = yLo ?? ranged.lo;
    yHi = yHi ?? ranged.hi;
  }
  const ySpan = Math.max(1e-6, yHi - yLo);

  const mapT = (t: number) => plotX + ((t - tMin) / tSpan) * plotW;
  const mapY = (y: number) => plotY + plotH - ((y - yLo) / ySpan) * plotH;

  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(box.x, box.y, box.w, box.h);

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  const ticks = opts.tickCount ?? 4;
  ctx.beginPath();
  for (let i = 0; i <= ticks; i++) {
    const ty = plotY + (i / ticks) * plotH;
    ctx.moveTo(plotX, ty);
    ctx.lineTo(plotX + plotW, ty);
  }
  const tTicks = Math.min(8, Math.max(3, Math.round(tSpan)));
  for (let i = 0; i <= tTicks; i++) {
    const tx = plotX + (i / tTicks) * plotW;
    ctx.moveTo(tx, plotY);
    ctx.lineTo(tx, plotY + plotH);
  }
  ctx.stroke();

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.3;
  ctx.strokeRect(plotX, plotY, plotW, plotH);

  if (yLo < 0 && yHi > 0) {
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plotX, mapY(0));
    ctx.lineTo(plotX + plotW, mapY(0));
    ctx.stroke();
  }

  let shadedArea: number | null = null;
  if (opts.fillFrom != null && opts.fillTo != null && samples.length > 1) {
    const a = Math.min(opts.fillFrom, opts.fillTo);
    const b = Math.max(opts.fillFrom, opts.fillTo);
    shadedArea = trapArea(samples, a, b);
    const fill = opts.fillColor ?? 'rgba(5, 150, 105, 0.18)';
    ctx.fillStyle = fill;
    ctx.beginPath();
    const y0 = mapY(0);
    let started = false;
    for (let i = 0; i < samples.length; i++) {
      const t = samples[i].t;
      if (t < a || t > b) continue;
      const px = mapT(t);
      const py = mapY(samples[i].y);
      if (!started) {
        ctx.moveTo(px, y0);
        ctx.lineTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    if (started) {
      ctx.lineTo(mapT(Math.min(b, samples[samples.length - 1].t)), y0);
      ctx.closePath();
      ctx.fill();
    }
  }

  if (samples.length > 1) {
    ctx.strokeStyle = resolveColor(opts.color ?? '#334155');
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    samples.forEach((s, i) => {
      const px = mapT(s.t);
      const py = mapY(s.y);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  }

  if (opts.slopeFrom != null && opts.slopeTo != null && samples.length > 1) {
    const t1 = opts.slopeFrom;
    const t2 = opts.slopeTo;
    const y1 = interpY(samples, t1);
    const y2 = interpY(samples, t2);
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(mapT(t1), mapY(y1));
    ctx.lineTo(mapT(t2), mapY(y2));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.arc(mapT(t1), mapY(y1), 3.5, 0, Math.PI * 2);
    ctx.arc(mapT(t2), mapY(y2), 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  if (opts.tCursor != null) {
    const tc = Math.min(tMax, Math.max(tMin, opts.tCursor));
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(mapT(tc), plotY);
    ctx.lineTo(mapT(tc), plotY + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
    if (samples.length) {
      const yc = interpY(samples, tc);
      ctx.fillStyle = resolveColor(opts.color ?? '#334155');
      ctx.beginPath();
      ctx.arc(mapT(tc), mapY(yc), 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  for (let i = 0; i <= ticks; i++) {
    const yVal = yHi - (i / ticks) * ySpan;
    drawMixedText(ctx, plotX - 6, mapY(yVal), [{ text: yVal.toFixed(Math.abs(yVal) >= 10 ? 0 : 1) }], {
      fontSize: 11,
      color: '#64748b',
      align: 'right',
      baseline: 'middle',
    });
  }

  ctx.save();
  ctx.translate(box.x + 14, plotY + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  drawMixedText(ctx, 0, 0, opts.yLabel, {
    fontSize: 12,
    color: '#334155',
    align: 'center',
    baseline: 'middle',
  });
  ctx.restore();

  if (opts.xLabel) {
    for (let i = 0; i <= tTicks; i++) {
      const tVal = tMin + (i / tTicks) * tSpan;
      drawMixedText(ctx, mapT(tVal), plotY + plotH + 12, [{ text: tVal.toFixed(tSpan > 8 ? 0 : 1) }], {
        fontSize: 11,
        color: '#64748b',
        align: 'center',
        baseline: 'middle',
      });
    }
    drawMixedText(ctx, plotX + plotW / 2, box.y + box.h - 4, opts.xLabel, {
      fontSize: 12,
      color: '#334155',
      align: 'center',
      baseline: 'bottom',
    });
  }

  ctx.restore();

  return { mapT, mapY, tMin, tMax, yMin: yLo, yMax: yHi, shadedArea };
}

export function sampleSeries(
  tMin: number,
  tMax: number,
  n: number,
  yOfT: (t: number) => number
): MotionSample[] {
  const samples: MotionSample[] = [];
  const steps = Math.max(2, n);
  for (let i = 0; i <= steps; i++) {
    const t = tMin + (i / steps) * (tMax - tMin);
    samples.push({ t, y: yOfT(t) });
  }
  return samples;
}

export { interpY as interpMotionY };

