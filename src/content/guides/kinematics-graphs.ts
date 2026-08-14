import type { SimGuideContent } from '../types';

export const kinematicsGraphsGuide: SimGuideContent = {
  learningGoals: [
    'Read $x(t)$, $v(t)$, and $a(t)$ as a stacked family of graphs for the same motion.',
    'Interpret slope: the slope of $x$–$t$ is $v$; the slope of $v$–$t$ is $a$.',
    'Interpret signed area: the area under $v$–$t$ is $\\Delta x$; the area under $a$–$t$ is $\\Delta v$.',
    'Match a moving object to the three graphs, including sign (direction) and piecewise segments.',
  ],
  howToUse: [
    'Pick a motion profile (constant $v$, constant $a$, accelerate–cruise–brake, or a turnaround).',
    'Play the cart and watch the cursor sweep all three graphs together.',
    'Set the analysis interval $[t_A, t_B]$ and compare the $x$–$t$ slope with $v_\\mathrm{avg}$.',
    'Shade the $v$–$t$ graph and check that the signed area equals $\\Delta x$ in Live Dynamics.',
    'On the turnaround profile, note that $v$ changes sign while $a$ stays negative.',
  ],
  watchFors: [
    'Reading the height of an $x$–$t$ graph as speed (height is position; slope is velocity).',
    'Treating area as always positive — signed area below the $t$-axis is negative displacement or $\\Delta v$.',
    'Assuming a curved $x$–$t$ graph means the object is on a curved path; it is 1-D motion.',
    'Forgetting that constant $a$ makes $v$–$t$ a straight line and $x$–$t$ a parabola.',
  ],
  canvasTips: [
    'Top strip: the cart. The three graphs share one time axis and one cursor.',
    'Blue dashed secant = average slope on the chosen interval.',
    'Green shading on $v$–$t$ is $\\Delta x$; purple shading on $a$–$t$ is $\\Delta v$.',
    'Live Dynamics reports slope, area, and the instantaneous values at the cursor.',
  ],
  tryThis:
    'On accelerate–cruise–brake, set $[t_A, t_B]$ over the cruise segment only. Is the $x$–$t$ slope equal to the $v$–$t$ height? Why is the $a$–$t$ area zero there?',
  revisionProblems: [
    {
      id: 'kg-1',
      prompt:
        'Constant acceleration: $a = 2\\,\\mathrm{m/s}^2$, $v_0 = 0$, $x_0 = 0$. What is $v$ at $t = 3\\,\\mathrm{s}$? What is $x$ at that time?',
      hint: 'Use $v = v_0 + a t$ and $x = x_0 + v_0 t + \\tfrac{1}{2} a t^2$. Check against the graphs at the cursor.',
      checkWithSim: [
        'Choose Constant $a$, set $a = 2$, $v_0 = 0$, $x_0 = 0$.',
        'Move the cursor to $t = 3\\,\\mathrm{s}$ and read Live Dynamics.',
      ],
      answer: '$v(3) = 6\\,\\mathrm{m/s}$. $x(3) = \\tfrac{1}{2}(2)(9) = 9\\,\\mathrm{m}$.',
      simParams: { profile: 'const-a', a: 2, v0: 0, x0: 0, tMax: 8, tCursor: 3 },
    },
    {
      id: 'kg-2',
      prompt:
        'Same motion as kg-1. The signed area under $v$–$t$ from $0$ to $3\\,\\mathrm{s}$ should equal $\\Delta x$. Compute that area as a triangle and compare.',
      hint: '$v$–$t$ is a straight line from $0$ to $6\\,\\mathrm{m/s}$. Area of a triangle is $\\tfrac{1}{2}$ base $\\times$ height.',
      checkWithSim: [
        'Set $t_A = 0$, $t_B = 3$ and enable $v$–$t$ area shading.',
        'Compare the reported area with $x(3) - x(0)$.',
      ],
      answer:
        'Triangle: $\\tfrac{1}{2}(3)(6) = 9\\,\\mathrm{m} = \\Delta x$. Slope of $x$–$t$ on the same interval is $v_\\mathrm{avg} = 9/3 = 3\\,\\mathrm{m/s}$, which equals $v$ at the midpoint $t = 1.5\\,\\mathrm{s}$.',
      simParams: { profile: 'const-a', a: 2, v0: 0, x0: 0, tMax: 8, tA: 0, tB: 3, tCursor: 3 },
    },
    {
      id: 'kg-3',
      prompt:
        'Turnaround profile ($a = -2\\,\\mathrm{m/s}^2$, $v_0 = 8\\,\\mathrm{m/s}$). At what time does $v$ change sign? Is the object still moving in $+x$ just before that time?',
      hint: '$v(t) = 8 - 2t = 0$ when $t = 4\\,\\mathrm{s}$. Sign of $v$ is the direction of motion.',
      checkWithSim: [
        'Choose Turnaround. Watch $v$–$t$ cross the axis.',
        'Note that $x$–$t$ has a peak (slope zero) at the same instant.',
      ],
      answer:
        '$v = 0$ at $t = 4\\,\\mathrm{s}$. Before that, $v > 0$ so the cart still moves $+x$ even though it is slowing down ($a < 0$). After $t = 4\\,\\mathrm{s}$ it returns toward smaller $x$.',
      simParams: { profile: 'turnaround', tMax: 8, tCursor: 4 },
    },
    {
      id: 'kg-4',
      prompt:
        'Accelerate–cruise–brake. During the cruise segment, what should the $a$–$t$ graph look like, and what is the slope of $v$–$t$?',
      hint: 'Cruise means constant velocity: $a = 0$ and $v$–$t$ is horizontal.',
      checkWithSim: [
        'Choose Accel–cruise–brake.',
        'Place $[t_A, t_B]$ entirely inside the middle (flat $v$) interval.',
      ],
      answer:
        '$a = 0$ (flat on the $t$-axis). Slope of $v$–$t$ is zero. Slope of $x$–$t$ equals the cruise speed (the height of the $v$–$t$ plateau).',
      simParams: { profile: 'cruise', tA: 2.5, tB: 4.5, tCursor: 3.5 },
    },
  ],
};
