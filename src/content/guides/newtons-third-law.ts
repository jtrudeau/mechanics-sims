import type { SimGuideContent } from '../types';

export const newtonsThirdLawGuide: SimGuideContent = {
  learningGoals: [
    'State that interaction forces are equal in magnitude and opposite in direction.',
    'Separate the third-law pair from the net force that produces acceleration.',
    'Show that $F_{12} = m_2 a$ even when $m_1 \\neq m_2$.',
    'Use the side-by-side contact setup: $F_\\mathrm{app}$ on $m_1$ pushes $m_2$ across a frictionless floor.',
  ],
  howToUse: [
    'Set unequal masses and a positive $F_\\mathrm{app}$ on $m_1$ (pushing $m_2$).',
    'Compare Live Dynamics $F_{12}$ and $F_{21}$ — they stay equal and opposite.',
    'Change $m_1$ and $m_2$ separately; confirm the pair magnitudes remain equal while $a$ and $F_{12} = m_2 a$ shift.',
    'Relate $F_{12}$ to $m_2 F_\\mathrm{app}/(m_1+m_2)$ for the side-by-side contact force.',
  ],
  watchFors: [
    'Believing the larger mass pushes harder on the smaller mass.',
    'Thinking equal-and-opposite forces cancel so nothing can accelerate.',
    'Mixing up $F_{12}$ (force on 2 by 1) with the external applied force.',
  ],
  canvasTips: [
    'Two blocks sit side by side on a frictionless floor; $m_1$ is pushed into $m_2$.',
    'Labels include “on 1” / “on 2” so each force sits on the correct free-body diagram.',
    'Both blocks share one acceleration while they move together.',
    'Live Dynamics reports $a$, $F_{12}$, and $F_{21}$ from $a = F_\\mathrm{app}/(m_1+m_2)$.',
  ],
  tryThis:
    'Set $m_1 = 15\\,\\mathrm{kg}$ and $m_2 = 3\\,\\mathrm{kg}$ with a nonzero $F_\\mathrm{app}$. Compare $|F_{12}|$ and $|F_{21}|$ in Live Dynamics.',
  revisionProblems: [
    {
      id: 'n3-1',
      prompt:
        'Side-by-side: $m_1 = 6\\,\\mathrm{kg}$, $m_2 = 2\\,\\mathrm{kg}$, $F_\\mathrm{app} = 24\\,\\mathrm{N}$ on $m_1$ pushing $m_2$. Find system $a$ and the contact force $F_{12}$.',
      hint: '$a = F_\\mathrm{app}/(m_1+m_2)$; $F_{12} = m_2 a$.',
      checkWithSim: [
        'Set $m_1 = 6$, $m_2 = 2$, $F_\\mathrm{app} = 24$.',
        'Read acceleration and contact forces in Live Dynamics.',
      ],
      answer:
        '$a = 24/8 = 3\\,\\mathrm{m/s}^2$. $F_{12} = 2 \\times 3 = 6\\,\\mathrm{N}$. $F_{21} = -6\\,\\mathrm{N}$ (equal magnitude, opposite direction).',
      simParams: { m1: 6, m2: 2, F_app: 24 },
    },
    {
      id: 'n3-2',
      prompt:
        'Same masses, now $F_\\mathrm{app} = 24\\,\\mathrm{N}$ but $m_1 = 2\\,\\mathrm{kg}$ and $m_2 = 6\\,\\mathrm{kg}$. How do $a$ and $F_{12}$ compare with problem 1?',
      hint: 'System $a$ is unchanged if total mass and $F_\\mathrm{app}$ are unchanged; $F_{12} = m_2 a$ tracks the pushed mass.',
      checkWithSim: [
        'Set $m_1 = 2$, $m_2 = 6$, $F_\\mathrm{app} = 24$.',
        'Compare $a$ and $F_{12}$ with the previous setup.',
      ],
      answer:
        '$a = 24/8 = 3\\,\\mathrm{m/s}^2$ still. Now $F_{12} = 6 \\times 3 = 18\\,\\mathrm{N}$. Same third-law pair magnitudes ($|F_{21}| = 18\\,\\mathrm{N}$), larger contact share because $m_2$ is heavier.',
      simParams: { m1: 2, m2: 6, F_app: 24 },
    },
    {
      id: 'n3-3',
      prompt:
        'With $m_1 = 5\\,\\mathrm{kg}$, $m_2 = 1\\,\\mathrm{kg}$, and $F_\\mathrm{app} = 12\\,\\mathrm{N}$, find $|F_{12}|$ and $|F_{21}|$. Which block has the larger net force?',
      hint: 'Pair magnitudes are equal; net force on each block is $m_i a$.',
      checkWithSim: [
        'Set $m_1 = 5$, $m_2 = 1$, $F_\\mathrm{app} = 12$.',
        'Read $F_{12}$ and $F_{21}$; compare with $m_1 a$ and $m_2 a$.',
      ],
      answer:
        '$a = 12/6 = 2\\,\\mathrm{m/s}^2$. $|F_{12}| = |F_{21}| = m_2 a = 2\\,\\mathrm{N}$. Net force on $m_1$ is $F_\\mathrm{app}-|F_{21}| = 10\\,\\mathrm{N} = m_1 a$; on $m_2$ it is $2\\,\\mathrm{N}$. The pair is equal; the nets are not.',
      simParams: { m1: 5, m2: 1, F_app: 12 },
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
        'They act on different objects, so they never sum on a single free-body diagram. For the two-block system, the contact forces are internal and cancel in the system net force; external $F_\\mathrm{app}$ still accelerates the system.',
      simParams: { m1: 6, m2: 2, F_app: 24 },
    },
  ],
};
