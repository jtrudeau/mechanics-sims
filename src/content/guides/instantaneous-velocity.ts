import type { SimGuideContent } from '../types';

export const instantaneousVelocityGuide: SimGuideContent = {
  learningGoals: [
    'Distinguish average velocity (secant slope) from instantaneous velocity (tangent slope).',
    'See that shrinking $\\Delta t$ makes the secant approach the tangent.',
    'Connect the rise-over-run picture on an $x$–$t$ graph to $v = \\mathrm{d}x/\\mathrm{d}t$.',
    'Predict how changing $a$, $v_0$, or $t_1$ changes the tangent slope.',
  ],
  howToUse: [
    'Set a nonzero acceleration $a$ so the position curve is clearly parabolic.',
    'Pick a time $t_1$ on the curve and watch the green tangent at that point.',
    'Start with a large $\\Delta t$ and compare the blue secant slope to the tangent.',
    'Decrease $\\Delta t$ until the Live Dynamics “Convergence” badge approaches 100%.',
    'Change $a$ or $v_0$ and re-check: the tangent slope should match $v(t_1) = v_0 + a t_1$.',
  ],
  watchFors: [
    'Treating the secant slope as “the” velocity at $t_1$ when $\\Delta t$ is still large.',
    'Confusing the slope of $x(t)$ with the height of the curve (position is not velocity).',
    'Assuming instantaneous velocity is always the same as average velocity over the whole trip.',
    'Forgetting that a negative slope means negative velocity (motion toward $-x$).',
  ],
  canvasTips: [
    'Blue dashed line = secant (average velocity over $\\Delta t$).',
    'Green solid line = tangent at $t_1$ (instantaneous velocity).',
    'The shaded $\\Delta t$–$\\Delta x$ triangle is rise-over-run for the secant only.',
    'Convergence % compares secant slope to the true tangent slope.',
  ],
  tryThis:
    'Halve $\\Delta t$ and compare the secant slope with $v(t_1)$. Does the Convergence reading increase?',
  revisionProblems: [
    {
      id: 'iv-1',
      prompt:
        'With $a = 1\\,\\mathrm{m/s}^2$, $v_0 = 2\\,\\mathrm{m/s}$, and $t_1 = 2\\,\\mathrm{s}$, what is the instantaneous velocity? What average velocity do you expect for $\\Delta t = 2\\,\\mathrm{s}$?',
      hint: 'Use $v(t) = v_0 + a t$ for the tangent. For the secant, compute $\\Delta x$ over $[t_1,\\, t_1+\\Delta t]$ and divide by $\\Delta t$.',
      checkWithSim: [
        'Set $a = 1$, $v_0 = 2$, $t_1 = 2$, $\\Delta t = 2$.',
        'Read Instant vel $v(t_1)$ and Secant slope in Live Dynamics.',
      ],
      answer:
        'Instantaneous: $v(2) = 2 + 1\\cdot 2 = 4\\,\\mathrm{m/s}$. Average over $\\Delta t = 2\\,\\mathrm{s}$: $v_\\mathrm{avg} = [x(4) - x(2)]/2$. With $x(t) = 2t + \\tfrac{1}{2}t^2$, $x(4) = 16$ and $x(2) = 6$, so $v_\\mathrm{avg} = 5\\,\\mathrm{m/s}$. Secant is steeper than the tangent when $\\Delta t$ is large and $a > 0$.',
      simParams: { x0: 0, v0: 2, a: 1, t1: 2, dt: 2, tMax: 8 },
    },
    {
      id: 'iv-2',
      prompt:
        'Keep $a = 1$ and $t_1 = 2$. Shrink $\\Delta t$ from $2\\,\\mathrm{s}$ to $0.05\\,\\mathrm{s}$. Describe what happens to the secant and the Convergence badge.',
      hint: 'The definition of the derivative is the limit of the secant slope as $\\Delta t \\to 0$.',
      checkWithSim: [
        'Start at $\\Delta t = 2$ and note Convergence.',
        'Lower $\\Delta t$ in steps toward $0.05$ and watch the blue secant hug the green tangent.',
      ],
      answer:
        'The blue secant rotates toward the green tangent; Convergence rises toward $\\sim 100\\%$. Instantaneous velocity is the limiting slope, not any single large-$\\Delta t$ average.',
      simParams: { x0: 0, v0: 2, a: 1, t1: 2, dt: 2, tMax: 8 },
    },
    {
      id: 'iv-3',
      prompt:
        'Set $a = -2\\,\\mathrm{m/s}^2$, $v_0 = 8\\,\\mathrm{m/s}$, $t_1 = 3\\,\\mathrm{s}$. Is the object still moving in the $+x$ direction at $t_1$? How do you know from the graph?',
      hint: 'Sign of the tangent slope is the sign of velocity.',
      checkWithSim: [
        'Set $a = -2$, $v_0 = 8$, $t_1 = 3$.',
        'Read $v(t_1)$ and inspect the tangent direction on the canvas.',
      ],
      answer:
        '$v(3) = 8 + (-2)\\cdot 3 = 2\\,\\mathrm{m/s} > 0$, so still $+x$. The tangent still slopes upward (positive), even though acceleration is negative (velocity is decreasing).',
      simParams: { x0: 0, v0: 8, a: -2, t1: 3, dt: 1, tMax: 8 },
    },
    {
      id: 'iv-4',
      prompt:
        'A classmate says “average velocity from $0$ to $t_\\mathrm{max}$ equals the slope at the midpoint.” When is that true for this sim’s parabolic $x(t)$?',
      hint: 'For constant acceleration, average velocity over an interval equals the instantaneous velocity at the midpoint of that interval.',
      checkWithSim: [
        'Pick any $a$, $v_0$, and an interval $[t_1,\\, t_1+\\Delta t]$.',
        'Compare secant slope to $v$ at $t_1 + \\Delta t/2$.',
      ],
      answer:
        'True for constant $a$: $v_\\mathrm{avg} = v(t_\\mathrm{mid})$. It fails if you compare the full-trip average to the slope at an arbitrary point that is not the midpoint, or if $a$ were not constant.',
      simParams: { x0: 0, v0: 2, a: 1, t1: 1, dt: 2, tMax: 8 },
    },
  ],
};
