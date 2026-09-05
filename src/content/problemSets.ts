import type { ProblemFigureId } from '../components/figures/ProblemFigures';
import { homeworkBySet } from './multistepProblems';
import { teacherWriteups } from './teacherWriteups';
import type { TopicGroup } from './types';

export type ProblemKind = 'numeric' | 'choice';

export interface ProblemSource {
  credit: string;
  url?: string;
}

export interface StudentProblem {
  id: string;
  prompt: string;
  kind: ProblemKind;
  /** Numeric expected value, or choice id. */
  answer: number | string;
  /** Absolute tolerance for numeric answers. */
  tolerance?: number;
  units?: string;
  choices?: { id: string; label: string }[];
  hint: string;
  solution: string;
  simSlug?: string;
  simParams?: Record<string, string | number | boolean>;
}

export interface MultiStepProblem {
  id: string;
  kind: 'multistep';
  title: string;
  stem: string;
  figure?: ProblemFigureId;
  source?: ProblemSource;
  simSlug?: string;
  simParams?: Record<string, string | number | boolean>;
  parts: StudentProblem[];
  /** Full worked solution, shown after unlock. */
  teacherSolution?: string[];
}

export type ProblemItem = StudentProblem | MultiStepProblem;

export function isMultiStep(problem: ProblemItem): problem is MultiStepProblem {
  return problem.kind === 'multistep';
}

export interface ProblemSet {
  id: string;
  title: string;
  topicGroup: TopicGroup;
  blurb: string;
  simSlug?: string;
  problems: ProblemItem[];
}

const baseSets: ProblemSet[] = [
  // ── Unit 1: Kinematics ──
  {
    id: 'instant-v',
    title: 'Instantaneous vs average velocity',
    topicGroup: 'kinematics',
    blurb: 'Secant slope versus tangent slope on an $x$–$t$ graph.',
    simSlug: 'instantaneous-velocity',
    problems: [
      {
        id: 'ps-iv-1',
        prompt:
          'With $a = 1\\,\\mathrm{m/s}^2$, $v_0 = 2\\,\\mathrm{m/s}$, $t_1 = 2\\,\\mathrm{s}$, what is the instantaneous velocity?',
        kind: 'numeric',
        answer: 4,
        tolerance: 0.05,
        units: 'm/s',
        hint: '$v(t) = v_0 + at$.',
        solution: '$v(2) = 2 + 1\\cdot 2 = 4\\,\\mathrm{m/s}$ (tangent slope).',
        simSlug: 'instantaneous-velocity',
        simParams: { x0: 0, v0: 2, a: 1, t1: 2, dt: 2, tMax: 8 },
      },
      {
        id: 'ps-iv-2',
        prompt:
          'Same setup, $\\Delta t = 2\\,\\mathrm{s}$. What is the average velocity over $[2, 4]\\,\\mathrm{s}$?',
        kind: 'numeric',
        answer: 5,
        tolerance: 0.08,
        units: 'm/s',
        hint: '$x(t) = 2t + \\tfrac{1}{2}t^2$. Compute $[x(4)-x(2)]/2$.',
        solution: '$x(4) = 16$, $x(2) = 6$, so $v_\\mathrm{avg} = 5\\,\\mathrm{m/s}$ (secant, steeper than the tangent).',
        simSlug: 'instantaneous-velocity',
        simParams: { x0: 0, v0: 2, a: 1, t1: 2, dt: 2, tMax: 8 },
      },
      {
        id: 'ps-iv-3',
        prompt: 'As $\\Delta t \\to 0$, the secant slope',
        kind: 'choice',
        answer: 'tangent',
        choices: [
          { id: 'zero', label: 'goes to zero' },
          { id: 'avg', label: 'stays equal to the full-trip average velocity' },
          { id: 'tangent', label: 'approaches the tangent slope at $t_1$' },
          { id: 'a', label: 'approaches the acceleration $a$' },
        ],
        hint: 'That limit is the definition of $v = dx/dt$.',
        solution: 'The blue secant converges on the green tangent; Convergence approaches 100%.',
        simSlug: 'instantaneous-velocity',
        simParams: { x0: 0, v0: 2, a: 1, t1: 2, dt: 0.2, tMax: 8 },
      },
    ],
  },
  {
    id: 'graphs-1d',
    title: 'Graphical analysis (x, v, a)',
    topicGroup: 'kinematics',
    blurb: 'Slope and signed area on stacked kinematics graphs.',
    simSlug: 'kinematics-graphs',
    problems: [
      {
        id: 'ps-kg-1',
        prompt:
          'Constant $a = 2\\,\\mathrm{m/s}^2$, $v_0 = 0$. What is $v$ at $t = 3\\,\\mathrm{s}$?',
        kind: 'numeric',
        answer: 6,
        tolerance: 0.08,
        units: 'm/s',
        hint: '$v = v_0 + at$. Open Kinematics Graphs with Constant $a$.',
        solution: '$v(3) = 0 + 2\\cdot 3 = 6\\,\\mathrm{m/s}$. On $v$–$t$ this is the height at $t = 3$.',
        simSlug: 'kinematics-graphs',
        simParams: { profile: 'const-a', a: 2, v0: 0, x0: 0, tCursor: 3 },
      },
      {
        id: 'ps-kg-2',
        prompt:
          'Same motion. Signed area under $v$–$t$ from $0$ to $3\\,\\mathrm{s}$ equals $\\Delta x$. What is that displacement?',
        kind: 'numeric',
        answer: 9,
        tolerance: 0.12,
        units: 'm',
        hint: '$v$–$t$ is a triangle of base $3\\,\\mathrm{s}$ and height $6\\,\\mathrm{m/s}$.',
        solution: '$\\tfrac{1}{2}(3)(6) = 9\\,\\mathrm{m}$. Also $x = \\tfrac{1}{2}at^2 = 9\\,\\mathrm{m}$.',
        simSlug: 'kinematics-graphs',
        simParams: { profile: 'const-a', a: 2, v0: 0, tA: 0, tB: 3, tCursor: 3 },
      },
      {
        id: 'ps-kg-3',
        prompt:
          'Turnaround profile ($a = -2\\,\\mathrm{m/s}^2$, $v_0 = 8\\,\\mathrm{m/s}$). At what time does velocity change sign?',
        kind: 'numeric',
        answer: 4,
        tolerance: 0.08,
        units: 's',
        hint: 'Set $v(t) = 8 - 2t = 0$. The $x$–$t$ graph peaks there.',
        solution: '$t = 4\\,\\mathrm{s}$. Before that $v > 0$ (still $+x$); after that the cart returns.',
        simSlug: 'kinematics-graphs',
        simParams: { profile: 'turnaround', tCursor: 4 },
      },
      {
        id: 'ps-kg-4',
        prompt: 'During a cruise (constant $v$) segment, the $a$–$t$ graph is',
        kind: 'choice',
        answer: 'zero',
        choices: [
          { id: 'pos', label: 'a positive constant' },
          { id: 'zero', label: 'zero (on the t-axis)' },
          { id: 'neg', label: 'a negative constant' },
          { id: 'curve', label: 'a downward parabola' },
        ],
        hint: 'Cruise means $v$ does not change, so $a = dv/dt = 0$.',
        solution:
          'Zero. $v$–$t$ is horizontal; $x$–$t$ is a straight line whose slope equals that cruise speed.',
        simSlug: 'kinematics-graphs',
        simParams: { profile: 'cruise', tA: 2.5, tB: 4.5, tCursor: 3.5 },
      },
    ],
  },
  {
    id: 'circular',
    title: 'Circular motion',
    topicGroup: 'kinematics',
    blurb: 'Radial vs tangential acceleration and $v = \\omega R$.',
    simSlug: 'circular-motion',
    problems: [
      {
        id: 'ps-cm-1',
        prompt:
          'Uniform circular motion: $R = 4.0\\,\\mathrm{m}$, $\\omega = 2.0\\,\\mathrm{rad/s}$. What is $a_r$?',
        kind: 'numeric',
        answer: 16,
        tolerance: 0.2,
        units: 'm/s²',
        hint: '$a_r = \\omega^2 R = v^2/R$. Set $\\alpha = 0$.',
        solution: '$a_r = (2)^2(4) = 16\\,\\mathrm{m/s}^2$. Then $a_t = 0$.',
        simSlug: 'circular-motion',
        simParams: { R: 4, w0: 2, alpha: 0 },
      },
      {
        id: 'ps-cm-2',
        prompt: 'If $\\alpha \\neq 0$, which statement is true?',
        kind: 'choice',
        answer: 'both',
        choices: [
          { id: 'ar-only', label: '$a_r$ is the only acceleration; speed is constant' },
          { id: 'at-only', label: 'Only $a_t$ exists; the path is still a circle' },
          { id: 'both', label: 'Both $a_r$ (direction) and $a_t$ (speed) are present' },
          { id: 'none', label: 'Net acceleration is zero because the radius is fixed' },
        ],
        hint: '$a_r$ changes direction of $\\vec{v}$; $a_t = \\alpha R$ changes $|\\vec{v}|$.',
        solution: 'Non-uniform circular motion has both components. Freeze the canvas to read the vectors.',
        simSlug: 'circular-motion',
        simParams: { R: 5, w0: 1, alpha: 0.4 },
      },
    ],
  },

  // ── Unit 2: Dynamics & Forces ──
  {
    id: 'n2-cart',
    title: "Newton's second law (cart + hanger)",
    topicGroup: 'forces',
    blurb: 'System $a$ and tension with optional friction.',
    simSlug: 'newtons-second-law-cart',
    problems: [
      {
        id: 'ps-n2-1',
        prompt:
          'Frictionless: $m_c = 2.0\\,\\mathrm{kg}$, $m_h = 0.50\\,\\mathrm{kg}$. Magnitude of $a$? Use $g = 9.8\\,\\mathrm{m/s}^2$.',
        kind: 'numeric',
        answer: 1.96,
        tolerance: 0.08,
        units: 'm/s²',
        hint: '$a = m_h g / (m_c + m_h)$.',
        solution: '$a = (0.50\\times 9.8)/(2.5) = 1.96\\,\\mathrm{m/s}^2$.',
        simSlug: 'newtons-second-law-cart',
        simParams: { mCart: 2, mHanger: 0.5, frictionEnabled: false },
      },
      {
        id: 'ps-n2-2',
        prompt: 'In the two-object system FBD (no friction), tension is',
        kind: 'choice',
        answer: 'internal',
        choices: [
          { id: 'external', label: 'an external force that appears in $\\Sigma F_\\mathrm{sys}$' },
          { id: 'internal', label: 'internal and cancels in the system equation' },
          { id: 'zero', label: 'zero because the string does not stretch' },
          { id: 'mg', label: 'equal to $m_h g$ always' },
        ],
        hint: 'Switch to System FBD in the sim. Which arrows remain?',
        solution:
          'Tension is internal. The system equation uses the hanging weight (and friction, if any) only. $T$ is found from an object FBD.',
        simSlug: 'newtons-second-law-cart',
        simParams: { mCart: 2, mHanger: 0.5, frictionEnabled: false, viewMode: 'system', showFbd: true },
      },
    ],
  },
  {
    id: 'friction',
    title: 'Static and kinetic friction',
    topicGroup: 'forces',
    blurb: 'The static limit and the drop to kinetic friction.',
    simSlug: 'friction',
    problems: [
      {
        id: 'ps-fr-1',
        prompt:
          '$m = 2.0\\,\\mathrm{kg}$, $\\mu_s = 0.40$. Maximum static friction? ($g = 9.8$)',
        kind: 'numeric',
        answer: 7.84,
        tolerance: 0.15,
        units: 'N',
        hint: '$f_s^\\mathrm{max} = \\mu_s mg$.',
        solution: '$0.40 \\times 2.0 \\times 9.8 = 7.84\\,\\mathrm{N}$. Below this, $f_s = F_\\mathrm{app}$.',
        simSlug: 'friction',
        simParams: { mass: 2, mu_s: 0.4, mu_k: 0.3 },
      },
      {
        id: 'ps-fr-2',
        prompt: 'Once the block starts sliding, kinetic friction compared with $f_s^\\mathrm{max}$ is typically',
        kind: 'choice',
        answer: 'smaller',
        choices: [
          { id: 'equal', label: 'equal, because $\\mu$ is the same' },
          { id: 'larger', label: 'larger, because the block is moving' },
          { id: 'smaller', label: 'smaller ($\\mu_k < \\mu_s$)' },
          { id: 'zero', label: 'zero on a horizontal surface' },
        ],
        hint: 'Watch $f$ vs $F_\\mathrm{app}$ as you pass the static limit.',
        solution:
          'Kinetic friction drops to $\\mu_k mg$. That is why a larger push is needed to start than to keep moving.',
        simSlug: 'friction',
        simParams: { mass: 2, mu_s: 0.4, mu_k: 0.25 },
      },
    ],
  },
  {
    id: 'n3',
    title: "Newton's third law",
    topicGroup: 'forces',
    blurb: 'Pair forces vs the net force that produces $a$.',
    simSlug: 'newtons-third-law',
    problems: [
      {
        id: 'ps-n3-1',
        prompt:
          'Side-by-side, frictionless floor, $F_\\mathrm{app}$ on $m_1$ only. $|\\vec{F}_{12}|$ compared with $|\\vec{F}_{21}|$ is',
        kind: 'choice',
        answer: 'equal',
        choices: [
          { id: 'larger', label: 'larger, because $m_1$ is pushed' },
          { id: 'smaller', label: 'smaller, because $m_2$ “only reacts”' },
          { id: 'equal', label: 'equal at every instant (third-law pair)' },
          { id: 'zero', label: 'zero unless the blocks stick' },
        ],
        hint: 'Third-law pairs are equal and opposite even when the system accelerates.',
        solution:
          'Equal. $F_\\mathrm{app}$ is not a partner of $F_{12}$. Net force on each block can differ; the pair magnitudes do not.',
        simSlug: 'newtons-third-law',
        simParams: { scenario: 'side-by-side' },
      },
      {
        id: 'ps-n3-2',
        prompt:
          'Frictionless: $m_1 = 3\\,\\mathrm{kg}$, $m_2 = 1\\,\\mathrm{kg}$, $F_\\mathrm{app} = 8\\,\\mathrm{N}$ on $m_1$ (pushing $m_2$). Contact force on $m_2$?',
        kind: 'numeric',
        answer: 2,
        tolerance: 0.08,
        units: 'N',
        hint: '$a = F_\\mathrm{app}/(m_1+m_2)$. Then $F_{12} = m_2 a$.',
        solution: '$a = 8/4 = 2\\,\\mathrm{m/s}^2$, so $F_{12} = 1\\times 2 = 2\\,\\mathrm{N}$.',
        simSlug: 'newtons-third-law',
        simParams: { scenario: 'side-by-side', m1: 3, m2: 1, F_app: 8 },
      },
    ],
  },
  {
    id: 'force-table',
    title: 'Force table equilibrium',
    topicGroup: 'forces',
    blurb: 'Components, resultant, and equilibrant.',
    simSlug: 'force-table-equilibrium',
    problems: [
      {
        id: 'ps-ft-1',
        prompt:
          'Two forces: $5.0\\,\\mathrm{N}$ at $0^\\circ$ and $5.0\\,\\mathrm{N}$ at $90^\\circ$. Magnitude of the resultant?',
        kind: 'numeric',
        answer: 7.07,
        tolerance: 0.12,
        units: 'N',
        hint: '$R = \\sqrt{R_x^2 + R_y^2}$ with $R_x = R_y = 5$.',
        solution: '$R = 5\\sqrt{2} \\approx 7.07\\,\\mathrm{N}$ at $45^\\circ$. Equilibrant: same magnitude at $225^\\circ$.',
        simSlug: 'force-table-equilibrium',
        simParams: { activeCount: 2, f1: 5, a1: 0, f2: 5, a2: 90 },
      },
      {
        id: 'ps-ft-2',
        prompt: 'The equilibrant $\\vec{E}$ is',
        kind: 'choice',
        answer: 'negR',
        choices: [
          { id: 'sameR', label: 'equal to the resultant $\\vec{R}$' },
          { id: 'negR', label: '$-\\vec{R}$, so $\\vec{R}+\\vec{E} = 0$' },
          { id: 'largest', label: 'the largest applied force on the table' },
          { id: 'weight', label: 'the weight of the ring' },
        ],
        hint: 'Equilibrium means $\\Sigma \\vec{F} = 0$.',
        solution: '$\\vec{E} = -\\vec{R}$. Show both vectors; they should be opposite.',
        simSlug: 'force-table-equilibrium',
        simParams: { activeCount: 2, f1: 5, a1: 0, f2: 5, a2: 90 },
      },
    ],
  },

  // ── Unit 3: Work & Energy ──
  {
    id: 'energy',
    title: 'Work and mechanical energy',
    topicGroup: 'energy',
    blurb: 'Turning points and frictional dissipation on a track.',
    simSlug: 'work-energy-track',
    problems: [
      {
        id: 'ps-we-1',
        prompt: 'On a frictionless track, mechanical energy $K + U_g$ is',
        kind: 'choice',
        answer: 'const',
        choices: [
          { id: 'const', label: 'constant (conservative gravity only)' },
          { id: 'drops', label: 'always decreasing because the cart moves' },
          { id: 'konly', label: 'equal to $K$ only at the bottom' },
          { id: 'zero', label: 'zero at a turning point' },
        ],
        hint: 'Turn friction off. Watch $K$ and $U_g$ trade while $E$ stays flat.',
        solution:
          'Constant. At a turning point $K \\approx 0$ but $E = U_g$ is not zero. Friction makes $E$ decrease.',
        simSlug: 'work-energy-track',
        simParams: { frictionEnabled: false },
      },
      {
        id: 'ps-we-2',
        prompt: 'With kinetic friction on, the mechanical energy of the cart–Earth system',
        kind: 'choice',
        answer: 'decreases',
        choices: [
          { id: 'increases', label: 'increases because friction does positive work' },
          { id: 'decreases', label: 'decreases; $|W_\\mathrm{nc}|$ leaves the mechanical account' },
          { id: 'const', label: 'stays constant; friction is internal' },
          { id: 'osc', label: 'oscillates with the same amplitude forever' },
        ],
        hint: 'Enable friction and compare $E$ at two passing of the same height.',
        solution: 'Non-conservative work $W_\\mathrm{nc} = -f_k d$ reduces $E$. Turning points get lower.',
        simSlug: 'work-energy-track',
        simParams: { frictionEnabled: true },
      },
    ],
  },

  // ── Unit 4: Rotational Dynamics ──
  {
    id: 'rot-kin',
    title: 'Rotational kinematics graphs',
    topicGroup: 'rotation',
    blurb: 'θ–t, ω–t, α–t and $v_t = \\omega R$.',
    simSlug: 'rotational-kinematics',
    problems: [
      {
        id: 'ps-rk-1',
        prompt:
          'Constant $\\alpha = 1.5\\,\\mathrm{rad/s}^2$, $\\omega_0 = 0$. What is $\\omega$ at $t = 4\\,\\mathrm{s}$?',
        kind: 'numeric',
        answer: 6,
        tolerance: 0.08,
        units: 'rad/s',
        hint: '$\\omega = \\omega_0 + \\alpha t$.',
        solution: '$\\omega(4) = 6\\,\\mathrm{rad/s}$. $\\theta(4) = 12\\,\\mathrm{rad}$.',
        simSlug: 'rotational-kinematics',
        simParams: { profile: 'const-alpha', alpha: 1.5, w0: 0, tCursor: 4 },
      },
      {
        id: 'ps-rk-2',
        prompt:
          'Same motion. Area under $\\omega$–$t$ from $0$ to $4\\,\\mathrm{s}$ is $\\Delta\\theta$. Value?',
        kind: 'numeric',
        answer: 12,
        tolerance: 0.15,
        units: 'rad',
        hint: 'Triangle: $\\tfrac{1}{2}\\times 4\\times 6$.',
        solution: '$12\\,\\mathrm{rad}$. Graphs use unwrapped radians, not degrees.',
        simSlug: 'rotational-kinematics',
        simParams: { profile: 'const-alpha', alpha: 1.5, w0: 0, tA: 0, tB: 4 },
      },
      {
        id: 'ps-rk-3',
        prompt:
          '$R = 0.40\\,\\mathrm{m}$, $\\omega = 5.0\\,\\mathrm{rad/s}$. Rim speed $v_t$?',
        kind: 'numeric',
        answer: 2,
        tolerance: 0.05,
        units: 'm/s',
        hint: '$v_t = \\omega R$.',
        solution: '$5.0 \\times 0.40 = 2.0\\,\\mathrm{m/s}$. Doubling $R$ doubles $v_t$, not $\\omega$.',
        simSlug: 'rotational-kinematics',
        simParams: { profile: 'const-omega', w0: 5, R: 0.4 },
      },
    ],
  },
  {
    id: 'torque',
    title: 'Torque and $I\\alpha$',
    topicGroup: 'rotation',
    blurb: 'Net torque, moment of inertia, and angular acceleration.',
    simSlug: 'fixed-axis-rotation',
    problems: [
      {
        id: 'ps-tx-1',
        prompt:
          'Solid disk, $I = 2.0\\,\\mathrm{kg\\,m}^2$, $\\tau_\\mathrm{net} = 6.0\\,\\mathrm{N\\,m}$. What is $\\alpha$?',
        kind: 'numeric',
        answer: 3,
        tolerance: 0.08,
        units: 'rad/s²',
        hint: '$\\tau_\\mathrm{net} = I\\alpha$.',
        solution: '$\\alpha = 6/2 = 3\\,\\mathrm{rad/s}^2$.',
        simSlug: 'fixed-axis-rotation',
        simParams: { preset: 'solid-disk' },
      },
      {
        id: 'ps-tx-2',
        prompt: 'For the same $M$ and $R$, a hoop compared with a solid disk has',
        kind: 'choice',
        answer: 'largerI',
        choices: [
          { id: 'sameI', label: 'the same $I$, so the same $\\alpha$' },
          { id: 'largerI', label: 'larger $I$, so smaller $|\\alpha|$ for the same $\\tau$' },
          { id: 'smallerI', label: 'smaller $I$, so it spins up faster' },
          { id: 'zeroI', label: '$I = 0$ because the rim is thin' },
        ],
        hint: 'Turn on Compare disk vs hoop. Mass farther from the axis raises $I$.',
        solution: 'Hoop $I = MR^2 > \\tfrac{1}{2}MR^2$ for the disk, so smaller $\\alpha$ for the same torque.',
        simSlug: 'fixed-axis-rotation',
        simParams: { compareDiskHoop: true, preset: 'solid-disk' },
      },
    ],
  },
];

export const problemSets: ProblemSet[] = baseSets.map((set) => ({
  ...set,
  problems: [
    ...set.problems,
    ...(homeworkBySet[set.id] ?? []).map((p) => ({
      ...p,
      teacherSolution: teacherWriteups[p.id],
    })),
  ],
}));

export function allProblems(): (StudentProblem & { setId: string; setTitle: string })[] {
  return problemSets.flatMap((set) =>
    set.problems.flatMap((p) => {
      const items = isMultiStep(p) ? p.parts : [p];
      return items.map((item) => ({ ...item, setId: set.id, setTitle: set.title }));
    })
  );
}

export function problemCount(): number {
  return problemSets.reduce(
    (n, s) => n + s.problems.reduce((m, p) => m + (isMultiStep(p) ? p.parts.length : 1), 0),
    0
  );
}
