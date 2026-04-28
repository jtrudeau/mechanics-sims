// Shared canvas drawing utilities for mechanics simulations

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  len: number,
  ang: number,
  color: string,
  lineWidth: number = 3
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  
  // Line
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(len, 0);
  ctx.stroke();
  
  // Head
  ctx.beginPath();
  ctx.moveTo(len, 0);
  ctx.lineTo(len - 10, -6);
  ctx.lineTo(len - 10, 6);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
  
  // Return tip coordinates for labels
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
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.font = 'italic 16px "STIX Two Text", serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  
  // Offset perpendicular to arrow
  const nx = -Math.sin(ang);
  const ny = Math.cos(ang);
  
  ctx.fillText(text, nx * offset, ny * offset);
  ctx.restore();
}

// Device pixel ratio scaling for crisp canvas on Retina screens
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
