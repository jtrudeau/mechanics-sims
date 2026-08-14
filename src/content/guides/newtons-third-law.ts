import type { SimGuideContent } from '../types';

export const newtonsThirdLawGuide: SimGuideContent = {
  learningGoals: [
    'State that interaction forces are equal in magnitude and opposite in direction.',
    'Separate the third-law pair from the net force that produces acceleration.',
    'Show that $F_{12} = m_2 a$ even when $m_1 \\neq m_2$.',
    'Recognize the same equal-and-opposite pair for contact, friction (stacked), and incline setups.',
  ],
  howToUse: [
    'Start with scenario 1 (side-by-side). Set unequal masses and a positive $F_\\mathrm{app}$.',
    'Compare Live Dynamics $F_{12}$ and $F_{21}$ — they stay equal and opposite.',
    'Move to scenario 2 (stacked): the pair is now friction at the interface, same magnitudes.',
    'Move to scenario 3 (incline): change $\\theta$ and watch $a$ shift while $F_{12}$ still tracks $F_\\mathrm{app}$.',
    'Relate $F_{12}$ to $m_2 F_\\mathrm{app}/(m_1+m_2)$ in every scenario.',
  ],
  watchFors: [
    'Believing the larger mass pushes harder on the smaller mass.',
    'Thinking equal-and-opposite forces cancel so nothing can accelerate.',
    'Mixing up $F_{12}$ (force on 2 by 1) with the external applied force.',
    'Assuming an incline automatically changes the contact force (it need not, for frictionless contact).',
  ],
  canvasTips: [
    'Scenario tabs step from contact push → friction pair → ramp.',
    'Labels include “on 1” / “on 2” so each force sits on the correct free-body diagram.',
    'Both blocks share one acceleration while they move together.',
    'On the incline, $a$ includes gravity; $F_{12}$ still equals $m_2 F_\\mathrm{app}/(m_1+m_2)$.',
  ],
  tryThis:
    'Set $m_1 = 15\\,\\mathrm{kg}$ and $m_2 = 3\\,\\mathrm{kg}$. Compare $|F_{12}|$ and $|F_{21}|$ in all three scenarios.',
  revisionProblems: [
    {
      id: 'n3-1',
      prompt:
        'Scenario 1: $m_1 = 6\\,\\mathrm{kg}$, $m_2 = 2\\,\\mathrm{kg}$, $F_\\mathrm{app} = 24\\,\\mathrm{N}$ on $m_1$ pushing $m_2$. Find system $a$ and the contact force $F_{12}$.',
      hint: '$a = F_\\mathrm{app}/(m_1+m_2)$; $F_{12} = m_2 a$.',
      checkWithSim: [
        'Use Side-by-side; set $m_1 = 6$, $m_2 = 2$, $F_\\mathrm{app} = 24$.',
        'Read acceleration and contact forces in Live Dynamics.',
      ],
      answer:
        '$a = 24/8 = 3\\,\\mathrm{m/s}^2$. $F_{12} = 2 \\times 3 = 6\\,\\mathrm{N}$. $F_{21} = -6\\,\\mathrm{N}$ (equal magnitude, opposite direction).',
      simParams: { m1: 6, m2: 2, F_app: 24, scenario: 'side-by-side' },
    },
    {
      id: 'n3-2',
      prompt:
        'Scenario 2 (stacked, sticky): same masses and $F_\\mathrm{app} = 24\\,\\mathrm{N}$ on the bottom block. What are $a$ and the friction pair?',
      hint: 'If they stick, system $a$ matches the side-by-side case; friction on the top block is $m_2 a$.',
      checkWithSim: [
        'Switch to Stacked with the same masses and $F_\\mathrm{app}$.',
        'Confirm $F_{12}$ and $F_{21}$ match the side-by-side values.',
      ],
      answer:
        '$a = 3\\,\\mathrm{m/s}^2$ still. Friction on $m_2$ is $F_{12} = 6\\,\\mathrm{N}$ forward; $F_{21} = -6\\,\\mathrm{N}$ on $m_1$. Same third-law pair, different agent (friction vs normal contact).',
      simParams: { m1: 6, m2: 2, F_app: 24, scenario: 'stacked' },
    },
    {
      id: 'n3-3',
      prompt:
        'Scenario 3: same masses, $F_\\mathrm{app} = 24\\,\\mathrm{N}$ up a frictionless incline at $\\theta = 20^\\circ$. Does $F_{12}$ change from the level case? Does $a$?',
      hint: 'For frictionless contact, $F_{12} = m_2 F_\\mathrm{app}/(m_1+m_2)$. Gravity enters $a$, not the contact share of $F_\\mathrm{app}$.',
      checkWithSim: [
        'Open Incline; set $\\theta = 20^\\circ$, $m_1 = 6$, $m_2 = 2$, $F_\\mathrm{app} = 24$.',
        'Compare $F_{12}$ with the level-case value; note $a$.',
      ],
      answer:
        '$F_{12}$ is still $6\\,\\mathrm{N}$. Acceleration becomes $a = F_\\mathrm{app}/M - g\\sin\\theta \\approx 3 - 9.8\\sin 20^\\circ \\approx -0.35\\,\\mathrm{m/s}^2$ (may slide down while the push still loads the contact).',
      simParams: { m1: 6, m2: 2, F_app: 24, theta: 20, scenario: 'incline' },
    },
    {
      id: 'n3-4',
      prompt:
        'Why don’t $F_{12}$ and $F_{21}$ cancel to give zero acceleration of the system?',
      hint: 'Ask which object each force acts on.',
      checkWithSim: [
        'Identify which arrow acts on which block on the canvas.',
        'Note that $F_\\mathrm{app}$ is external and only acts on one block.',
      ],
      answer:
        'They act on different objects, so they never sum on a single free-body diagram. For the two-block system, the contact forces are internal and cancel in the system net force; external $F_\\mathrm{app}$ (and gravity on an incline) still accelerate the system.',
      simParams: { m1: 6, m2: 2, F_app: 24, scenario: 'side-by-side' },
    },
  ],
};
