import type { SimGuideContent } from '../types';

export const workEnergyTrackGuide: SimGuideContent = {
  learningGoals: [
    'Track kinetic and gravitational potential energy along a constrained track.',
    'Apply $W_\\mathrm{net} = \\Delta K$ and see when $E_\\mathrm{mech}$ is conserved.',
    'Identify turning points where $K \\to 0$.',
    'Account for frictional dissipation as a decrease in mechanical energy.',
  ],
  howToUse: [
    'Start on the valley preset with friction off and a modest $v_0$.',
    'Watch the sticky energy bars beside the track: $K$ and $U_g$ trade while $E_\\mathrm{mech}$ stays flat.',
    'Enable friction and compare $E_\\mathrm{mech}$ to dissipated energy.',
    'Switch to the hill preset; lower $v_0$ until you see the Turning point ($K\\approx 0$) callout.',
    'Use the force–position / work view if available to connect signed work to $\\Delta K$.',
  ],
  watchFors: [
    'Claiming energy is “lost” with friction off (it should only transform).',
    'Confusing height on the canvas with potential reference choices.',
    'Thinking a turning point means the cart is stuck forever rather than momentarily at rest.',
    'Assuming mechanical energy is always conserved when friction is on.',
  ],
  canvasTips: [
    'Energy bars stay beside the track so you can watch conservation without scrolling.',
    'Velocity is tangent to the track; gravity is vertical.',
    'Friction (when on) opposes the tangential velocity.',
    'A yellow Turning point ($K\\approx 0$) callout appears when kinetic energy nearly vanishes.',
  ],
  tryThis:
    'With friction off, compare $E_\\mathrm{mech}$ at a high point on the track with $E_\\mathrm{mech}$ at a low point using the energy bars.',
  revisionProblems: [
    {
      id: 'we-1',
      prompt:
        'Friction off. At the bottom, $K = 40\\,\\mathrm{J}$ and $U_g = 10\\,\\mathrm{J}$. At a later height, $U_g = 35\\,\\mathrm{J}$. What is $K$ there?',
      hint: '$E_\\mathrm{mech} = K + U_g$ is constant without nonconservative work.',
      checkWithSim: [
        'Run friction-off on the valley preset.',
        'Pause near a high point and compare $K + U_g$ to the start.',
      ],
      answer:
        '$E_\\mathrm{mech} = 50\\,\\mathrm{J}$ everywhere. At $U_g = 35\\,\\mathrm{J}$, $K = 15\\,\\mathrm{J}$.',
      simParams: { mass: 2, initialSpeed: 4.2, preset: 'valley', frictionEnabled: false },
    },
    {
      id: 'we-2',
      prompt:
        'Same start as above, but friction dissipates $8\\,\\mathrm{J}$ by the time $U_g = 35\\,\\mathrm{J}$. What is $K$?',
      hint: '$E_\\mathrm{mech}^\\mathrm{final} = E_\\mathrm{mech}^\\mathrm{initial} - E_\\mathrm{diss}$.',
      checkWithSim: [
        'Enable friction and note dissipated energy alongside $K$ and $U_g$.',
      ],
      answer:
        'Mechanical energy left $= 50 - 8 = 42\\,\\mathrm{J}$. With $U_g = 35\\,\\mathrm{J}$, $K = 7\\,\\mathrm{J}$.',
      simParams: { mass: 2, initialSpeed: 4.2, preset: 'valley', frictionEnabled: true, muK: 0.08 },
    },
    {
      id: 'we-3',
      prompt:
        'What condition defines a turning point on the track? How do you create one with the hill preset?',
      hint: '$K = 0$ while a restoring component of gravity / constraint still acts.',
      checkWithSim: [
        'Choose the hill preset; reduce $v_0$ until the cart stops and reverses before the crest.',
        'Watch for the Turning point ($K\\approx 0$) callout.',
      ],
      answer:
        'A turning point is where speed (and $K$) reach zero and motion reverses. On a hill, insufficient total energy to crest means a turning point on the slope.',
      simParams: { mass: 2, initialSpeed: 2.5, preset: 'hill', frictionEnabled: false },
    },
    {
      id: 'we-4',
      prompt:
        'Does gravity’s work change $E_\\mathrm{mech}$? Does friction’s work?',
      hint: 'Conservative vs nonconservative forces.',
      checkWithSim: [
        'Friction off: watch $E_\\mathrm{mech}$ while gravity clearly does $\\pm$ work as height changes.',
        'Friction on: watch $E_\\mathrm{mech}$ fall as $E_\\mathrm{diss}$ rises.',
      ],
      answer:
        'Gravity is conservative: its work trades with $U_g$ and leaves $E_\\mathrm{mech}$ unchanged. Friction is nonconservative: its negative work decreases $E_\\mathrm{mech}$ and increases dissipated energy.',
      simParams: { mass: 2, initialSpeed: 4.2, preset: 'valley', frictionEnabled: false },
    },
  ],
};
