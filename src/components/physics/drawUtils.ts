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
