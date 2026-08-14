import type { SimGuideContent } from '../types';

export const frictionGuide: SimGuideContent = {
  learningGoals: [
    'Explain how static friction matches an applied force up to $\\mu_s N$.',
    'Identify the break-away threshold and the drop to kinetic friction.',
    'Relate $\\mu_s$, $\\mu_k$, and mass to the forces shown on the free-body diagram.',
    'Predict whether the block stays at rest or accelerates for a given $F_\\mathrm{app}$.',
  ],
  howToUse: [
    'Start with $F_\\mathrm{app} = 0$ and confirm the block is at rest with $f = 0$.',
    'Slowly increase $F_\\mathrm{app}$ while watching friction grow to match it.',
    'Note the status badge when $F_\\mathrm{app}$ exceeds $\\mu_s N$ (break-away).',
    'After motion starts, compare kinetic friction $\\mu_k N$ to the previous static peak.',
    'Change $\\mu_s$ / $\\mu_k$ / mass and re-find the threshold.',
  ],
  watchFors: [
    'Thinking friction is always $\\mu N$ even when the object is at rest with a small push.',
    'Assuming kinetic friction is larger than static friction.',
    'Forgetting that normal force here is $N = mg$ on a horizontal surface.',
    'Confusing “friction opposes the push” with “friction always points left.”',
  ],
  canvasTips: [
    'Blue arrow = applied force; crimson = friction; teal = normal; purple = gravity.',
    'The status badge (static / kinetic / at rest) is the fastest check of regime.',
    'The force graph shows friction rising with $F_\\mathrm{app}$, then dropping at break-away.',
    'Velocity appears only after kinetic friction takes over and net force is nonzero.',
  ],
  tryThis:
    'Compute $f_{s,\\max}$ from $\\mu_s$ and $m$, then raise $F_\\mathrm{app}$ until motion begins. Compare your threshold with the Live Dynamics reading.',
  revisionProblems: [
    {
      id: 'fr-1',
      prompt:
        '$m = 5\\,\\mathrm{kg}$, $\\mu_s = 0.40$, $\\mu_k = 0.25$, $g = 9.8\\,\\mathrm{m/s}^2$. What is the maximum static friction? What kinetic friction acts once sliding?',
      hint: '$f_{s,\\max} = \\mu_s mg$ and $f_k = \\mu_k mg$.',
      checkWithSim: [
        'Set mass to $5$, $\\mu_s = 0.40$, $\\mu_k = 0.25$.',
        'Raise $F_\\mathrm{app}$ just past break-away and read the friction metric.',
      ],
      answer:
        '$f_{s,\\max} \\approx 0.40 \\times 5 \\times 9.8 = 19.6\\,\\mathrm{N}$. Once sliding, $f_k \\approx 0.25 \\times 5 \\times 9.8 = 12.25\\,\\mathrm{N}$. Kinetic is smaller than the static maximum.',
      simParams: { mass: 5, mu_s: 0.4, mu_k: 0.25, F_app: 20 },
    },
    {
      id: 'fr-2',
      prompt:
        'With the values from problem 1, is $F_\\mathrm{app} = 15\\,\\mathrm{N}$ enough to start motion? What about $F_\\mathrm{app} = 22\\,\\mathrm{N}$?',
      hint: 'Compare $F_\\mathrm{app}$ to $f_{s,\\max}$. After motion, net force is $F_\\mathrm{app} - f_k$.',
      checkWithSim: [
        'Set $F_\\mathrm{app} = 15$ and note the status badge.',
        'Reset if needed, then set $F_\\mathrm{app} = 22$ and watch velocity grow.',
      ],
      answer:
        '$15\\,\\mathrm{N} < 19.6\\,\\mathrm{N}$ → stays at rest; static friction equals $15\\,\\mathrm{N}$. $22\\,\\mathrm{N} > 19.6\\,\\mathrm{N}$ → break-away; then $f_k \\approx 12.25\\,\\mathrm{N}$ and $a = (22 - 12.25)/5 \\approx 1.95\\,\\mathrm{m/s}^2$.',
      simParams: { mass: 5, mu_s: 0.4, mu_k: 0.25, F_app: 15 },
    },
    {
      id: 'fr-3',
      prompt:
        'Double the mass, keep $\\mu_s$ and $\\mu_k$ fixed. Does the break-away $F_\\mathrm{app}$ double? Does the acceleration after break-away for a fixed $F_\\mathrm{app}$ stay the same?',
      hint: 'Threshold forces scale with $N = mg$; acceleration depends on net force over mass.',
      checkWithSim: [
        'Note break-away $F_\\mathrm{app}$ at $m = 5$.',
        'Set $m = 10$ and find the new break-away value.',
        'Compare acceleration at the same $F_\\mathrm{app}$ above both thresholds.',
      ],
      answer:
        'Break-away $F_\\mathrm{app}$ doubles because $f_{s,\\max} \\propto m$. After sliding, $a = (F_\\mathrm{app} - \\mu_k mg)/m = F_\\mathrm{app}/m - \\mu_k g$, so for fixed $F_\\mathrm{app}$ the acceleration decreases when $m$ increases.',
      simParams: { mass: 5, mu_s: 0.4, mu_k: 0.25, F_app: 15 },
    },
    {
      id: 'fr-4',
      prompt:
        'A student claims “once it starts moving, friction jumps up.” Use the graph and badge to argue for or against.',
      hint: 'Watch friction at the moment the regime switches from static to kinetic.',
      checkWithSim: [
        'Increase $F_\\mathrm{app}$ slowly through break-away.',
        'Watch the friction trace and Live Dynamics value at the switch.',
      ],
      answer:
        'False for typical $\\mu_k < \\mu_s$: friction drops from $f_{s,\\max}$ to $f_k$ at break-away. That drop is why a suddenly nonzero push produces a noticeable acceleration.',
      simParams: { mass: 5, mu_s: 0.4, mu_k: 0.25, F_app: 18 },
    },
  ],
};
