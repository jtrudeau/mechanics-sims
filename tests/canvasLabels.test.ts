import { describe, expect, it } from 'vitest';
import { CSS_VAR_FALLBACKS, placeLabelBeside, placeLabelBeyond, placeTipLabel } from '../src/components/physics/drawUtils';

describe('canvas palette fallbacks', () => {
  it('matches the stylesheet tokens that had drifted', () => {
    expect(CSS_VAR_FALLBACKS['--color-vel']).toBe('#047857');
    expect(CSS_VAR_FALLBACKS['--color-accel']).toBe('#5b21b6');
    expect(CSS_VAR_FALLBACKS['--color-accel-radial']).toBe('#9a3412');
    expect(CSS_VAR_FALLBACKS['--color-accel-tangential']).toBe('#9f1239');
  });
});

describe('placeTipLabel', () => {
  it('places a rightward label past the tip', () => {
    const place = placeTipLabel(100, 50, 0, 12);
    expect(place.x).toBeCloseTo(112);
    expect(place.y).toBeCloseTo(50);
    expect(place.align).toBe('left');
    expect(place.baseline).toBe('middle');
  });

  it('places a leftward label past the tip', () => {
    const place = placeTipLabel(100, 50, Math.PI, 12);
    expect(place.x).toBeCloseTo(88);
    expect(place.y).toBeCloseTo(50);
    expect(place.align).toBe('right');
    expect(place.baseline).toBe('middle');
  });

  it('places a downward label past the tip', () => {
    const place = placeTipLabel(100, 50, Math.PI / 2, 12);
    expect(place.x).toBeCloseTo(100);
    expect(place.y).toBeCloseTo(62);
    expect(place.align).toBe('center');
    expect(place.baseline).toBe('top');
  });

  it('places an upward label past the tip', () => {
    const place = placeTipLabel(100, 50, -Math.PI / 2, 12);
    expect(place.x).toBeCloseTo(100);
    expect(place.y).toBeCloseTo(38);
    expect(place.align).toBe('center');
    expect(place.baseline).toBe('bottom');
  });
});

describe('placeLabelBeyond', () => {
  it('keeps a short arrow label clear of the body', () => {
    const place = placeLabelBeyond(0, 0, 4, 0, 0, 12, 40);
    expect(place.x).toBeCloseTo(40);
    expect(place.y).toBeCloseTo(0);
    expect(place.align).toBe('left');
  });

  it('stays a gap past a long arrow tip', () => {
    const place = placeLabelBeyond(0, 0, 80, 0, 0, 12, 40);
    expect(place.x).toBeCloseTo(92);
    expect(place.y).toBeCloseTo(0);
  });
});

describe('placeLabelBeside', () => {
  it('offsets a short inward label off the shaft', () => {
    const place = placeLabelBeside(0, 0, -4, 0, Math.PI, 22, 26);
    expect(place.x).toBeCloseTo(-22);
    expect(place.y).toBeCloseTo(-26);
    expect(place.baseline).toBe('bottom');
  });
});
