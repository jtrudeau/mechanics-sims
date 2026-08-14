import type { SimGuideContent } from '../types';

export const forceTableGuide: SimGuideContent = {
  learningGoals: [
    'Resolve forces into $x$ and $y$ components.',
    'Compute the resultant of multiple forces and the equilibrant that cancels it.',
    'State the equilibrium condition $\\sum \\vec{F} = 0$ when several nonzero forces act.',
    'Connect graphical vector addition with component sums.',
  ],
  howToUse: [
    'Start with two forces and display components and resultant.',
    'Adjust magnitudes and angles until you can predict $\\sum F_x$ and $\\sum F_y$.',
    'Use Apply equilibrant to lock a 4th force that cancels $\\vec{R}$.',
    'Try Random challenge: predict the hidden force before revealing.',
    'Use the component table in Live Dynamics as a numeric check of the arrows.',
  ],
  watchFors: [
    'Thinking equilibrium means no forces act on the ring.',
    'Confusing resultant direction with equilibrant direction.',
    'Adding force magnitudes without using angles.',
    'Assuming three-force equilibrium requires equal magnitudes.',
  ],
  canvasTips: [
    'Angles are measured counterclockwise from $+x$ unless noted otherwise.',
    'Resultant $\\vec{R}$ points with the vector sum; equilibrant is opposite $\\vec{R}$.',
    'Component arrows help you see why a large force can still cancel.',
    'Challenge mode hides one force vector until you Reveal.',
  ],
  tryThis:
    'Place two equal forces $120^\\circ$ apart and inspect $\\vec{R}$. Can two such forces alone produce equilibrium? Then introduce a third force.',
  revisionProblems: [
    {
      id: 'ft-1',
      prompt:
        'Force A: $10\\,\\mathrm{N}$ at $0^\\circ$. Force B: $10\\,\\mathrm{N}$ at $90^\\circ$. Find $\\vec{R}$ and the equilibrant (magnitude and angle).',
      hint: '$\\sum F_x = 10$, $\\sum F_y = 10$ → $R = 10\\sqrt{2}$ at $45^\\circ$. Equilibrant opposite.',
      checkWithSim: [
        'Set two forces to $10\\,\\mathrm{N}$ at $0^\\circ$ and $90^\\circ$.',
        'Read resultant and equilibrant metrics, or Apply equilibrant.',
      ],
      answer:
        '$R = 10\\sqrt{2} \\approx 14.14\\,\\mathrm{N}$ at $45^\\circ$. Equilibrant $\\approx 14.14\\,\\mathrm{N}$ at $225^\\circ$ (or $-135^\\circ$).',
      simParams: { activeCount: 2, f1: 10, a1: 0, f2: 10, a2: 90 },
    },
    {
      id: 'ft-2',
      prompt:
        'Three forces of equal magnitude $8\\,\\mathrm{N}$ at $0^\\circ$, $120^\\circ$, and $240^\\circ$. What is the resultant?',
      hint: 'Symmetric $120^\\circ$ spacing of equal vectors sums to zero.',
      checkWithSim: [
        'Set three equal forces at $0^\\circ$, $120^\\circ$, $240^\\circ$.',
        'Confirm equilibrium status and $R \\approx 0$.',
      ],
      answer:
        '$R \\approx 0$. The ring is in equilibrium even though three substantial forces act. Equilibrium ≠ absence of force.',
      simParams: { activeCount: 3, f1: 8, a1: 0, f2: 8, a2: 120, f3: 8, a3: 240 },
    },
    {
      id: 'ft-3',
      prompt:
        'Two forces: $12\\,\\mathrm{N}$ at $0^\\circ$ and $5\\,\\mathrm{N}$ at $180^\\circ$. A student says “net force is $17\\,\\mathrm{N}$.” Correct them.',
      hint: 'Opposite directions: components subtract.',
      checkWithSim: [
        'Set the two forces and read $\\sum F_x$ and $R$.',
      ],
      answer:
        'They are collinear and opposite: $\\sum F_x = 12 - 5 = 7\\,\\mathrm{N}$, $R = 7\\,\\mathrm{N}$ at $0^\\circ$. Magnitudes do not add when directions oppose.',
      simParams: { activeCount: 2, f1: 12, a1: 0, f2: 5, a2: 180 },
    },
    {
      id: 'ft-4',
      prompt:
        'You measure $R = 6\\,\\mathrm{N}$ at $30^\\circ$. What single force restores equilibrium? If you accidentally apply that force at $30^\\circ$ instead, what happens?',
      hint: 'Equilibrant is $\\vec{R}$ reversed, not $\\vec{R}$ repeated.',
      checkWithSim: [
        'Create any configuration with $R \\approx 6\\,\\mathrm{N}$ at $30^\\circ$.',
        'Apply equilibrant at $210^\\circ$, then wrongly at $30^\\circ$, and compare residual.',
      ],
      answer:
        'Equilibrant: $6\\,\\mathrm{N}$ at $210^\\circ$. Applying $6\\,\\mathrm{N}$ at $30^\\circ$ doubles the resultant ($\\sim 12\\,\\mathrm{N}$) and drives the system farther from equilibrium.',
      simParams: { activeCount: 2, f1: 6, a1: 30, f2: 0, a2: 0 },
    },
  ],
};
