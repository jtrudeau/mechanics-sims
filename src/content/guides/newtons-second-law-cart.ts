import type { SimGuideContent } from '../types';

export const newtonsSecondLawCartGuide: SimGuideContent = {
  learningGoals: [
    'Apply $\\sum F = ma$ to a cart–hanger system with shared acceleration magnitude.',
    'Explain why tension is less than the hanging weight when the system accelerates.',
    'Distinguish system-level external forces from internal tension.',
    'Predict how changing $m_c$, $m_h$, and friction changes $a$ and $T$.',
  ],
  howToUse: [
    'Start with friction off and moderate $m_h$ relative to $m_c$.',
    'Play and compare Live Dynamics $a$ and $T$ to the theory formulas.',
    'Toggle Object FBDs vs System FBD to see when tension appears.',
    'Enable friction and find a hanging mass that stays at rest (static threshold).',
    'Increase $m_h$ past threshold and watch kinetic friction set a new $a$.',
  ],
  watchFors: [
    'Assuming tension equals $m_h g$ during acceleration.',
    'Treating cart and hanger as having different acceleration magnitudes.',
    'Including tension in the system-level net external force.',
    'Forgetting to check static friction before assuming kinetic friction.',
  ],
  canvasTips: [
    'String constraint: cart horizontal speed and hanger vertical speed share $|a|$.',
    'Cart FBD: tension, weight, normal, and friction when enabled.',
    'Hanger FBD: weight down, tension up — if $a > 0$ downward, weight exceeds tension.',
    'System view highlights external driving force vs total mass ($T$ is internal).',
  ],
  tryThis:
    'While the hanger descends, compare $T$ with $m_h g$ using the free-body diagrams and the $T$ vs $m_h g$ metric.',
  revisionProblems: [
    {
      id: 'n2-1',
      prompt:
        'Friction off: $m_c = 4\\,\\mathrm{kg}$, $m_h = 1\\,\\mathrm{kg}$, $g = 9.8\\,\\mathrm{m/s}^2$. Find $a$ and $T$.',
      hint: '$a = m_h g / (m_c + m_h)$; $T = m_c a = m_h (g - a)$.',
      checkWithSim: [
        'Disable friction; set $m_c = 4$, $m_h = 1$, $g = 9.8$.',
        'Read $a$ and $T$ after a short run.',
      ],
      answer:
        '$a = 9.8/5 = 1.96\\,\\mathrm{m/s}^2$. $T = 4 \\times 1.96 = 7.84\\,\\mathrm{N}$ (also $1 \\times (9.8 - 1.96)$). $T < m_h g = 9.8\\,\\mathrm{N}$.',
      simParams: { mCart: 4, mHanger: 1, g: 9.8, frictionEnabled: false },
    },
    {
      id: 'n2-2',
      prompt:
        'Why is $T < m_h g$ when the hanger accelerates downward?',
      hint: 'Write $\\sum F = ma$ for the hanger alone.',
      checkWithSim: [
        'Open Object FBDs and focus on the hanger.',
        'Compare weight and tension arrows while descending; check $T$ vs $m_h g$.',
      ],
      answer:
        'For the hanger: $m_h g - T = m_h a \\Rightarrow T = m_h (g - a)$. Any downward $a$ requires weight to exceed tension.',
      simParams: { mCart: 4, mHanger: 1.2, g: 9.8, frictionEnabled: false },
    },
    {
      id: 'n2-3',
      prompt:
        'Enable friction with $\\mu_s = 0.30$, $\\mu_k = 0.20$, $m_c = 5\\,\\mathrm{kg}$. What $m_h$ keeps the system at rest? What $a$ results if $m_h = 2\\,\\mathrm{kg}$?',
      hint: 'At rest if $m_h g \\le \\mu_s m_c g$. If moving: $a = (m_h g - \\mu_k m_c g)/(m_c + m_h)$.',
      checkWithSim: [
        'Enable friction; set $\\mu_s = 0.30$, $\\mu_k = 0.20$, $m_c = 5$.',
        'Find the largest $m_h$ with $a = 0$, then set $m_h = 2$ and read $a$.',
      ],
      answer:
        'Rest requires $m_h \\le \\mu_s m_c = 1.5\\,\\mathrm{kg}$. For $m_h = 2\\,\\mathrm{kg}$: $a = (2g - 0.2\\cdot 5\\cdot g)/(5+2) = (2 - 1)g/7 \\approx 1.40\\,\\mathrm{m/s}^2$.',
      simParams: { mCart: 5, mHanger: 2, g: 9.8, frictionEnabled: true, muS: 0.3, muK: 0.2 },
    },
    {
      id: 'n2-4',
      prompt:
        'A student includes $T$ in the system net force as “the force that accelerates the cart.” Correct the reasoning.',
      hint: 'Which forces are external to the combined cart+hanger+string system?',
      checkWithSim: [
        'Compare System FBD vs Object FBDs.',
        'Note that $T$ cancels between cart and hanger.',
      ],
      answer:
        'For the two-object system, tension is internal. External forces along the motion (ideal pulley) are the hanger weight and friction on the cart. System: $a = (m_h g - f)/(m_c + m_h)$.',
      simParams: { mCart: 4, mHanger: 1.2, g: 9.8, frictionEnabled: false },
    },
  ],
};
